import { API_SCOPE, UUID } from "common/global";
import { TCheckout } from "common/checkout";
import { Checkout } from "models/checkout.model";
import mongoose from "mongoose";

/**
 * Get all checkouts in the database
 * @returns A promise to list of TCheckouts objects representing all users in the db
 */
export async function getCheckouts(): Promise<TCheckout[]> {
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
    return Checkouts.find();
}

/**
 * Get a specific checkout's information, searching by UUID
 * @param uuid The checkout's UUID to search by
 * @returns A promise to a TCheckout object, or null if no user has the given UUID
 */
export async function getCheckout(uuid: UUID): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
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
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
    return Checkouts.find({ checked_out_by: user_uuid });
}

/**
 * Create a new checkout in the database
 * @param checkout_obj The checkout's complete information
 * @returns The checkout object
 */
export async function createCheckout(
    checkout_obj: TCheckout,
): Promise<TCheckout | null> {
    const Checkouts = mongoose.model("Checkouts", Checkout, "checkouts");
    // Check if the checkout already exists
    const existingCheckout = await Checkouts.exists({
        uuid: checkout_obj.uuid,
    });
    if (existingCheckout) {
        // If so, return null, and don't create a new user role
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
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
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
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
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
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
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
    const Checkouts = mongoose.model("Checkouts", Checkout, "checkouts");
    return Checkouts.findOneAndDelete({ uuid: checkout_uuid });
}
