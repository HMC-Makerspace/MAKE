import mongoose from "mongoose";
import type { TInventoryItem, TInventoryItemLocation } from "common/inventory";
import { RequiredCertificate, RequiredCertificateSchema } from "./certification.model";
import Joi from "joi";

/**
 * See {@link TInventoryItemLocation} documentation for type information.
 * Stored as children of {@link InventoryItem}.
 */
const InventoryItemLocation = new mongoose.Schema<TInventoryItemLocation>({
    area: { type: String, required: true },
    container: { type: String, required: false },
    specific: { type: String, required: false },
});

const InventoryItemLocationSchema = Joi.object<TInventoryItemLocation>({
    area: Joi.string().required(),
    container: Joi.string().optional().allow(""),
    specific: Joi.string().optional().allow(""),
});

/**
 * See {@link TInventoryItem} documentation for type information.
 */
export const InventoryItem = new mongoose.Schema<TInventoryItem>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        long_name: { type: String, required: false },
        role: { type: String, required: true },
        linked_uuid: { type: String, required: false },
        quantity: { type: Number, required: true },
        available: { type: Number, required: true },
        access_type: { type: Number, required: true },
        locations: { type: [InventoryItemLocation], required: true },
        reorder_url: { type: String, required: false },
        serial_number: { type: String, required: false },
        keywords: { type: [String], required: false },
        required_certifications: {
            type: [RequiredCertificate],
            required: false,
        },
        authorized_roles: { type: [String], required: false },
    },
    { collection: "inventory" },
);

export const InventoryItemSchema = Joi.object<TInventoryItem>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    long_name: Joi.string().optional().allow(""),
    role: Joi.string().required(),
    linked_uuid: Joi.string().optional().allow(""),
    quantity: Joi.number().required(),
    available: Joi.number().required(),
    access_type: Joi.number().required(),
    locations: Joi.array().items(
        InventoryItemLocationSchema
    ).required(),
    reorder_url: Joi.string().optional().allow(""),
    serial_number: Joi.string().optional().allow(""),
    keywords: Joi.array().items(
        Joi.string()
    ).optional(),
    required_certifications: Joi.array().items(
        RequiredCertificateSchema
    ).optional(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).optional()
});