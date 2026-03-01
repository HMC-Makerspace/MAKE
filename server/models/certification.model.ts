import mongoose from "mongoose";
import type {
    TCertificate,
    TCertification,
    TRequiredCertificate,
} from "common/certification";
import { Document, DocumentSchema } from "./file.model";
import Joi from "joi"

/**
 * See {@link TCertificate} documentation for type information.
 * Stored as children of {@link User}.
 */
export const Certificate = new mongoose.Schema<TCertificate>({
    certification_uuid: { type: String, required: true },
    level: { type: Number, required: true },
    timestamp_granted: { type: Number, required: true },
    timestamp_expires: { type: Number, required: false },
}, { _id: false });

/**
 * Certificate schema through joi
 */
export const CertificateSchema = Joi.object<TCertificate>({
    certification_uuid: Joi.string().required(),
    level: Joi.number().required(),
    timestamp_granted: Joi.number().required(),
    timestamp_expires: Joi.number().optional()
});

/**
 * See {@link TRequiredCertificate} documentation for type information.
 * Stored as children of {@link User}.
 */
export const RequiredCertificate = new mongoose.Schema<TRequiredCertificate>({
    certification_uuid: { type: String, required: true },
    required_level: { type: Number, required: true },
}, { _id: false });

/**
 * RequiredCertificate Joi Schema
 */

export const RequiredCertificateSchema = Joi.object<TRequiredCertificate>({
    certification_uuid: Joi.string().required(),
    required_level: Joi.number().required()
});

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
        required_certifications: { type: [RequiredCertificate], required: false },
        authorized_roles: { type: [String], required: false },
    },
    { collection: "certifications" },
);

export const CertificationSchema = Joi.object<TCertification>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    visibility: Joi.string().required(),
    color: Joi.string().required(),
    max_level: Joi.number().optional(),
    seconds_valid_for: Joi.number().optional(),
    documents: Joi.array().items(
        DocumentSchema
    ).optional(),
    required_certifications: Joi.array().items(
        RequiredCertificateSchema
    ).optional(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).optional().allow(null)
});

export const CertificationSchemaOptional = CertificationSchema.fork(
    Object.keys(CertificationSchema.describe().keys), 
    (schema) => schema.optional()
);