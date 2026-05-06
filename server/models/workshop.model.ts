import mongoose from "mongoose";
import type { TWorkshop, TWorkshopUserRecord } from "common/workshop";
import { RequiredCertificate, RequiredCertificateSchema } from "./certification.model";
import Joi from 'joi';
import { authorize } from "passport";

const WorkshopUserRecord = new mongoose.Schema<TWorkshopUserRecord>({
    user_uuid: { type: String, required: true },
    timestamp: { type: Number, required: true },
},     
    { _id: false }
);

const WorkshopUserRecordSchema = Joi.object<TWorkshopUserRecord>({
    user_uuid: Joi.string().required(),
    timestamp: Joi.number().required()
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
        timestamp_public: { type: Number, required: false },
        required_certifications: {
            type: [RequiredCertificate],
            required: false,
        },
        rsvp_list: { type: [WorkshopUserRecord], required: true },
        reminder_emails_sent: { type: [Number], required: true },
        sign_in_list: { type: [WorkshopUserRecord], required: true },
        images: { type: [String], required: false },
        authorized_roles: { type: [String], required: false },
        rsvp_disclaimer: { type: String, required: false },
    },
    { collection: "workshops" }, // Collection name
);

/**
 * Workshop Schema through Joi
 */
export const WorkshopSchema = Joi.object<TWorkshop>({
    uuid: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional().allow(null, ''),
    instructors: Joi.array()
        .items(
            Joi.string()
        )
        .required(),
    support_instructors: Joi.array().items(
        Joi.string()
    ).optional(),
    capacity: Joi.number().optional(),
    timestamp_start: Joi.number().required(),
    timestamp_end: Joi.number().required(),
    timestamp_public: Joi.number().optional(),
    required_certifications: Joi.array().items(
        RequiredCertificateSchema
    ).optional(),
    rsvp_list: Joi.array().items(
        WorkshopUserRecordSchema
    ).required(),
    reminder_emails_sent: Joi.array().items(
        Joi.number()
    ).required(),
    sign_in_list: Joi.array().items(
        WorkshopUserRecordSchema
    ).required(),
    images: Joi.array().items(
        Joi.string()
    ).optional(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).optional().allow(null),
    rsvp_disclaimer: Joi.string().allow(null, '')
});

export const WorkshopSchemaOptional = WorkshopSchema.fork(
    Object.keys(WorkshopSchema.describe().keys), 
    (schema) => schema.optional()
);