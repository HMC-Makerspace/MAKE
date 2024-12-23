import mongoose from "mongoose";
import type { TConfig } from "common/config";

/**
 * See {@link TConfig} documentation for type information.
 * TODO: Finish setting up config db typing
 */
export const Config = new mongoose.Schema<TConfig>();
