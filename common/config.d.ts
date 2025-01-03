/**
 * TConfig - Global configuration for the website
 */
export type TConfig = {
    checkout: {
        /**
         * something to do with how often notifications are sent...
         */
    };
    file: {
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
    schedule: {
        /**
         * A list of day indices (based on {@link SHIFT_DAY}) that the space
         * is open. If not present, assume the space is open all 7 days of
         * the week. Only affects how the public schedule is displayed.
         */
        days_open?: number[];
        /**
         * The index of the first day of shifts to visually show in the
         * schedule. By default, Sunday (0) is the first day, but setting
         * `shift_first_day` to 1 will display Monday first. Does not affect
         * the indices of user shifts.
         */
        first_display_day?: number;
    };
    shift: {
        /**
         * A list of the time when shifts start each day (in seconds
         * after midnight), indexed based on {@link SHIFT_DAY}.
         */
        daily_start_sec: number[];
        /**
         * A list of the time when shifts end each day (in seconds
         * after midnight), indexed based on {@link SHIFT_DAY}.
         */
        daily_end_sec: number[];
        /**
         * The increment between shifts (in seconds). This should evenly
         * divide `daily_end_sec - daily_start_sec`.
         */
        increment_between_shifts: number;
    };
};
