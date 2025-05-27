import mongoose from "mongoose";
import type { TAlert, TSchedule } from "common/schedule";
import type { TShift, TShiftEvent } from "common/shift";

// --- Shift ---

/**
 * See {@link TShiftEvent} documentation for type information.
 * Stored as children of {@link Shift}.
 */
const ShiftEvent = new mongoose.Schema<TShiftEvent>({
    timestamp: { type: Number, required: true },
    shift_date: { type: Number, required: true },
    type: { type: String, required: true },
    initiator: { type: String, required: true },
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
});

// --- Alert ---

/**
 * See {@link TAlert} documentation for type information.
 * Stored as children of {@link Schedule}.
 */
export const Alert = new mongoose.Schema<TAlert>({
    uuid: { type: String, required: true },
    default: { type: Boolean, required: true },
    timestamp_start: { type: Number, required: false },
    timestamp_end: { type: Number, required: false },
    header: { type: String, required: true },
    message: { type: String, required: true },
});

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
});
