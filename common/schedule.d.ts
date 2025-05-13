import type { UnixTimestamp, UUID } from "./global";
import type { TPublicShiftData, TShift } from "./shift";

export type ScheduleUUID = UUID;

/**
 * TAlert - Object to store information about an alert about the space
 * @property uuid - the unique identifier for this alert
 * @property default - A flag indicating that this alert is a
 *      default alert. If there is no active alert (no timestamps with an end
 *      time before the current time), a randomly selected alert with the
 *      `default` flag will be shown
 * @property timestamp_start - (optional) A unix timestamp for when this alert
 *     begins. Must be present unless `default` is true
 * @property timestamp_end - A unix timestamp for when this was alert ends.
 *     Must be present unless `default` is true
 * @property header - The header (subject) of the alert message
 * @property message - The actual, detailed alert message
 */
export type TAlert = {
    uuid: UUID;
    default: boolean;
    timestamp_start?: UnixTimestamp;
    timestamp_end?: UnixTimestamp;
    header: string;
    message: string;
};

/**
 * TSchedule - Object to store information about the shift schedule
 * @property uuid - A unique identifier for this schedule
 * @property name - The display name for this schedule
 * @property timestamp_start -  A unix timestamp for when this schedule
 *      becomes active
 * @property timestamp_end - A unix timestamp for when this schedule
 *      becomes inactive
 * @property shifts - A list of {@link TShift | Shift} objects for this
 *      schedule
 * @property alerts - A list of {@link TAlert | Alert} objects that occurred
 *      during this schedule
 * @property daily_open_time - The time (in seconds after midnight) that shifts start
 * @property daily_close_time - he time (in seconds after midnight) that shifts end
 * @property active - Whether or not to display the schedule as the active schedule
 */
export type TSchedule = {
    uuid: UUID;
    name: string;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    shifts: TShift[];
    alerts: TAlert[];
    daily_open_time: number;
    daily_close_time: number;
    active: boolean;
};

/**
 * TPublicScheduleData - A public version of the schedule data
 * @property shifts - A list of {@link TPublicShiftData | PublicShiftData}
 *      objects for this schedule
 */
export type TPublicScheduleData = {
    shifts: TPublicShiftData[];
    daily_open_time: number;
    daily_close_time: number;
};

const EXAMPLE_SCHEDULE: TSchedule = {
    uuid: "example-schedule",
    name: "Example Schedule",
    timestamp_start: 1740106000,
    timestamp_end: 1840106000,
    shifts: [
        {
            uuid: "example-shift-1",
            day: 0,
            sec_start: 43200,
            sec_end: 46800,
            assignee: "example-user",
            history: [],
        },
        {
            uuid: "example-shift-2",
            day: 0,
            sec_start: 46800,
            sec_end: 50400,
            assignee: "example-user-2",
            history: [],
        },
        {
            uuid: "example-shift-3",
            day: 0,
            sec_start: 46200,
            sec_end: 50400,
            assignee: "example-user-3",
            history: [],
        },
        {
            uuid: "example-shift-4",
            day: 6,
            sec_start: 46200,
            sec_end: 86400,
            assignee: "example-user-4",
            history: [],
        },
    ],
    alerts: [],
    daily_open_time: 43200,
    daily_close_time: 86400,
};
