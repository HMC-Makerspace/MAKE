import mongoose from "mongoose";
import type { TArea, TAreaStatus } from "common/area";
import { Document } from "./file.model";
import { RequiredCertificate } from "./certification.model";

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
    available_to: { type: [String], required: false },
    reservable: { type: Boolean, required: false },
    reserved: { type: Boolean, required: false },
    visible_to: { type: [String], required: false },
});
