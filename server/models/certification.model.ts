import mongoose from "mongoose";
import type { TCertificate, TCertification } from "common/certification";
import { Document } from "./file.model";

/**
 * See {@link TCertification} documentation for type information.
 */
export const Certification = new mongoose.Schema<TCertification>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: false },
        visibility: { type: String, required: true },
        color: { type: String, required: true },
        max_level: { type: Number, required: false },
        seconds_valid_for: { type: Number, required: false },
        documents: { type: [Document], required: false },
        prerequisites: { type: [String], required: false },
        authorized_roles: { type: [String], required: false },
    },
    { collection: "certifications" },
);

/**
 * See {@link TCertificate} documentation for type information.
 * Stored as children of {@link User}.
 */
export const Certificate = new mongoose.Schema<TCertificate>({
    certification_uuid: { type: String, required: true },
    level: { type: Number, required: true },
    timestamp_granted: { type: Number, required: true },
    timestamp_expires: { type: Number, required: false },
});
