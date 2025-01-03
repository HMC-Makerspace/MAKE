import { UUID } from "common/global";
import { TAlert, TPublicScheduleData, TSchedule } from "common/schedule";
import {
    SHIFT_EVENT_TYPE,
    TPublicShiftData,
    TShift,
    TShiftEvent,
} from "common/shift";
import { UserUUID } from "common/user";
import { Schedule } from "models/schedule.model";
import mongoose from "mongoose";

/**
 * Get all schedules in the database
 * @returns A promise to list of TSchedule objects representing all schedules
 *      in the db
 */
export async function getSchedules(): Promise<TSchedule[]> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.find();
}

/**
 * Get a specific schedule's information, searching by UUID
 * @param schedule_uuid The schedule's UUID to search by
 * @returns A promise to a TSchedule object, or null if no schedule has the given UUID
 */
export async function getSchedule(schedule_uuid: UUID) {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOne({ uuid: schedule_uuid });
}

/**
 * Get the schedule that is currently active.
 * As a note, there should only be one schedule active at a time
 * @returns A promise to the TSchedule object representing the current
 *      schedule, or null if no schedule is currently active
 */
export async function getCurrentSchedule() {
    const Schedules = mongoose.model("Schedule", Schedule, "schedules");
    // Get the schedule that is currently active (should only be one)
    return Schedules.findOne({
        timestamp_start: { $lte: Date.now() / 1000 },
        timestamp_end: { $gte: Date.now() / 1000 },
    });
}

/**
 * Get the public version of the current schedule
 * @returns A promise to the TPublicScheduleData object representing the
 *      current schedule, or null if no schedule is currently active
 *      The public schedule data only includes the shift data for the current
 *      schedule, with the shift UUID and history removed.
 */
export async function getCurrentPublicSchedule(): Promise<TPublicScheduleData | null> {
    const current_schedule = await getCurrentSchedule();
    // If there is no current schedule, there can be no current public schedule
    if (current_schedule === null) {
        return null;
    }
    // Get the public version of each shift, which removes the UUID and history
    // and any active pickup/checkin event initiators as the assignee
    return {
        shifts: current_schedule.shifts
            .map(getCurrentPublicShift)
            // Remove dropped shifts
            .filter((shift) => shift !== null),
    };
}

/**
 * Get the public version of a shift, which removes the UUID and history
 * and any active pickup/checkin event initiators as the assignee
 * @param shift The shift to get the public version of
 * @returns The public version of the shift, or null if the shift is not active
 */
function getCurrentPublicShift(shift: TShift): TPublicShiftData | null {
    // Checking only for today won't work, the shift change might be in the
    // future but we'd still want to show the new assignee, maybe consider
    // looking by week?
    // For now, just pass through the shift data
    return {
        day: shift.day,
        sec_start: shift.sec_start,
        sec_end: shift.sec_end,
        assignee: shift.assignee,
    };
    // Initial implementation:
    // // Get the current date as a timestamp at midnight
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // // Get the current UNIX time
    // const today_timestamp = today.getTime() / 1000;
    // const events_today = shift.history.filter(
    //     (event) => event.shift_date === today_timestamp,
    // );
    // if (events_today.length === 0) {
    //     // If there are no events today, the shift is accurate
    //     return {
    //         day: shift.day,
    //         sec_start: shift.sec_start,
    //         sec_end: shift.sec_end,
    //         assignee: shift.assignee,
    //     };
    // }
    // const last_event = events_today[events_today.length - 1];
    // if (last_event.type === SHIFT_EVENT_TYPE.DROP) {
    //     // If the last event today was a drop, the shift will not occur
    //     return null;
    // } else {
    //     // If the last event today was a pickup or checkin, update the shift
    //     // to reflect the new assignee
    //     return {
    //         day: shift.day,
    //         sec_start: shift.sec_start,
    //         sec_end: shift.sec_end,
    //         assignee: last_event.initiator,
    //     };
    // }
}

/**
 * Create a new schedule in the database
 * @param schedule_obj the complete schedule information
 * @returns The schedule object
 */
export async function createSchedule(
    schedule_obj: TSchedule,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    // Check if the schedule already exists
    const existingSchedule = await Schedules.exists({
        uuid: schedule_obj.uuid,
    });
    if (existingSchedule) {
        // If so, return null, and don't create a new schedule
        return null;
    }
    // If the schedule doesn't exist, create a new schedule and return it
    const newSchedule = new Schedules(schedule_obj);
    return newSchedule.save();
}

/**
 * Delete a schedule in the database by UUID
 * @param schedule_uuid the specific schedule's unique id
 * @returns The deleted schedule object, or null if the schedule doesn't exist
 */
export async function deleteSchedule(
    schedule_uuid: UUID,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    // If the schedule exists, return it and delete it
    return Schedules.findOneAndDelete({ uuid: schedule_uuid });
}

/**
 * Update a schedule in the database, searching by UUID
 * @param schedule_obj the new schedule information
 * @returns The updated schedule object, or null if no schedule exists by the
 *      given UUID
 */
export async function updateSchedule(
    schedule_obj: TSchedule,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    // If the schedule exists, update it and return it
    return Schedules.findOneAndReplace(
        { uuid: schedule_obj.uuid },
        schedule_obj,
        { returnDocument: "after" },
    );
}

/**
 * Get all alerts that are currently active, including default alerts.
 * Must be sorted later to determine which alert to show
 * @returns A promise to a list of TAlert objects representing all alerts
 *     that are currently active or default
 */
export async function getActiveAlerts(): Promise<TAlert[] | null> {
    // Get the current schedule
    const current_schedule = await getCurrentSchedule();
    // If there is no current schedule, there can be no current alert
    if (current_schedule === null) {
        return null;
    }
    // Return all alerts that are default or are currently active
    return current_schedule.alerts.filter(
        (alert) =>
            alert.default ||
            (alert.timestamp_start && // This should always be true when the alert is not default
                alert.timestamp_end && // This should always be true when the alert is not default
                alert.timestamp_start <= Date.now() / 1000 &&
                alert.timestamp_end >= Date.now() / 1000),
    );
}

/**
 * Add a new alert to a schedule
 * @param schedule_uuid The UUID of the schedule to add the alert to
 * @param alert The alert object to add to the schedule
 * @returns The updated schedule object, or null if no schedule exists by the
 *     given UUID
 */
export async function createAlertInSchedule(
    schedule_uuid: UUID,
    alert: TAlert,
) {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule by UUID
        { uuid: schedule_uuid },
        // Push the new alert to the alerts array
        { $push: { alerts: alert } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Update an existing alert in a schedule by UUID
 * @param schedule_uuid The UUID of the schedule that contains the alert
 * @param alert_uuid The UUID of the alert to update
 * @param alert The new alert object to replace the old alert
 * @returns A promise to the updated schedule object, or null if no schedule
 *    has the given UUID, or no alert has the given UUID in the schedule
 */
export async function updateAlertInSchedule(
    schedule_uuid: UUID,
    alert_uuid: UUID,
    alert: TAlert,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule with the given UUID, and the alert with the given UUID
        { uuid: schedule_uuid, "alerts.uuid": alert_uuid },
        // Replace the found alert with the new alert
        { $set: { "alerts.$": alert } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Delete an alert in a schedule by UUID
 * @param schedule_uuid The UUID of the schedule that contains the alert
 * @param alert_uuid The UUID of the alert to delete
 * @returns The updated schedule object, or null if no schedule has the given
 *     UUID, or no alert has the given UUID in the schedule
 */
export async function deleteAlertInSchedule(
    schedule_uuid: UUID,
    alert_uuid: UUID,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule by UUID
        { uuid: schedule_uuid },
        // Pull (remove) the alert with the given UUID from the alerts array
        { $pull: { alerts: { uuid: alert_uuid } } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Get all shifts for a certain user for the current schedule
 * @param user_uuid The UUID of the user to get shifts for
 * @returns The list of shifts assigned to the user, or null if no schedule is active
 */
export async function getShiftsByUser(
    user_uuid: UserUUID,
): Promise<TShift[] | null> {
    const schedule = await getCurrentSchedule();
    if (schedule === null) {
        return null;
    }
    return schedule.shifts.filter((shift) => shift.assignee === user_uuid);
}

/**
 * Get all shifts that a user has dropped for the current schedule
 * @param user_uuid The UUID of the user to get dropped shifts for
 * @returns The list of shifts that the user has dropped, or null if no schedule is active
 */
export async function getDroppedShiftsByUser(
    user_uuid: UserUUID,
): Promise<TShift[] | null> {
    const schedule = await getCurrentSchedule();
    if (schedule === null) {
        return null;
    }
    return schedule.shifts.filter((shift) =>
        shift.history.some(
            (event) =>
                event.initiator === user_uuid &&
                event.type === SHIFT_EVENT_TYPE.DROP,
        ),
    );
}

/**
 * Get all shifts that a user has picked up for the current schedule
 * @param user_uuid The UUID of the user to get picked up shifts for
 * @returns The list of shifts that the user has picked up, or null if no schedule is active
 */
export async function getPickedUpShiftsByUser(
    user_uuid: UserUUID,
): Promise<TShift[] | null> {
    const schedule = await getCurrentSchedule();
    if (schedule === null) {
        return null;
    }
    return schedule.shifts.filter((shift) =>
        shift.history.some(
            (event) =>
                event.initiator === user_uuid &&
                event.type === SHIFT_EVENT_TYPE.PICKUP,
        ),
    );
}

// TODO: Technically all shift functions do not check if a shift
// exists by the given uuid.

/**
 * Create a new shift in a given schedule
 * @param schedule_uuid The UUID of the schedule to add the shift to
 * @param shift The shift object to add to the schedule
 * @returns The updated schedule object, or null if no schedule exists by the
 *    given UUID
 */
export async function createShiftInSchedule(
    schedule_uuid: UUID,
    shift: TShift,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule by UUID
        { uuid: schedule_uuid },
        // Push the new shift to the shifts array
        { $push: { shifts: shift } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Update an existing shift in a schedule by UUID
 * @param schedule_uuid The UUID of the schedule that contains the shift
 * @param shift_uuid The UUID of the shift to update
 * @param shift The new shift object to replace the old shift
 * @returns A promise to the updated schedule object, or null if no schedule
 *      has the given UUID, or no shift has the given UUID in the schedule
 */
export async function updateShiftInSchedule(
    schedule_uuid: UUID,
    shift_uuid: UUID,
    shift: TShift,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule with the given UUID, and the shift with the given UUID
        { uuid: schedule_uuid, "shifts.uuid": shift_uuid },
        // Replace the found shift with the new shift
        { $set: { "shifts.$": shift } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Delete a shift in a schedule by UUID
 * @param schedule_uuid The UUID of the schedule that contains the shift
 * @param shift_uuid The UUID of the shift to delete
 * @returns The updated schedule object, or null if no schedule has the given
 *    UUID, or no shift has the given UUID in the schedule
 */
export async function deleteShiftInSchedule(
    schedule_uuid: UUID,
    shift_uuid: UUID,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule by UUID
        { uuid: schedule_uuid },
        // Pull (remove) the shift with the given UUID from the shifts array
        { $pull: { shifts: { uuid: shift_uuid } } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}

/**
 * Add a new event to a shift's history in a schedule
 * As a note, shift events cannot be updated or deleted after they are created
 * @param schedule_uuid The UUID of the schedule that contains the shift
 * @param shift_uuid The UUID of the shift to add the event to
 * @param event The event object to add to the shift's history
 * @returns The updated schedule object, or null if no schedule has the given
 *      UUID, or no shift has the given UUID in the schedule
 */
export async function addShiftEventInSchedule(
    schedule_uuid: UUID,
    shift_uuid: UUID,
    event: TShiftEvent,
): Promise<TSchedule | null> {
    const Schedules = mongoose.model("Schedule", Schedule);
    return Schedules.findOneAndUpdate(
        // Find the schedule by UUID
        { uuid: schedule_uuid, "shifts.uuid": shift_uuid },
        // Push the new event to the shift's history array
        { $push: { "shifts.$.history": event } },
        // Return the updated schedule
        { returnDocument: "after" },
    );
}
