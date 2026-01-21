import {
    TMachineInstance,
    TMachineInstanceStatusLog,
    TMachine,
} from "common/machine";
import mongoose from "mongoose";
import { Document, DocumentSchema } from "./file.model";
import { RequiredCertificate, RequiredCertificateSchema } from "./certification.model";
import Joi from 'joi';

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

const MachineInstanceSchema = Joi.object<TMachineInstance>({
    uuid: Joi.string().required(),
    name: Joi.string().optional().allow(""),
    status: Joi.number().required(),
    reserved: Joi.boolean().required(),
    message: Joi.string().optional()
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

const MachineInstanceStatusLogSchema = Joi.object<TMachineInstanceStatusLog>({
    timestamp: Joi.number().required(),
    instance_uuid: Joi.string().optional().allow(""),
    status: Joi.number().required(),
    message: Joi.string().optional().allow("")
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
        instances: { type: [MachineInstance], required: true },
        status_logs: { type: [MachineInstanceStatusLog], required: true },
        documents: { type: [Document], required: false },
        required_certifications: {
            type: [RequiredCertificate],
            required: false,
        },
        authorized_roles: { type: [String], required: true },
        reservable: { type: Boolean, required: false },
        reservation_type: { type: Number, required: false },
    },
    { collection: "machines" },
);

export const MachineSchema = Joi.object<TMachine>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    images: Joi.array().items(
        Joi.string
    ).optional(),
    count: Joi.number().required(),
    instances: Joi.array().items(
        MachineInstanceSchema
    ).required(),
    status_logs: Joi.array().items(
        MachineInstanceStatusLogSchema
    ).required(),
    documents: Joi.array().items(
        DocumentSchema
    ).optional(),
    required_certifications: Joi.array().items(
        RequiredCertificateSchema
    ).optional(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).required(),
    reservable: Joi.boolean().optional(),
    reservation_type: Joi.number().optional()
});
