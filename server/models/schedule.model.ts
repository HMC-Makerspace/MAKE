import mongoose from "mongoose";
import type { TAlert, TSchedule } from "common/schedule";
import type { TShift, TShiftEvent } from "common/shift";
import Joi from "joi"

// --- Shift ---

/**
 * See {@link TShiftEvent} documentation for type information.
 * Stored as children of {@link Shift}.
 */
const ShiftEvent = new mongoose.Schema<TShiftEvent>(
    {
        timestamp: { type: Number, required: true },
        shift_date: { type: Number, required: true },
        type: { type: String, required: true },
        initiator: { type: String, required: true },
    },
    { _id: false },
);

export const ShiftEventSchema = Joi.object<TShiftEvent>({
    timestamp: Joi.number().required(),
    shift_date: Joi.number().required(),
    type: Joi.string().required(),
    initiator: Joi.string().required()
});


/**
 * See {@link TShift} documentation for type information.
 * Stored as children of {@link Schedule} objects.
 */
const Shift = new mongoose.Schema<TShift>({
    uuid: { type: String, required: true },
    day: { type: Number, required: true },
    sec_start: { type: Number, required: true },
    sec_end: { type: Number, required: true },
    assignee: { type: String, required: true },
    history: { type: [ShiftEvent], required: true },
}, { _id: false });

export const ShiftSchema = Joi.object<TShift>({
    uuid: Joi.string().required(),
    day: Joi.number().required(),
    sec_start: Joi.number().required(),
    sec_end: Joi.number().required(),
    assignee: Joi.string().required(),
    history: Joi.array().items(
        ShiftEventSchema
    ).required()
});

export const ShiftSchemaOptional = ShiftSchema.fork(
    Object.keys(ShiftSchema.describe().keys), 
    (schema) => schema.optional()
);

// --- Alert ---

/**
 * See {@link TAlert} documentation for type information.
 * Stored as children of {@link Schedule}.
 */
export const Alert = new mongoose.Schema<TAlert>({
    uuid: { type: String, required: true },
    timestamp_start: { type: Number, required: false },
    timestamp_end: { type: Number, required: false },
    header: { type: String, required: true },
    content: { type: String, required: false },
    hyperlink: { type: Boolean, required: false },
}, { _id: false });

export const AlertSchema = Joi.object<TAlert>({
    uuid: Joi.string().required(),
    timestamp_start: Joi.number().optional(),
    timestamp_end: Joi.number().optional(),
    header: Joi.string().required(),
    content: Joi.string().optional().allow(""),
    hyperlink: Joi.boolean().optional()
});

export const AlertSchemaOptional = AlertSchema.fork(
    Object.keys(AlertSchema.describe().keys), 
    (schema) => schema.optional()
);

// --- Schedule ---

/**
 * See {@link TSchedule} documentation for type information.
 */
export const Schedule = new mongoose.Schema<TSchedule>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    timestamp_start: { type: Number, required: true },
    timestamp_end: { type: Number, required: true },
    shifts: { type: [Shift], required: true },
    alerts: { type: [Alert], required: true },
    daily_open_time: { type: Number, required: true },
    daily_close_time: { type: Number, required: true },
    active: { type: Boolean, required: true },
    staged: { type: Boolean, required: false },
});

/**
 * Schedule Joi Schema
 */

export const ScheduleSchema = Joi.object<TSchedule>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    timestamp_start: Joi.number().required(),
    timestamp_end: Joi.number().required(),
    shifts: Joi.array().items(
        ShiftSchema
    ).required(),
    alerts: Joi.array().items(
        AlertSchema
    ).required(),
    daily_open_time: Joi.number().required(),
    daily_close_time: Joi.number().required(),
    active: Joi.boolean().required(),
    staged: Joi.boolean().optional()
}); 

export const ScheduleSchemaOptional = ScheduleSchema.fork(
    Object.keys(ScheduleSchema.describe().keys), 
    (schema) => schema.optional()
);