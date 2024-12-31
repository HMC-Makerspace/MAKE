import { API_SCOPES, UUID } from "common/global";
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
 * Create a new checkout in the database
 * @param checkout_obj The checkout's complete information
 */
export async function createCheckout(checkout_obj: TCheckout) {
    const Checkouts = mongoose.model("Checkouts", Checkout, "checkouts");
    const newCheckout = new Checkouts(checkout_obj);
    newCheckout.save();
}

/**
 * Update a Checkout information given an entire TCheckout object. Checkout is
 * found by UUID.
 * @param checkout_obj The checkout's complete and updated information
 */
export async function updateCheckout(checkout_obj: TCheckout) {
    const Checkouts = mongoose.model("Checkout", Checkout, "checkouts");
    // Update the given user with a new user_obj, searching by uuid
    return Checkouts.findOneAndReplace(
        { uuid: checkout_obj.uuid },
        checkout_obj,
        {
            returnDocument: "after",
        },
    );
}

/**
 * Delete a checkout in the database
 * @param checkout_obj The checkout's complete information
 */
export async function deleteCheckout(checkout_obj: TCheckout) {
    const Checkouts = mongoose.model("Checkouts", Checkout, "checkouts");
    return Checkouts.findOneAndDelete({ uuid: checkout_obj.uuid });
}
