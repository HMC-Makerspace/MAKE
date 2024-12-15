import mongoose from "mongoose";
import type { TArea, TAreaDocument } from "common/area";

/**
 * See {@link TAreaDocument} documentation for type information.
 */
export const AreaDocument = new mongoose.Schema<TAreaDocument>({
    name: { type: String, required: true },
    link: { type: String, required: true },
});

/**
 * See {@link TArea} documentation for type information.
 */
export const Area = new mongoose.Schema<TArea>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    documents: { type: [AreaDocument], required: false },
    equipment: { type: [String], required: true },
});
