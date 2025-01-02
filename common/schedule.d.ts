import type { UnixTimestamp, UUID } from "./global";
import type { TPublicShiftData, TShift } from "./shift";

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
 * @property timestamp_start -  A unix timestamp for when this schedule
 *      becomes active
 * @property timestamp_end - A unix timestamp for when this schedule
 *      becomes inactive
 * @property shifts - A list of {@link TShift | Shift} objects for this
 *      schedule
 * @property alerts - A list of {@link TAlert | Alert} objects that occurred
 *      during this schedule
 */
export type TSchedule = {
    uuid: UUID;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    shifts: TShift[];
    alerts: TAlert[];
};

/**
 * TPublicScheduleData - A public version of the schedule data
 * @property shifts - A list of {@link TPublicShiftData | PublicShiftData}
 *      objects for this schedule
 */
export type TPublicScheduleData = {
    shifts: TPublicShiftData[];
};
