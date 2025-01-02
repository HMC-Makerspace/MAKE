import mongoose from "mongoose";
import { TRestockRequest, TRestockRequestLog } from "common/restock";

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
export const RestockRequest = new mongoose.Schema<TRestockRequest>(
    {
        uuid: { type: String, required: true },
        item_uuid: { type: String, required: true },
        current_quantity: { type: Number, required: true },
        quantity_requested: { type: Number, required: false },
        reason: { type: String, required: false },
        requesting_user: { type: String, required: true },
        current_status: { type: Number, required: true },
        status_logs: { type: [RestockRequestLog], required: true },
    },
    { collection: "restock_requests" },
);
