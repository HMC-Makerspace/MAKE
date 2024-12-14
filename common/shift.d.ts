import { UnixTimestamp } from "./global";

/**
 * Shift - Object to store information about all shifts
 * @property ms_start - the number of milliseconds after midnight that this shift ends
 * @property ms_end - the number of milliseconds after midnight that this shift ends
 * @property day - the 0-indexed day that this shift occurs (0 = Sunday)
 * @property stewards - the UUID of a single steward that is on this shift (there could be multiple shift objects with the same `ms_start` and `ms_end` but different assignees)
 * @property history - A list of `ShiftEven` objects for this shift
 */
export type TShift = {
    ms_start: number;
    ms_end: number;
    day: number;
    stewards: number;
    history
};
