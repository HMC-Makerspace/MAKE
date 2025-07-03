import type { UnixTimestamp } from "./global";
import type { UserUUID } from "./user";

export type ShiftUUID = string;

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
 * SHIFT_EVENT - An event regarding the status of a shift
 * @member DROP - If the shift assignee is dropping their shift
 * @member PICKUP - If the shift assignee is picking up a shift
 * @member CHECKIN - If the shift assignee has checked into their shift (present)
 */
export enum SHIFT_EVENT_TYPE {
    DROP = "drop",
    PICKUP = "pickup",
    CHECKIN = "checkin",
}

/**
 * ShiftEvent - Object to store information about all changes to a shift
 * @property timestamp - the timestamp that this shift event occurred
 * @property shift_date - The Unix timestamp date of the shift that this event
 *      occurred on, which is midnight of the day the shift is on
 * @property type - what modification is being made to the shift
 * @property initiator - the UUID of the user who incurred this shift event
 */
export type TShiftEvent = {
    timestamp: UnixTimestamp;
    shift_date: UnixTimestamp;
    type: SHIFT_EVENT_TYPE;
    initiator: UserUUID;
};

/**
 * Shift - Object to store information about a given shift
 * @property uuid - the unique identifier for this shift
 * @property day - the 0-indexed day that this shift occurs, according to
 *      {@link SHIFT_DAY}
 * @property sec_start - the number of seconds after midnight that this
 *      shift starts on the given day
 * @property sec_end - the number of seconds after midnight that this
 *      shift ends on the given day
 * @property assignee - the UUID of user who is on this shift (note: there
 *      can be multiple `Shift` objects with the same `ms_start` and `ms_end`
 *      but different assignees)
 * @property history - A list of {@link TShiftEvent | ShiftEvent} objects for
 *      this shift
 */
export type TShift = {
    uuid: ShiftUUID;
    day: SHIFT_DAY;
    sec_start: number;
    sec_end: number;
    assignee: UserUUID;
    history: TShiftEvent[];
};

export type TPublicShiftData = Omit<TShift, "uuid" | "history">;
