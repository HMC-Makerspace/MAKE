import mongoose from "mongoose";
import type { TDocument, TFile } from "common/file";
import Joi from "joi";

/**
 * See {@link TFile} documentation for type information.
 */
export const File = new mongoose.Schema<TFile>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    timestamp_upload: { type: Number, required: true },
    timestamp_expires: { type: Number, required: false },
    size: { type: Number, required: true },
    resource_uuid: { type: String, required: true },
    resource_type: { type: String, required: true },
});

export const FileSchema = Joi.object<TFile>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    path: Joi.string().required(),
    timestamp_upload: Joi.number().required(),
    timestamp_expires: Joi.number().optional(),
    size: Joi.number().required(),
    resource_uuid: Joi.string().required(),
    resource_type: Joi.string().required()
});

/**
 * See {@link TDocument} documentation for type information.
 * Stored as children of {@link Area} and {@link Machine},
 * and {@link Certification} objects.
 */
export const Document = new mongoose.Schema<TDocument>({
    name: { type: String, required: true },
    link: { type: String, required: true },
    authorized_roles: { type: [String], required: false },
});

export const DocumentSchema = Joi.object<TDocument>({
    name: Joi.string().required(),
    link: Joi.string().required(),
    authorized_roles: Joi.array().items(
        Joi.string()
    ).optional()
});
