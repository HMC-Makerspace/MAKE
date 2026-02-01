import mongoose from "mongoose";
import { TRestockRequest, TRestockRequestLog } from "common/restock";
import Joi from "joi";

/**
 * See {@link TRestockRequestLog} documentation for type information.
 * Stored as children of {@link RestockRequest}.
 */
export const RestockRequestLog = new mongoose.Schema<TRestockRequestLog>({
    timestamp: { type: Number, required: true },
    status: { type: Number, required: true },
    message: { type: String, required: false },
});

export const RestockRequestLogSchema = Joi.object<TRestockRequestLog>({
    timestamp: Joi.number().required(),
    status: Joi.number().required(),
    message: Joi.string().optional().allow("")
});

/**
 * See {@link TRestockRequest} documentation for type information.
 */
export const RestockRequest = new mongoose.Schema<TRestockRequest>(
    {
        uuid: { type: String, required: true },
        item_uuid: { type: String, required: true },
        mailing_list: { type: [String], required: true },
        quantity_requested: { type: Number, required: false },
        reason: { type: String, required: false },
        requesting_user: { type: String, required: true },
        current_status: { type: Number, required: true },
        status_logs: { type: [RestockRequestLog], required: true },
    },
    { collection: "restock_requests" },
);

export const RestockRequestSchema = Joi.object<TRestockRequest>({
    uuid: Joi.string().required(),
    item_uuid: Joi.string().required(),
    mailing_list: Joi.array().items(
        Joi.string()
    ).required(),
    quantity_requested: Joi.number().optional(),
    reason: Joi.string().optional().allow(""),
    requesting_user: Joi.string().required(),
    current_status: Joi.number().required(),
    status_logs: Joi.array().items(
        RestockRequestLogSchema
    ).required()
});

export const RestockRequestSchemaOptional = RestockRequestSchema.fork(
    Object.keys(RestockRequestSchema.describe().keys), 
    (schema) => schema.optional()
);