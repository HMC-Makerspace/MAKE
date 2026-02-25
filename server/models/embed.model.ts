import mongoose from "mongoose";
import type { TEmbed } from "common/embed";
import { Document } from "./file.model";

// --- Embed ---

/**
 * See {@link TEmbed} documentation for type information.
 */
export const Embed = new mongoose.Schema<TEmbed>({
    uuid: { type: String, required: true },
    title: { type: String, required: true },
    src: { type: String, required: true },
    visible_to: { type: [String], required: false },
    documents: { type: [Document], required: false },
    auto_invert: { type: Boolean, required: false },
});
