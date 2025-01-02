import { TMachineStatus, TMachineStatusLog, TMachine } from "common/machine";
import mongoose from "mongoose";
import { Document } from "./file.model";

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
export const Machine = new mongoose.Schema<TMachine>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: false },
        images: { type: [String], required: false },
        count: { type: Number, required: true },
        current_statuses: { type: [MachineStatus], required: true },
        status_logs: { type: [MachineStatusLog], required: true },
        documents: { type: [Document], required: false },
        required_certifications: { type: [String], required: false },
        authorized_roles: { type: [String], required: true },
    },
    { collection: "machines" },
);
