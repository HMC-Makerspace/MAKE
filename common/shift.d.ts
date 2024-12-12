import { UnixTimestamp } from "./global";

/** 
 * Shift - Object to store information about all shifts
 * @property timestamp_start - the start time of a shift
 * @property timestamp_end - the end time of the shift
 * @property email - the weekday of the shift
 * @property stewards - the stewards working that shift (contained in a list)
*/
export type Shift = {
    timestamp_start: UnixTimestamp,
    timestamo_end: UnixTimestamp;
    email: string;
    timestamp: number;
}