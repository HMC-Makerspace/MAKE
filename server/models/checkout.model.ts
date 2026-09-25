import mongoose from "mongoose";
import type { TCheckout, TCheckoutItem } from "common/checkout";
import Joi from 'joi';

/**
 * See {@link TCheckoutItem} documentation for type information.
 * Stored as children of {@link Checkout}.
 */
const CheckoutItem = new mongoose.Schema<TCheckoutItem>({
    item_uuid: { type: String, required: true },
    quantity: { type: Number, required: true },
    role: { type: String, required: true },
    linked_uuid: { type: String, required: false },
}, { _id: false });

const CheckoutItemSchema = Joi.object<TCheckoutItem>({
    item_uuid: Joi.string().required(),
    quantity: Joi.number().required(),
    role: Joi.string().required(),
    linked_uuid: Joi.string().optional().allow(null),
});

/**
 * See {@link TCheckout} documentation for type information.
 */
export const Checkout = new mongoose.Schema<TCheckout>(
    {
        uuid: { type: String, required: true },
        items: { type: [CheckoutItem], required: true },
        checked_out_by: { type: String, required: true },
        timestamp_out: { type: Number, required: true },
        timestamp_due: { type: Number, required: true },
        timestamp_in: { type: Number, required: false },
        notifications_sent: { type: Number, required: false },
    },
    { collection: "checkouts" }, // Collection name
);

export const CheckoutSchema = Joi.object<TCheckout>({
    uuid: Joi.string().required(),
    items: Joi.array().items(
        CheckoutItemSchema
    ).required(),
    checked_out_by: Joi.string().required(),
    timestamp_out: Joi.number().required(),
    timestamp_due: Joi.number().required(),
    timestamp_in: Joi.number().optional(),
    notifications_sent: Joi.number().optional()
});

export const CheckoutSchemaOptional = CheckoutSchema.fork(
    Object.keys(CheckoutSchema.describe().keys), 
    (schema) => schema.optional()
);