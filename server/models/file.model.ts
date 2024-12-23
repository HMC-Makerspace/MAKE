import mongoose from "mongoose";
import type { TFile } from "common/file";

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
