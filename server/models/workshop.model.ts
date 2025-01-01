import mongoose from "mongoose";
import type { TWorkshop } from "common/workshop";

/**
 * See {@link TWorkshop} documentation for type information.
 */
export const Workshop = new mongoose.Schema<TWorkshop>({
    uuid: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    instructors: { type: [String], required: true },
    support_instructors: { type: [String], required: false },
    capacity: { type: Number, required: false },
    timestamp_start: { type: Number, required: true },
    timestamp_end: { type: Number, required: true },
    timestamp_public: { type: Number, required: true },
    required_certifications: { type: [String], required: false },
    rsvp_list: {
        type: Map, // All Maps have strings as keys
        of: Number, // Numbers as values
        required: true,
    },
    users_notified: { type: [String], required: true },
    sign_in_list: {
        type: Map, // All Maps have strings as keys
        of: Number, // Numbers as values
        required: true,
    },
    photos: { type: [String], required: false },
});
