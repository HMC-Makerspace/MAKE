import mongoose from "mongoose";
import type { TDocument, TFile } from "common/file";

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
    user_uuid: { type: String, required: false },
});

/**
 * See {@link TDocument} documentation for type information.
 * Stored as children of {@link Area} and {@link Machine},
 * and {@link Certification} objects.
 */
export const Document = new mongoose.Schema<TDocument>({
    name: { type: String, required: true },
    link: { type: String, required: true },
});
