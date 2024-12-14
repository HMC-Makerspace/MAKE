import mongoose, { mongo, SchemaType } from "mongoose";
import type { TInventoryItem, TLocation } from "common/inventory";

/**
 * See {@link TLocation} documentation for type information.
 */
const Location = new mongoose.Schema<TLocation>({
    room: { type: String, required: true },
    quantity: { type: Number, required: true },
    container: { type: String, required: false },
    specific: { type: String, required: false },
});

/**
 * See {@link TInventoryItem} documentation for type information.
 */
export const InventoryItem = new mongoose.Schema<TInventoryItem>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    long_name: { type: String, required: false },
    role: { type: String, required: true },
    access_type: { type: Number, required: true },
    locations: {
        type: [Location],
        required: true,
    },
    reorder_url: { type: String, required: false },
    serial_number: { type: String, required: false },
    kit_contents: { type: [String], required: false },
    keywords: { type: String, required: false },
    certs_required: { type: [String], required: false },
});
