import { UnixTimestamp, UUID } from "./global";
import { UserRoleUUID } from "./user";

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
    schedulable_roles: UserRoleUUID[];

    /**
     * The increment between shifts (in seconds).
     */
    increment_sec: number;

    /**
     * The IANA timezone to use for all date objects
     */
    timezone: string;
};

/**
 * TConfig - Global configuration for the website
 */
export type TConfig = {
    timestamp: UnixTimestamp;
    checkout: TCheckoutConfig;
    file: TFileConfig;
    schedule: TScheduleConfig;
};

// const DefaultConfig: TConfig = {
//     checkout: {},
//     file: {
//         max_upload_capacity: 2 * 1024 * 1024 * 1024, // 2 GB
//         max_upload_count: 10,
//     },
//     schedule: {
//         days_open: [0, 1, 2, 3, 4, 5, 6],
//         first_display_day: 1,
//         increment_sec: 60 * 60, // 1 hour
//     },
// };
