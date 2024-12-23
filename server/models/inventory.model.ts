import mongoose from "mongoose";
import type {
    TInventoryItem,
    TInventoryItemLocation,
    TRestockRequest,
    TRestockRequestLog,
} from "common/inventory";

/**
 * See {@link TInventoryItemLocation} documentation for type information.
 * Stored as children of {@link InventoryItem}.
 */
const InventoryItemLocation = new mongoose.Schema<TInventoryItemLocation>({
    room: { type: String, required: true },
    container: { type: String, required: false },
    specific: { type: String, required: false },
    quantity: { type: Number, required: true },
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
    locations: { type: [Location], required: true },
    reorder_url: { type: String, required: false },
    serial_number: { type: String, required: false },
    kit_contents: { type: [String], required: false },
    keywords: { type: String, required: false },
    required_certifications: { type: [String], required: false },
    required_roles: { type: [String], required: false },
});

/**
 * See {@link TRestockRequestLog} documentation for type information.
 * Stored as children of {@link RestockRequest}.
 */
export const RestockRequestLog = new mongoose.Schema<TRestockRequestLog>({
    timestamp: { type: Number, required: true },
    status: { type: Number, required: true },
    message: { type: String, required: false },
});

/**
 * See {@link TRestockRequest} documentation for type information.
 */
export const RestockRequest = new mongoose.Schema<TRestockRequest>({
    uuid: { type: String, required: true },
    item_uuid: { type: String, required: true },
    current_quantity: { type: Number, required: true },
    quantity_requested: { type: Number, required: false },
    reason: { type: String, required: false },
    requesting_user: { type: String, required: true },
    current_status: { type: Number, required: true },
    status_logs: { type: [RestockRequestLog], required: true },
});
