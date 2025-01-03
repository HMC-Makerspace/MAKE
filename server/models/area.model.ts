import mongoose from "mongoose";
import type { TArea, TAreaStatus, TAreaStatusLog } from "common/area";
import { Document } from "./file.model";

// --- Area ---

/**
 * See {@link TAreaStatus} documentation for type information.
 * Stored as children of {@link AreaStatusLog} and {@link Area}.
 */
const AreaStatus = new mongoose.Schema<TAreaStatus>({
    available: { type: Boolean, required: true },
    message: { type: String, required: false },
});

/**
 * See {@link TAreaStatusLog} documentation for type information.
 * Stored as children of {@link Area}.
 */
const AreaStatusLog = new mongoose.Schema<TAreaStatusLog>({
    timestamp: { type: Number, required: true },
    status: { type: AreaStatus, required: true },
});

/**
 * See {@link TArea} documentation for type information.
 */
export const Area = new mongoose.Schema<TArea>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    documents: { type: [Document], required: false },
    equipment: { type: [String], required: false },
    images: { type: [String], required: false },
    current_status: { type: AreaStatus, required: true },
    status_logs: { type: [AreaStatusLog], required: true },
    required_certifications: { type: [String], required: false },
    authorized_roles: { type: [String], required: false },
    reservable: { type: Boolean, required: false },
});
