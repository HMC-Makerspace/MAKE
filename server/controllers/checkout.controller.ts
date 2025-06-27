import { API_SCOPE, UnixTimestamp, UUID } from "common/global";
import {
    CHECKOUT_VALIDATION,
    TCheckout,
    TCheckoutItem,
    TCheckoutItemUnavailability,
} from "common/checkout";
import { Checkout } from "models/checkout.model";
import mongoose from "mongoose";
import { InventoryItem } from "models/inventory.model";
import { Machine } from "models/machine.model";
import { Area } from "models/area.model";
import { InventoryItemUUID, ITEM_ROLE, TInventoryItem } from "common/inventory";
import { getUser } from "./user.controller";
import { StatusCodes } from "http-status-codes";
import { Response } from "express";
import { verify } from "crypto";
import { verifyRequest } from "./verify.controller";

/**
 * Get all checkouts in the database
 * @returns A promise to list of TCheckouts objects representing all users in the db
 */
export async function getCheckouts(): Promise<TCheckout[]> {
    const Checkouts = mongoose.model("Checkout", Checkout);
    return Checkouts.find();
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

export async function validateCheckout(checkout_obj: TCheckout): Promise<{
    status: CHECKOUT_VALIDATION;
    error_uuid?: string;
    item_uuid?: string;
}> {
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
        // If the item has a quantity that is less than the maximum quantity
        // already checked out during this duration *plus* the amount requested
        // for this checkout, it will be unavailable.
        if (
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
        item_quantities.set(item_uuid, item_quantity - checkout_quantity);
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
    return Checkouts.findOneAndReplace(
        { uuid: checkout_uuid },
        { timestamp_in: new Date() },
        { returnDocument: "after" },
    );
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
    return Checkouts.findOneAndReplace(
        { uuid: checkout_uuid },
        { timestamp_due: new_timestamp_due },
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
