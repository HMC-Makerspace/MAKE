import { API_SCOPE, UnixTimestamp, UUID } from "common/global";
import {
    CHECKOUT_VALIDATION,
    TCheckout,
    TCheckoutItem,
    TCheckoutItemUnavailability,
    TCheckoutValidation,
} from "common/checkout";
import { Checkout } from "models/checkout.model";
import mongoose from "mongoose";
import { InventoryItem } from "models/inventory.model";
import { Machine } from "models/machine.model";
import { Area } from "models/area.model";
import {
    InventoryItemUUID,
    ITEM_RELATIVE_QUANTITY,
    ITEM_ROLE,
    TInventoryItem,
} from "common/inventory";
import { getUser } from "./user.controller";
import { StatusCodes } from "http-status-codes";
import { Response } from "express";
import { verify } from "crypto";
import { verifyRequest } from "./verify.controller";
import { sendTemplatedEmail } from "./email.controller";
import {
    clearInventoryAvailability,
    getInventoryItems,
} from "./inventory.controller";
import ExpiredCheckoutTemplate from "email_templates/expired_checkout";
import { Logger } from "pino";
import {
    clearMachineReservations,
    reserveMachineInstance,
} from "./machine.controller";
import { clearAreaReservations, patchArea } from "./area.controller";
import { getConfig } from "./config.controller";

/**
 * Get all checkouts in the database
 * @returns A promise to list of TCheckouts objects representing all users in the db
 */
export async function getCheckouts(): Promise<TCheckout[]> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    return Checkouts.find().sort({
        timestamp_in: 1,
        timestamp_out: 1,
        timestamp_due: 1,
    });
}

/**
 * Get a specific checkout's information, searching by UUID
 * @param uuid The checkout's UUID to search by
 * @returns A promise to a TCheckout object, or null if no user has the given UUID
 */
export async function getCheckout(uuid: UUID): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    return Checkouts.findOne({ uuid: uuid });
}

/**
 * Get all checkouts made by a specific user
 * @param user_uuid The user's UUID to search by
 * @returns A promise to a list of TCheckout objects, or an empty list if the
 *    user has made no checkouts
 */
export async function getCheckoutsByUser(
    user_uuid: UUID,
): Promise<TCheckout[]> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    return Checkouts.find({ checked_out_by: user_uuid });
}

export async function validateCheckout(
    checkout_obj: TCheckout,
): Promise<TCheckoutValidation> {
    const user = await getUser(checkout_obj.checked_out_by);
    if (!user) {
        return {
            status: CHECKOUT_VALIDATION.NO_USER,
            error_uuid: checkout_obj.checked_out_by,
        };
    }
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    const item_uuids = checkout_obj.items.map((i) => i.item_uuid);
    const items = await Inventory.find({
        uuid: {
            $in: item_uuids,
        },
    });
    if (!items) {
        return {
            status: CHECKOUT_VALIDATION.NO_ITEMS,
        };
    }
    if (await verifyRequest(user.uuid, API_SCOPE.ADMIN)) {
        return {
            status: CHECKOUT_VALIDATION.VALID,
        };
    }
    // Get item deltas
    const deltas = await getItemQuantityDeltas(
        checkout_obj.timestamp_out,
        checkout_obj.timestamp_due,
    );

    for (const item of items) {
        // For each item being checked out, verify that the user
        // has authorized roles and required certs as needed
        if (
            item.authorized_roles !== null &&
            item.authorized_roles !== undefined
        ) {
            if (item.authorized_roles.length === 0) {
                // No user roles are authorized
                return {
                    status: CHECKOUT_VALIDATION.MISSING_ROLE,
                    item_uuid: item.uuid,
                };
            }
            if (
                !item.authorized_roles.some((r) =>
                    user.active_roles.some((log) => log.role_uuid === r),
                )
            ) {
                // User doesn't have any of the authorized roles
                return {
                    status: CHECKOUT_VALIDATION.MISSING_ROLE,
                    error_uuid: item.uuid,
                    item_uuid: item.uuid,
                };
            }
        }
        for (const cert of item.required_certifications || []) {
            // User has no certs, so must not have the required certs.
            if (!user.active_certificates) {
                return {
                    status: CHECKOUT_VALIDATION.MISSING_CERT,
                    error_uuid: cert.certification_uuid,
                    item_uuid: item.uuid,
                };
            }
            if (
                !user.active_certificates?.some(
                    (c) =>
                        c.certification_uuid === cert.certification_uuid &&
                        c.level >= cert.required_level,
                )
            ) {
                // User doesn't have one of the required certs
                return {
                    status: CHECKOUT_VALIDATION.MISSING_CERT,
                    error_uuid: cert.certification_uuid,
                    item_uuid: item.uuid,
                };
            }
        }
        // If the item has a non-relative quantity that is less than the maximum
        // quantity already checked out during this duration *plus* the amount
        // requested for this checkout, it will be unavailable.
        if (
            !(item.quantity in ITEM_RELATIVE_QUANTITY) &&
            item.quantity <
                (deltas.get(item.uuid) ?? 0) +
                    (checkout_obj.items.find((c) => c.item_uuid === item.uuid)
                        ?.quantity ?? 0)
        ) {
            // Item will be not be available some time during this reservation
            return {
                status: CHECKOUT_VALIDATION.UNAVAILABLE,
                item_uuid: item.uuid,
            };
        }
    }
    return {
        status: CHECKOUT_VALIDATION.VALID,
    };
}

export async function getItemQuantityDeltas(
    timestamp_start: UnixTimestamp,
    timestamp_end: UnixTimestamp,
) {
    const Checkouts = mongoose.model("Checkout", Checkout);
    // Look for all checkouts that overlap the given range, sorting
    // by earliest end time
    const overlapping_checkouts = await Checkouts.find({
        timestamp_in: undefined,
        timestamp_out: {
            $lte: timestamp_end,
        },
        timestamp_due: {
            $gte: timestamp_start,
        },
    });

    const events: {
        items: TCheckoutItem[];
        time: UnixTimestamp;
        type: "out" | "due";
    }[] = [];
    for (const checkout of overlapping_checkouts) {
        events.push(
            {
                items: checkout.items,
                time: checkout.timestamp_out,
                type: "out",
            },
            {
                items: checkout.items,
                time: checkout.timestamp_due,
                type: "due",
            },
        );
    }
    // Sort changes by time
    events.sort((a, b) => a.time - b.time);

    // Store information about the current and maximum quantity checked out per item
    const max_deltas = new Map<InventoryItemUUID, number>();
    const current_deltas = new Map<InventoryItemUUID, number>();

    // For each checkout,
    for (const event of events) {
        // Items being checked out, add to current_deltas
        for (const item of event.items) {
            // Update current change
            current_deltas.set(
                item.item_uuid,
                (current_deltas.get(item.item_uuid) ?? 0) +
                    item.quantity * (event.type === "out" ? 1 : -1),
            );
            // Update max change
            max_deltas.set(
                item.item_uuid,
                Math.max(
                    max_deltas.get(item.item_uuid) ?? 0,
                    current_deltas.get(item.item_uuid) ?? 0,
                ),
            );
        }
    }
    return max_deltas;
}

/**
 * Get a list of time pairs where items in this checkout are unavailable.
 * @param checkout_items The list of checkout items for this request.
 * @returns A list of start and end time pairs where items are
 * unavailable.
 */
export async function getCheckoutDisabledTimes(
    checkout_items: TCheckoutItem[],
): Promise<TCheckoutItemUnavailability[]> {
    const Inventory = mongoose.model("InventoryItem", InventoryItem);
    const item_uuids = checkout_items.map((i) => i.item_uuid);
    const item_objs = await Inventory.find({
        uuid: {
            $in: item_uuids,
        },
    });
    const Checkouts = mongoose.model("Checkout", Checkout);
    // Look for all active checkouts
    const scheduled_checkouts = await Checkouts.find({
        timestamp_in: undefined,
        "items.item_uuid": {
            $in: item_uuids,
        },
    });

    const events: {
        items: TCheckoutItem[];
        time: UnixTimestamp;
        type: "out" | "due";
    }[] = [];
    for (const checkout of scheduled_checkouts) {
        events.push(
            {
                items: checkout.items,
                time: checkout.timestamp_out,
                type: "out",
            },
            {
                items: checkout.items,
                time: checkout.timestamp_due,
                type: "due",
            },
        );
    }
    // Sort checkouts by time
    events.sort((a, b) => a.time - b.time);

    const item_quantities = new Map<InventoryItemUUID, number>();
    for (const item_uuid of item_uuids) {
        const checkout_quantity =
            checkout_items.find((i) => i.item_uuid === item_uuid)?.quantity ??
            0;
        const item_quantity =
            item_objs.find((i) => i.uuid === item_uuid)?.quantity ?? 0;
        // If the item uses relative quantity, don't count it
        if (item_quantity < 0) {
            item_quantities.set(item_uuid, Infinity);
        } else {
            item_quantities.set(item_uuid, item_quantity - checkout_quantity);
        }
    }

    // Store information about the delta quantity checked out over time, the
    // last times items became unavailable, and a list of unavailable time pairs
    const current_deltas = new Map<InventoryItemUUID, number>();
    const start_times = new Map<InventoryItemUUID, UnixTimestamp>();
    const unavailable_times: TCheckoutItemUnavailability[] = [];

    // For each checkout,
    for (const event of events) {
        // Items being checked out, add to current_deltas
        for (const item of event.items) {
            current_deltas.set(
                item.item_uuid,
                (current_deltas.get(item.item_uuid) ?? 0) +
                    item.quantity * (event.type === "out" ? 1 : -1),
            );
            const delta_quantity = current_deltas.get(item.item_uuid) ?? 0;
            const item_quantity = item_quantities.get(item.item_uuid) ?? 1;
            if (event.type === "out") {
                // Checkout, determine if item is over quantity
                if (
                    delta_quantity > item_quantity &&
                    !start_times.has(item.item_uuid)
                ) {
                    start_times.set(item.item_uuid, event.time);
                }
            } else {
                // If item was over quantity but now under, add a disabled time pair.
                if (
                    delta_quantity <= item_quantity &&
                    start_times.has(item.item_uuid)
                ) {
                    unavailable_times.push({
                        item_uuid: item.item_uuid,
                        start_time: start_times.get(item.item_uuid)!,
                        end_time: event.time,
                    });
                    start_times.delete(item.item_uuid);
                }
            }
        }
    }
    return unavailable_times;
}

/**
 * Create a new checkout in the database
 * @param checkout_obj The checkout's complete information
 * @returns The checkout object
 */
export async function createCheckout(
    checkout_obj: TCheckout,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    // Check if the checkout already exists
    const existingCheckout = await Checkouts.exists({
        uuid: checkout_obj.uuid,
    });
    if (existingCheckout) {
        // If so, return null, and don't create a new checkout
        return null;
    }

    // If the user role doesn't exist, create a new user role and return it
    const newCheckout = new Checkouts(checkout_obj);

    // If checkout is in the within the next 2 minutes, update item availability preemptively
    if (checkout_obj.timestamp_out < Date.now() / 1000 + 120) {
        updateItemAvailabilities(checkout_obj.items);
    }

    return newCheckout.save();
}

/**
 * Update a Checkout information given an entire TCheckout object. Checkout is
 * found by UUID.
 * @param checkout_obj The checkout's complete and updated information
 * @returns A promise to the updated TCheckout object, or null if no checkout
 *     has the given UUID
 */
export async function updateCheckout(
    checkout_obj: TCheckout,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    // Update the given user with a new user_obj, searching by uuid
    return Checkouts.findOneAndReplace(
        { uuid: checkout_obj.uuid },
        checkout_obj,
        { returnDocument: "after" },
    );
}

/**
 * Check in a checkout in the database
 * @param checkout_uuid The checkout's UUID
 * @returns The updated checkout object, or null if no checkout has the given UUID
 */
export async function checkInCheckout(
    checkout_uuid: UUID,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    const checkout = await Checkouts.findOne({
        uuid: checkout_uuid,
    });
    if (!checkout) {
        return null;
    }
    checkout.timestamp_in = Date.now() / 1000;
    // Update item available counts if checkout was active
    if (checkout.timestamp_out < checkout.timestamp_in) {
        updateItemAvailabilities(checkout.items, undefined, undefined, false);
    }

    // Return updated checkout
    checkout.save();
    return checkout;
}

export async function undoCheckInCheckout(
    checkout_uuid: UUID,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    const checkout = await Checkouts.findOne({
        uuid: checkout_uuid,
    });
    if (!checkout) {
        return null;
    }
    // Update item available counts if checkout will be active
    if (
        checkout.timestamp_in &&
        checkout.timestamp_out < checkout.timestamp_in
    ) {
        updateItemAvailabilities(checkout.items);
    }
    checkout.timestamp_in = undefined;

    // Return updated checkout
    checkout.save();
    return checkout;
}

/**
 * Extend a checkout in the database
 * @param checkout_uuid The checkout's UUID
 * @param new_timestamp_due The new timestamp that the checkout is due
 * @returns The updated checkout object, or null if no checkout has the given UUID
 */
export async function extendCheckout(
    checkout_uuid: UUID,
    new_timestamp_due: number,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    return Checkouts.findOneAndUpdate(
        { uuid: checkout_uuid },
        {
            $set: {
                timestamp_due: new_timestamp_due,
            },
        },
        { returnDocument: "after" },
    );
}

/**
 * Delete a checkout in the database
 * @param checkout_uuid The checkout's uuid
 * @returns The checkout object, or null if no checkout has the given UUID
 */
export async function deleteCheckout(
    checkout_uuid: UUID,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkouts", Checkout);
    return Checkouts.findOneAndDelete({ uuid: checkout_uuid });
}

export async function updateItemAvailabilities(
    checkout_items: TCheckoutItem[],
    checkout_uuid?: UUID,
    logger?: Logger,
    out: boolean = true,
) {
    if (logger) {
        logger.info(
            `Cron: Updating item availabilities for checkout ${checkout_uuid}`,
        );
    }
    const items =
        (await getInventoryItems(checkout_items.map((c) => c.item_uuid))) || [];

    // Update item quantity, or machine/area reservation status
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const checkout_item = checkout_items[i];
        if (item.quantity < 0) {
            // Available quantity of relative items never changes
            return;
        }
        // Update availability
        if (out) {
            item.available =
                (item.available ?? item.quantity) - checkout_item.quantity;
        } else {
            item.available =
                (item.available ?? item.quantity) + checkout_item.quantity;
        }
        // Safety check
        if (logger && (item.available < 0 || item.available > item.quantity)) {
            logger.warn({
                msg: "Inventory item is checked out beyond quantity",
                item: item,
                checkout: checkout_item,
            });
        }
        await item.save();
        if (item.role === ITEM_ROLE.MACHINE && item.linked_uuid) {
            const machine_uuid = item.linked_uuid;
            const instance_uuid = item.uuid;
            await reserveMachineInstance(machine_uuid, instance_uuid, out);
        } else if (item.role === ITEM_ROLE.AREA && item.linked_uuid) {
            const area_uuid = item.linked_uuid;
            await patchArea(area_uuid, { reserved: out });
        }
    }
}

export async function checkoutAvailabilityCron(logger: Logger) {
    const timestamp = Date.now() / 1000;
    // Get active checkouts
    const Checkouts = mongoose.model("Checkouts", Checkout);
    const active_checkouts = await Checkouts.find({
        // Checkouts that aren't checked in
        timestamp_in: undefined,
        // and were checked out before now
        timestamp_out: { $lte: timestamp },
    });
    // Update all items to be fully available
    await clearInventoryAvailability();
    await clearMachineReservations();
    await clearAreaReservations();
    for (const checkout of active_checkouts) {
        await updateItemAvailabilities(checkout.items, checkout.uuid, logger);
    }
}

export async function checkoutEmailCron(logger: Logger) {
    const config = await getConfig();
    if (!config?.checkout.notification_interval_sec) {
        // If there is no notification interval set,
        // don't send any notifications
        return;
    }
    const reminder_frequency = config.checkout.notification_interval_sec;
    logger.info("Cron: Sending overdue checkout emails.");
    const timestamp = Date.now() / 1000;
    // Get active checkouts
    const Checkouts = mongoose.model("Checkouts", Checkout);
    const active_checkouts = await Checkouts.find({
        // Checkouts that aren't checked in
        timestamp_in: undefined,
        // and were checked out before now
        timestamp_out: { $lte: timestamp },
    });
    for (const checkout of active_checkouts) {
        const items =
            (await getInventoryItems(checkout.items.map((c) => c.item_uuid))) ||
            [];
        // Overdue emails
        const checkout_reminder_time =
            checkout.timestamp_due +
            (checkout.notifications_sent || 0) * reminder_frequency;
        if (checkout_reminder_time < timestamp) {
            // Checkout is overdue, send email to user
            const user = await getUser(checkout.checked_out_by);

            if (user && items) {
                await sendTemplatedEmail(
                    user.email,
                    "Overdue Checkout Reminder",
                    ExpiredCheckoutTemplate(checkout, items),
                    logger,
                );
                // Increase checkout notifications_sent counter
                await Checkouts.updateOne(
                    {
                        uuid: checkout.uuid,
                    },
                    {
                        notifications_sent:
                            (checkout.notifications_sent || 0) + 1,
                    },
                );
            }
        }
    }
}