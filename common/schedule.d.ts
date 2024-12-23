import type { UnixTimestamp, UUID } from "./global";
import type { TShift } from "./shift";

/**
 * Schedule - Object to store information about the schedule
 * @property timestamp_start -  A unix timestamp for when this was alerted
 * @property timestamp_end - A unix timestamp for when this was alert was handled
 * @property header - The header message (subject) of the alert message
 * @property message - The actual, detailed alert message
 * @property default - A flag indicating that this alert is a
 *      default alert. If there is no active alert (no timestamps with an end
 *      time before the current time), a randomly selected alert with the
 *      `default` flag will be shown
 */
export type TAlert = {
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    header: string;
    message: string;
    default: boolean;
};

/**
 * Schedule - Object to store information about the schedule
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
