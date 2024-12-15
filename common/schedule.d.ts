import { UnixTimestamp } from "./global";
import { TShift } from "./shift";

/**
 * Schedule - Object to store information about the schedule
 * @property timestamp_start -  A unix timestamp for when this schedule becomes active
 * @property timestamp_end - A unix timestamp for when this schedule becomes inactive
 * @property shifts - A list of Shift objects (from shift.d.ts) for this schedule
 * @property alerts - A list of Alert objects that occurred during this schedule
 */
export type TSchedule = {
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    shifts: TShift[];
    alerts: TAlert[];
};

/**
 * Schedule - Object to store information about the schedule
 * @property timestamp_start -  A unix timestamp for when this was alerted
 * @property timestamp_end - A unix timestamp for when this was alert was handled
 * @property header - The header message (subject) of the alert message
 * @property message - The actual, detailed alert message
 * @property default - Optional boolean if this is or isn't a default alert
 *                     If there is no active alert (no timestamps with an end time before the current time), a randomly selected alert with the `default` tag will be shown
 */
export type TAlert = {
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    header: string;
    message: string;
    default?: Boolean
}