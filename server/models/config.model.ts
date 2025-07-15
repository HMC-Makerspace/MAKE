import mongoose from "mongoose";
import type {
    TCheckoutConfig,
    TConfig,
    TFileConfig,
    TGeneralConfig,
    TScheduleConfig,
} from "common/config";

const CheckoutConfig = new mongoose.Schema<TCheckoutConfig>(
    {
        notification_interval_sec: { type: Number, required: false },
    },
    { _id: false },
);

const FileConfig = new mongoose.Schema<TFileConfig>(
    {
        max_upload_capacity: { type: Number, required: false },
        max_upload_count: { type: Number, required: false },
    },
    { _id: false },
);

const ScheduleConfig = new mongoose.Schema<TScheduleConfig>(
    {
        days_open: { type: [Number], required: false },
        first_display_day: { type: Number, required: false },
        worker_roles: { type: [String], required: true },
        increment_sec: { type: Number, required: true },
        first_names_only: { type: Boolean, required: false },
        timezone: { type: String, required: true },
    },
    { _id: false },
);

const GeneralConfig = new mongoose.Schema<TGeneralConfig>(
    {
        branding_url: { type: String, required: false },
        tagline: { type: String, required: false },
        discord_url: { type: String, required: false },
        instagram_url: { type: String, required: false },
        tiktok_url: { type: String, required: false },
        extra_urls: { type: [String], required: false },
    },
    {
        _id: false,
    },
);

/**
 * See {@link TConfig} documentation for type information.
 * TODO: Finish setting up config db typing
 */
export const Config = new mongoose.Schema<TConfig>(
    {
        timestamp: { type: Number, required: true },
        general: { type: GeneralConfig, required: true },
        checkout: { type: CheckoutConfig, required: true },
        file: { type: FileConfig, required: true },
        schedule: { type: ScheduleConfig, required: true },
    },
    { collection: "config" },
);
