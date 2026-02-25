import mongoose from "mongoose";
import type { TArea, TAreaStatus } from "common/area";
import { Document, DocumentSchema } from "./file.model";
import { RequiredCertificate, RequiredCertificateSchema } from "./certification.model";
import Joi from 'joi';

// --- Area ---

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
    required_certifications: { type: [RequiredCertificate], required: false },
    authorized_roles: { type: [String], required: false },
    reservable: { type: Boolean, required: false },
    reserved: { type: Boolean, required: false },
    visible_to: { type: [String], required: false },
});

export const AreaSchema = Joi.object<TArea>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    documents: Joi.array().items(
        DocumentSchema
    ).optional(),
    equipment: Joi.array().items(
        Joi.string()
    ).optional(),
    images: Joi.array().items(
        Joi.string()
    ).optional(),
    required_certifications: Joi.array().items(
        RequiredCertificateSchema
    ).optional(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).optional().allow(null),
    reservable: Joi.boolean().optional(),
    reserved: Joi.boolean().optional(),
    visible_to: Joi.array().items(
        Joi.string()
    ).optional().allow(null)
});

export const AreaSchemaOptional = AreaSchema.fork(
    Object.keys(AreaSchema.describe().keys), 
    (schema) => schema.optional()
);


export const AreaArraySchema = Joi.array().items(
    AreaSchema.append({
        _id: Joi.string().allow("").optional(),
        __v: Joi.number().optional()
    })
);