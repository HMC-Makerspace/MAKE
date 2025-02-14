import mongoose from "mongoose";
import type { TConfig } from "common/config";

const CheckoutConfig = new mongoose.Schema(
    {
        notification_interval_sec: { type: Number, required: false },
    },
    { _id: false },
);

const FileConfig = new mongoose.Schema(
    {
        max_upload_capacity: { type: Number, required: false },
        max_upload_count: { type: Number, required: false },
    },
    { _id: false },
);

const ScheduleConfig = new mongoose.Schema(
    {
        days_open: { type: [Number], required: false },
        first_display_day: { type: Number, required: false },
        schedulable_roles: { type: [String], required: true },
    },
    { _id: false },
);

const ShiftConfig = new mongoose.Schema(
    {
        daily_start_sec: { type: [Number], required: true },
        daily_end_sec: { type: [Number], required: true },
        increment_sec: { type: Number, required: true },
    },
    { _id: false },
);

/**
 * See {@link TConfig} documentation for type information.
 * TODO: Finish setting up config db typing
 */
export const Config = new mongoose.Schema<TConfig>(
    {
        checkout: { type: CheckoutConfig, required: true },
        file: { type: FileConfig, required: true },
        schedule: { type: ScheduleConfig, required: true },
        shift: { type: ShiftConfig, required: true },
    },
    { collection: "config" },
);
