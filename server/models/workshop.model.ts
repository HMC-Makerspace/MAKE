import mongoose from "mongoose";
import type { TWorkshop, TWorkshopUserRecord } from "common/workshop";

const WorkshopUserRecord = new mongoose.Schema<TWorkshopUserRecord>({
    user_uuid: { type: String, required: true },
    timestamp: { type: Number, required: true },
});

/**
 * See {@link TWorkshop} documentation for type information.
 */
export const Workshop = new mongoose.Schema<TWorkshop>(
    {
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
        rsvp_list: { type: [WorkshopUserRecord], required: true },
        users_notified: { type: [String], required: true },
        sign_in_list: { type: [WorkshopUserRecord], required: true },
        images: { type: [String], required: false },
        authorized_roles: { type: [String], required: false },
    },
    { collection: "workshops" }, // Collection name
);
