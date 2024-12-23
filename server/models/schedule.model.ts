import mongoose from "mongoose";
import type { TAlert, TSchedule } from "common/schedule";
import { Shift } from "./shift.model";

/**
 * See {@link TAlert} documentation for type information.
 * Stored as children of {@link Schedule}.
 */
export const Alert = new mongoose.Schema<TAlert>({
    timestamp_start: { type: Number, required: true },
    timestamp_end: { type: Number, required: true },
    header: { type: String, required: true },
    message: { type: String, required: true },
    default: { type: Boolean, required: true },
});

/**
 * See {@link TSchedule} documentation for type information.
 */
export const Schedule = new mongoose.Schema<TSchedule>({
    uuid: { type: String, required: true },
    timestamp_start: { type: Number, required: true },
    timestamp_end: { type: Number, required: true },
    shifts: { type: [Shift], required: true },
    alerts: { type: [Alert], required: true },
});
