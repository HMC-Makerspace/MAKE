import mongoose from "mongoose";
import type {
    TCheckoutConfig,
    TConfig,
    TFAQItem,
    TFileConfig,
    TGeneralConfig,
    TScheduleConfig,
    TWorkshopConfig,
} from "common/config";
import Joi from 'joi';

const CheckoutConfig = new mongoose.Schema<TCheckoutConfig>(
    {
        notification_interval_sec: { type: Number, required: false },
    },
    { _id: false },
);

const CheckoutConfigSchema = Joi.object<TCheckoutConfig>({
    notification_interval_sec: Joi.number().optional()
});

const FileConfig = new mongoose.Schema<TFileConfig>(
    {
        max_upload_capacity: { type: Number, required: false },
        max_upload_count: { type: Number, required: false },
        upload_duration: { type: Number, required: false },
    },
    { _id: false },
);

const FileConfigSchema = Joi.object<TFileConfig>({
    max_upload_capacity: Joi.number().optional(),
    max_upload_count: Joi.number().optional(),
    upload_duration: Joi.number().optional()
});

const ScheduleConfig = new mongoose.Schema<TScheduleConfig>(
    {
        days_open: { type: [Number], required: false },
        first_display_day: { type: Number, required: false },
        worker_roles: { type: [String], required: true },
        increment_sec: { type: Number, required: true },
        first_names_only: { type: Boolean, required: false },
        timezone: { type: String, required: true },
        locale: { type: String, required: true },
    },
    { _id: false },
);

const ScheduleConfigSchema = Joi.object<TScheduleConfig>({
    days_open: Joi.array().items(
        Joi.number()
    ).optional(),
    first_display_day: Joi.number().optional(),
    worker_roles: Joi.array().items(
        Joi.string()
    ).required(),
    increment_sec: Joi.number().required(),
    first_names_only: Joi.boolean().optional(),
    timezone: Joi.string().required(),
    locale: Joi.string().required()
});

const WorkshopConfig = new mongoose.Schema<TWorkshopConfig>(
    {
        reminder_times: { type: [Number], required: true },
        sign_in_enabled_within: { type: Number, required: true },
    },
    { _id: false },
);

const WorkshopConfigSchema = Joi.object<TWorkshopConfig>({
    reminder_times: Joi.array().items(Joi.number()).required(),
    sign_in_enabled_within: Joi.number().required(),
});

const GeneralConfig = new mongoose.Schema<TGeneralConfig>(
    {
        branding_url: { type: String, required: false },
        tagline: { type: String, required: false },
        discord_url: { type: String, required: false },
        instagram_url: { type: String, required: false },
        tiktok_url: { type: String, required: false },
        extra_urls: { type: [String], required: false },
        hide_home_embed: { type: Boolean, required: false },
    },
    {
        _id: false,
    },
);

const GeneralConfigSchema = Joi.object<TGeneralConfig>({
    branding_url: Joi.string().optional(),
    tagline: Joi.string().optional(),
    discord_url: Joi.string().optional(),
    instagram_url: Joi.string().optional(),
    tiktok_url: Joi.string().optional(),
    extra_urls: Joi.array().items(Joi.string()).optional(),
    hide_home_embed: Joi.boolean().optional(),
});

const FAQItemConfig = new mongoose.Schema<TFAQItem>(
    {
        title: { type: String },
        description: { type: String, required: false },
        children_columns: { type: Number, required: false },
        default_open: { type: Boolean, required: false },
        always_open: { type: Boolean, required: false },
        bordered: { type: Boolean, required: false },
        title_centered: { type: Boolean, required: false },
    },
    {
        _id: false,
    },
);
FAQItemConfig.add({
    children: { type: [FAQItemConfig], required: false },
});

const FAQItemConfigSchema = Joi.object<TFAQItem>({
    title: Joi.string(),
    description: Joi.string().optional(),
    children_columns: Joi.number().optional(),
    default_open: Joi.boolean().optional(),
    always_open: Joi.boolean().optional(),
    bordered: Joi.boolean().optional(),
    title_centered: Joi.boolean().optional(),
    children: Joi.array().items(Joi.link("#FAQItemConfigSchema")).optional(),
}).id("FAQItemConfigSchema");

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
        workshop: { type: WorkshopConfig, required: true },
        faq: { type: FAQItemConfig, required: false },
    },
    { collection: "config" },
);

export const ConfigSchema = Joi.object<TConfig>({
    timestamp: Joi.number().required(),
    general: GeneralConfigSchema.required(),
    checkout: CheckoutConfigSchema.required(),
    file: FileConfigSchema.required(),
    schedule: ScheduleConfigSchema.required(),
    workshop: WorkshopConfigSchema.required(),
    faq: FAQItemConfigSchema.optional(),
});
