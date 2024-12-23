import mongoose from "mongoose";
import type { TCheckout, TCheckoutItem } from "common/checkout";

/**
 * See {@link TCheckoutItem} documentation for type information.
 * Stored as children of {@link Checkout}.
 */
const CheckoutItem = new mongoose.Schema<TCheckoutItem>({
    item_uuid: { type: String, required: true },
    quantity: { type: Number, required: true },
    location_index: { type: Number, required: true },
});

/**
 * See {@link TCheckout} documentation for type information.
 */
export const Checkout = new mongoose.Schema<TCheckout>({
    uuid: { type: String, required: true },
    items: { type: [CheckoutItem], required: true },
    checked_out_by: { type: String, required: true },
    timestamp_out: { type: Number, required: true },
    timestamp_due: { type: Number, required: true },
    timestamp_in: { type: Number, required: false },
    notifications_sent: { type: Number, required: true },
});
