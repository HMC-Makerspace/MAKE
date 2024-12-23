import mongoose from "mongoose";
import type { TShift, TShiftEvent } from "common/shift";

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
 * Stored as children of {@link Schedule}.
 */
export const Shift = new mongoose.Schema<TShift>({
    day: { type: Number, required: true },
    ms_start: { type: Number, required: true },
    ms_end: { type: Number, required: true },
    assignee: { type: String, required: true },
    history: { type: [ShiftEvent], required: true },
});
