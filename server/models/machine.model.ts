import mongoose from "mongoose";
import type { TMachine } from "common/machine";

/**
 * See {@link TMachine} documentation for type information.
 */
export const Machine = new mongoose.Schema<TMachine>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    image: { type: String, required: false },
    count: { type: Number, required: true },
    online: { type: Number, required: true },
    manual_link: { type: String, required: false },
});
