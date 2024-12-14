import { UnixTimestamp } from "./global";

/**
 * Shift - Object to store information about all shifts
 * @property ms_start - the number of milliseconds after midnight that this shift starts
 * @property ms_end - the number of milliseconds after midnight that this shift ends
 * @property day - the 0-indexed day that this shift occurs (0 = Sunday)
 * @property stewards - the UUID of a single steward that is on this shift (there could be multiple shift objects with the same `ms_start` and `ms_end` but different assignees)
 * @property history - A list of `ShiftEvent` objects for this shift
 */
export type TShift = {
    ms_start: number;
    ms_end: number;
    day: number;
    stewards: UUID;
    history: ShiftEvent;
};

/**
 * ShiftEvent - Object to store information about all changes to a shift
 * @property date - the date of the shift that is being modified
 * @property ms_start - the number of milliseconds after midnight that this shift starts
 * @property ms_end - the number of milliseconds after midnight that this shift ends
 * @property event - what modification is being made to the shift
 * @property steward - the UUID of the steward who is modifying their shift
 */
export type TShiftEvent = {
    date: UnixTimestamp;
    ms_start: number;
    ms_end: number;
    event: SHIFT_EVENTS
    steward: UUID;
}

/**
 * SHIFT_EVENTS - Possible Shift Event
 * @member DROP - If the steward is dropping their shift
 * @member PICKUP - If the steward is picking up a shift
 * @member CHECKIN - If the steward has checked into their shift (present)
 */
export enum SHIFT_EVENTS {
    DROP = "drop",
    PICKUP = "pickup",
    CHECKIN = "checkin",
}