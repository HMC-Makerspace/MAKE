import mongoose from "mongoose";
import type { TInventoryItem, TInventoryItemLocation, TItemCertificate } from "common/inventory";

/**
 * See {@link TInventoryItemLocation} documentation for type information.
 * Stored as children of {@link InventoryItem}.
 */
const InventoryItemLocation = new mongoose.Schema<TInventoryItemLocation>({
    area: { type: String, required: true },
    container: { type: String, required: false },
    specific: { type: String, required: false },
    quantity: { type: Number, required: true },
});

/**
 * See {@link TInventoryItemLocation} documentation for type information.
 * Stored as children of {@link InventoryItem}.
 */
const ItemCertificate = new mongoose.Schema<TItemCertificate>({
    certification_uuid: { type: String, required: true },
    required_level: { type: Number, required: true },
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
        access_type: { type: Number, required: true },
        locations: { type: [InventoryItemLocation], required: true },
        reorder_url: { type: String, required: false },
        serial_number: { type: String, required: false },
        kit_contents: { type: [String], required: false },
        keywords: { type: [String], required: false },
        required_certifications: { type: [ItemCertificate], required: false },
        authorized_roles: { type: [String], required: false },
    },
    { collection: "inventory" },
);
