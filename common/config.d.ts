import { TDocument } from "./file";
import { UnixTimestamp, UUID } from "./global";
import { UserRoleUUID } from "./user";

export type TGeneralConfig = {
    branding_url?: string;
    tagline?: string;
    discord_url?: string;
    instagram_url?: string;
    tiktok_url?: string;
    extra_urls?: string[];
    hide_home_embed?: boolean;
};

export type TCheckoutConfig = {
    /**
     * something to do with how often notifications are sent...
     */
    notification_interval_sec?: number;
};

export type TFileConfig = {
    /**
     * Maximum allowed individual file upload size (in bytes).
     */
    // max_individual_upload_size?: number; // MOVED TO process.env FOR SECURITY
    /**
     * Maximum upload usage for each user (in bytes).
     */
    max_upload_capacity?: number;
    /**
     * Maximum number of uploads for each user.
     */
    max_upload_count?: number;
    /**
     * The duration that each user uploaded file remains on the server (in seconds).
     */
    upload_duration?: number;
};

export type TScheduleConfig = {
    /**
     * A list of day indices (based on {@link SHIFT_DAY}) that the space
     * is open. If not present, assume the space is open all 7 days of
     * the week.
     */
    days_open?: number[];
    /**
     * The index of the first day of shifts to visually show in the public
     * schedule. By default, Sunday (0) is the first day, but setting
     * `shift_first_day` to 1 will display Monday first. Does not affect
     * the indices of user shifts.
     */
    first_display_day?: number;
    /**
     * The list of user role UUIDs that can have scheduled shifts,
     * which will show up in in the schedule editor.
     */
    worker_roles: UserRoleUUID[];

    /**
     * The increment between shifts (in seconds).
     */
    increment_sec: number;

    /**
     * Whether to only show worker first names (before first space) on
     * the public schedule page.
     */
    first_names_only?: boolean;

    /**
     * The IANA timezone to use for all date objects
     */
    timezone: string;

    /**
     * A locale language tag for use in formatting dates, such as "en-US"
     */
    locale: string;
};

export type TWorkshopConfig = {
    /**
     * List of times (in seconds) to send out workshop reminder emails
     */
    reminder_times: number[];

    /**
     * Time (in seconds) before a workshop starts during which users can sign in
     */
    sign_in_enabled_within: number;

    /**
     * The list of user role UUIDs that can be instructors for workshops,
     * which will show up in in the workshop editor.
     */
    instructor_roles: UserRoleUUID[];
};

export type TFAQItem = {
    title: string;
    description?: string;
    children?: TFAQItem[];
    children_columns?: number;
    default_open?: boolean;
    always_open?: boolean;
    bordered?: boolean;
    title_centered?: boolean;
};

/**
 * TConfig - Global configuration for the website
 */
export type TConfig = {
    timestamp: UnixTimestamp;
    general: TGeneralConfig;
    checkout: TCheckoutConfig;
    file: TFileConfig;
    schedule: TScheduleConfig;
    workshop: TWorkshopConfig;
    faq?: TFAQItem;
};
