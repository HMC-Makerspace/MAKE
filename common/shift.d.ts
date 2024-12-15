import { UnixTimestamp } from "./global";

/**
 * The 0-indexed days of the week for shifts
 */
export enum SHIFT_DAY {
    SUNDAY = 0,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
}

/**
 * Shift - Object to store information about all shifts
 * @property ms_start - the number of milliseconds after midnight that this shift starts
 * @property ms_end - the number of milliseconds after midnight that this shift ends
 * @property day - the 0-indexed day that this shift occurs (0 = Sunday)
 * @property assignee - the UUID of user who is on this shift (note: there can be multiple Shift objects with the same `ms_start` and `ms_end` but different assignees)
 * @property history - A list of `ShiftEvent` objects for this shift
 */
export type TShift = {
    ms_start: number;
    ms_end: number;
    day: SHIFT_DAY;
    assignee: UUID;
    history: ShiftEvent[];
};

/**
 * ShiftEvent - Object to store information about all changes to a shift
 * @property timestamp - the timestamp that this shift event occurred
 * @property shift_date - The date of the shift that this event occurred on
 * @property type - what modification is being made to the shift
 * @property initiator - the UUID of the user who incurred this shift event
 */
export type TShiftEvent = {
    timestamp: UnixTimestamp;
    shift_date: UnixTimestamp;
    type: SHIFT_EVENT;
    initiator: UUID;
};

/**
 * SHIFT_EVENT - An event regarding the status of a shift
 * @member DROP - If the shift assignee is dropping their shift
 * @member PICKUP - If the shift assignee is picking up a shift
 * @member CHECKIN - If the shift assignee has checked into their shift (present)
 */
export enum SHIFT_EVENT {
    DROP = "drop",
    PICKUP = "pickup",
    CHECKIN = "checkin",
}
