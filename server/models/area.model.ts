import mongoose from "mongoose";
import type { TArea, TDocument } from "common/area";

/**
 * See {@link TDocument} documentation for type information.
 */
export const AreaDocument = new mongoose.Schema<TDocument>({
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
