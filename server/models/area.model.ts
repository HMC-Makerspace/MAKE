import mongoose from "mongoose";
import type {
    TArea,
    TAreaStatus,
    TAreaStatusLog,
    TDocument,
    TMachine,
    TMachineStatus,
    TMachineStatusLog,
} from "common/area";

// --- Machine ---

/**
 * See {@link TDocument} documentation for type information.
 * Stored as children of {@link Area} and {@link Machine}.
 */
const Document = new mongoose.Schema<TDocument>({
    name: { type: String, required: true },
    link: { type: String, required: true },
});

/**
 * See {@link TMachineStatus} documentation for type information.
 * Stored as children of {@link MachineStatusLog} and {@link Machine}.
 */
const MachineStatus = new mongoose.Schema<TMachineStatus>({
    status: { type: Number, required: true },
    available: { type: Boolean, required: true },
    message: { type: String, required: false },
});

/**
 * See {@link TMachineStatusLog} documentation for type information.
 * Stored as children of {@link Machine}.
 */
const MachineStatusLog = new mongoose.Schema<TMachineStatusLog>({
    timestamp: { type: Number, required: true },
    statuses: { type: [MachineStatus], required: true },
});

/**
 * See {@link TMachine} documentation for type information.
 */
export const Machine = new mongoose.Schema<TMachine>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    images: { type: [String], required: false },
    count: { type: Number, required: true },
    current_statuses: { type: [MachineStatus], required: true },
    status_logs: { type: [MachineStatusLog], required: true },
    documents: { type: [Document], required: false },
    required_certifications: { type: [String], required: false },
    required_roles: { type: [String], required: true },
});

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
    current_status: { type: AreaStatus, required: true },
    status_logs: { type: [AreaStatusLog], required: true },
    required_certifications: { type: [String], required: false },
    authorized_roles: { type: [String], required: false },
    hidden: { type: Boolean, required: false },
});
