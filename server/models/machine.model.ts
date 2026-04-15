import {
    TMachineInstance,
    TMachineInstanceStatusLog,
    TMachine,
} from "common/machine";
import mongoose from "mongoose";
import { Document } from "./file.model";
import { RequiredCertificate } from "./certification.model";

/**
 * See {@link TMachineInstance} documentation for type information.
 * Stored as children of {@link MachineInstanceStatusLog} and {@link Machine}.
 */
const MachineInstance = new mongoose.Schema<TMachineInstance>({
    uuid: { type: String, required: true },
    name: { type: String, required: false },
    status: { type: Number, required: true },
    reserved: { type: Boolean, required: true },
    message: { type: String, required: false },
});

/**
 * See {@link TMachineInstanceStatusLog} documentation for type information.
 * Stored as children of {@link Machine}.
 */
const MachineInstanceStatusLog = new mongoose.Schema<TMachineInstanceStatusLog>(
    {
        timestamp: { type: Number, required: true },
        instance_uuid: { type: String, required: false },
        status: { type: Number, required: true },
        message: { type: String, required: false },
    },
);

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
        instances: { type: [MachineInstance], required: true },
        status_logs: { type: [MachineInstanceStatusLog], required: true },
        documents: { type: [Document], required: false },
        required_certifications: {
            type: [RequiredCertificate],
            required: false,
        },
        available_to: { type: [String], required: false },
        visible_to: { type: [String], required: false },
        reservable: { type: Boolean, required: false },
        reservation_type: { type: Number, required: false },
    },
    { collection: "machines" },
);
