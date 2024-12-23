import mongoose from "mongoose";
import type { TReservation } from "common/reservation";

/**
 * See {@link TReservation} documentation for type information.
 */
export const Reservation = new mongoose.Schema<TReservation>({
    uuid: { type: String, required: true },
    type: { type: String, required: true },
    reserved_uuid: { type: String, required: true },
    user_uuid: { type: String, required: true },
    timestamp_start: { type: Number, required: true },
    timestamp_end: { type: Number, required: true },
    seconds_recurring: { type: Number, required: false },
    num_recurrences: { type: Number, required: false },
    purpose: { type: String, required: false },
});
