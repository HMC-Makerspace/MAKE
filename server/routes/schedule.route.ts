import { API_SCOPE, UUID } from "common/global";
import {
    getActiveSchedule,
    getActivePublicSchedule,
    createSchedule,
    deleteSchedule,
    updateSchedule,
    getActiveAlerts,
    getSchedule,
    getSchedules,
    getShiftsByUser,
    getDroppedShiftsByUser,
    getPickedUpShiftsByUser,
    createShiftInSchedule,
    updateShiftInSchedule,
    deleteShiftInSchedule,
    addShiftEventInSchedule,
    createAlertInSchedule,
    updateAlertInSchedule,
    deleteAlertInSchedule,
    setActiveSchedule,
    patchSchedule,
} from "controllers/schedule.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
    SuccessfulResponse,
} from "common/verify";
import { TAlert, TPublicScheduleData, TSchedule } from "common/schedule";
import { TShift, TShiftEvent } from "common/shift";

// --- Request and Response Types ---
type ScheduleRequest = Request<{}, {}, { schedule_obj: TSchedule }>;
type ScheduleResponse = Response<TSchedule | ErrorResponse>;
type PublicScheduleResponse = Response<TPublicScheduleData | ErrorResponse>;
type SchedulesResponse = Response<TSchedule[] | ErrorResponse>;

type ShiftRequest = Request<
    { schedule_uuid: string },
    {},
    { shift_obj: TShift }
>;
type ShiftUpdateRequest = Request<
    { schedule_uuid: string; shift_uuid: string },
    {},
    { shift_obj: TShift }
>;
type ShiftEventRequest = Request<
    { schedule_uuid: string; shift_uuid: string },
    {},
    { event_obj: TShiftEvent }
>;
type ShiftsResponse = Response<TShift[] | ErrorResponse>;

type AlertRequest = Request<
    { schedule_uuid: string },
    {},
    { alert_obj: TAlert }
>;
type AlertUpdateRequest = Request<
    { schedule_uuid: string; alert_uuid: string },
    {},
    { alert_obj: TAlert }
>;
type AlertsResponse = Response<TAlert[] | ErrorResponse>;

const router = Router();

// --- Shift Routes ---

/**
 * Get a list of shifts for a given user in the active schedule. This is
 * a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the
 * {@link API_SCOPE.GET_ALL_SHIFTS} scope. If the requesting user is
 * the same as the user being queried, the {@link API_SCOPE.GET_OWN_SHIFTS}
 * scope is allowed instead. This route will return a list of shifts for
 * the user, or a 403 error if the user is not authorized.
 */
router.get(
    "/active/shifts/by/user/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: ShiftsResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a user's active shifts",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting active shifts for user ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get shifts by user request is valid if the requesting user can
        // get all shifts, get shifts for any user, or get their own shifts
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_SHIFTS,
                API_SCOPE.GET_OWN_SHIFTS,
                requesting_uuid == user_uuid && API_SCOPE.GET_OWN_SHIFTS,
            )
        ) {
            // If authorized, get the user's shift information
            const shifts = await getShiftsByUser(user_uuid);
            if (shifts === null) {
                req.log.error("No shift found");
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No shift found for user ${user_uuid}.`,
                });
            } else {
                req.log.debug("Returned user's shifts.");
                res.status(StatusCodes.OK).json(shifts);
            }
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a user's shifts",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 *
 */
router.get(
    "/active/drops/by/user/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: ShiftsResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a user's " +
                    "active shift drops",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting active shift drops for user ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get shifts by user request is valid if the requesting user can
        // get all shifts, get shifts for any user, or get their own shifts
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_SHIFTS,
                API_SCOPE.GET_USER_DROPPED_SHIFTS,
                requesting_uuid == user_uuid && API_SCOPE.GET_OWN_SHIFTS,
            )
        ) {
            // If authorized, get the user's schedule information
            const dropped_shifts = await getDroppedShiftsByUser(user_uuid);
            if (dropped_shifts === null) {
                req.log.error("No dropped shifts found");
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No dropped shifts found for user ${user_uuid}.`,
                });
            } else {
                req.log.debug("Returned user's dropped shifts.");
                res.status(StatusCodes.OK).json(dropped_shifts);
            }
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a user's dropped shifts",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

router.get(
    "/active/pickups/by/user/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: ShiftsResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a user's " +
                    "active shift pickups",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting active shift pickups for user ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get shifts by user request is valid if the requesting user can
        // get all shifts, get shifts for any user, or get their own shifts
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_SHIFTS,
                API_SCOPE.GET_USER_PICKED_UP_SHIFTS,
                requesting_uuid == user_uuid && API_SCOPE.GET_OWN_SHIFTS,
            )
        ) {
            // If authorized, get the user's shifts information
            const dropped_shifts = await getPickedUpShiftsByUser(user_uuid);
            if (dropped_shifts === null) {
                req.log.error("No active schedule found");
                res.status(StatusCodes.NOT_FOUND).json({
                    error: "No active schedule found.",
                });
            } else {
                req.log.debug("Returned user's shift pickups.");
                res.status(StatusCodes.OK).json(dropped_shifts);
            }
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a user's shift pickups",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Create a new shift in a schedule. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_SHIFT} scope. This route will return a 201 status
 * code if the shift is created, a 403 status code if the user is not authorized,
 * and a 409 status code if the shift already exists.
 */
router.post(
    "/:schedule_uuid/shifts",
    async (req: ShiftRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const shift_obj = req.body.shift_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while creating a shift` +
                    ` in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Creating a shift in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, create a shift
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.CREATE_SHIFT,
                API_SCOPE.UPDATE_SCHEDULE,
            )
        ) {
            const new_schedule = await createShiftInSchedule(
                schedule_uuid,
                shift_obj,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to create a shift with uuid ` +
                        `${shift_obj.uuid}, but a shift with that uuid already exists`,
                );
                res.status(StatusCodes.CONFLICT).json({
                    error: `A shift with uuid \`${shift_obj.uuid}\` already exists.`,
                });
                return;
            }
            req.log.debug(`Created shift with uuid ${shift_obj.uuid}`);
            res.status(StatusCodes.CREATED).json(new_schedule);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to create a shift",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update a specific shift in a schedule. This route will not create a new shift if the
 * UUID does not exist. Instead, it will return a 404 error. This is a protected route,
 * and a `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_SHIFT} scope or the {@link API_SCOPE.UPDATE_SCHEDULE} scope.
 * This route will return a 201 status code if the shift is created, a 403 status code if
 * the user is not authorized, a 409 status code if the shift already exists, and a
 * 404 status code if the schedule does not exist.
 */
router.put(
    "/:schedule_uuid/shifts/:shift_uuid",
    async (req: ShiftUpdateRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const shift_uuid = req.params.shift_uuid;
        const shift_obj = req.body.shift_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while updating a shift` +
                    ` in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating a shift in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update the shift
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_SHIFT,
                API_SCOPE.UPDATE_SCHEDULE,
            )
        ) {
            const new_schedule = await updateShiftInSchedule(
                schedule_uuid,
                shift_uuid,
                shift_obj,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to update a shift with uuid ${shift_uuid}` +
                        ` in the schedule with uuid ${schedule_uuid}, but the` +
                        ` schedule or shift was not found`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule with uuid \`${schedule_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug(
                `Updated shift with uuid ${shift_obj.uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.OK).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to update a shift in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

router.delete(
    "/:schedule_uuid/shifts/:shift_uuid",
    async (req: ShiftUpdateRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const shift_uuid = req.params.shift_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while deleting a shift` +
                    ` in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a shift in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete the shift
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.DELETE_SHIFT,
                API_SCOPE.UPDATE_SCHEDULE,
            )
        ) {
            const new_schedule = await deleteShiftInSchedule(
                schedule_uuid,
                shift_uuid,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to delete a shift with uuid ` +
                        `${shift_uuid} in the schedule with uuid ` +
                        `${schedule_uuid}, but either the shift or the ` +
                        `schedule was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule or shift not found.`,
                });
                return;
            }
            req.log.debug(
                `Deleted shift with uuid ${shift_uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.OK).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to delete a shift in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Add a new event to a shift in a schedule. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.POST_SHIFT_EVENT} scope or the {@link API_SCOPE.UPDATE_SCHEDULE}
 * scope. This route will return a 201 status code if the event is created, a 403
 * status code if the user is not authorized, a 409 status code if the event already
 * exists, and a 404 status code if the schedule or shift does not exist.
 */
router.patch(
    "/:schedule_uuid/shifts/:shift_uuid/event",
    async (req: ShiftEventRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const shift_uuid = req.params.shift_uuid;
        const event_obj = req.body.event_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while adding an event to shift ` +
                    `${shift_uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Adding an event to shift ${shift_uuid} in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, add the event
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.POST_SHIFT_EVENT,
                API_SCOPE.UPDATE_SCHEDULE,
            )
        ) {
            const new_schedule = await addShiftEventInSchedule(
                schedule_uuid,
                shift_uuid,
                event_obj,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to add an event to a shift in the schedule ` +
                        `with uuid ${schedule_uuid}, but that schedule or shift was not found`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule or shift not found.`,
                });
                return;
            }
            req.log.debug(
                `Added event to shift with uuid ${shift_uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.CREATED).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to add an event to a shift in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get the active active alerts for a schedule. This is a public route.
 */
router.get("/active/alerts", async (req: Request, res: AlertsResponse) => {
    req.log.debug("Getting active active alerts.");

    const alerts = await getActiveAlerts();
    if (!alerts) {
        req.log.warn("No active alerts found.");
        res.status(StatusCodes.NOT_FOUND).json({
            error: "No active alerts found.",
        });
    } else {
        req.log.debug("Returned active alerts.");
        res.status(StatusCodes.OK).json(alerts);
    }
});

/**
 * Add an alert to a schedule. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_SCHEDULE} scope or the {@link API_SCOPE.CREATE_ALERT}
 * scope. This route will return a 201 status code if the alert is created, a 403
 * status code if the user is not authorized, and a 404 status code if the schedule
 * does not exist.
 */
router.post(
    "/:schedule_uuid/alerts",
    async (req: AlertRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const alert_obj = req.body.alert_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while creating an alert in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Creating an alert in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, create an alert
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_SCHEDULE,
                API_SCOPE.CREATE_ALERT,
            )
        ) {
            const new_schedule = await createAlertInSchedule(
                schedule_uuid,
                alert_obj,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to create an alert in the schedule ` +
                        `with uuid ${schedule_uuid}, but that schedule was not found`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule with uuid \`${schedule_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug(`Created alert in schedule ${schedule_uuid}`);
            res.status(StatusCodes.CREATED).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to create an alert in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update a specific alert in a schedule. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_SCHEDULE} scope or the {@link API_SCOPE.UPDATE_ALERT}
 * scope. This route will return a 200 status code if the alert is updated, a 403
 * status code if the user is not authorized, and a 404 status code if the schedule
 * or alert does not exist.
 */
router.put(
    "/:schedule_uuid/alerts/:alert_uuid",
    async (req: AlertUpdateRequest, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const alert_uuid = req.params.alert_uuid;
        const alert_obj = req.body.alert_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while updating an alert in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating alert ${alert_uuid} in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update the alert
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_SCHEDULE,
                API_SCOPE.UPDATE_ALERT,
            )
        ) {
            const new_schedule = await updateAlertInSchedule(
                schedule_uuid,
                alert_uuid,
                alert_obj,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to update an alert in the schedule ` +
                        `with uuid ${schedule_uuid}, but that schedule or alert was not found`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule or alert not found.`,
                });
                return;
            }
            req.log.debug(
                `Updated alert with uuid ${alert_uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.OK).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to update an alert in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specific alert in a schedule.
 * This is a protected route, and a `requesting_uuid` header is required to call it.
 * The user must have the {@link API_SCOPE.UPDATE_SCHEDULE} scope or the
 * {@link API_SCOPE.DELETE_ALERT} scope. This route will return a 200 status code if
 * the alert is deleted, a 403 status code if the user is not authorized, and a 404
 * status code if the schedule or alert does not exist.
 */
router.delete(
    "/:schedule_uuid/alerts/:alert_uuid",
    async (
        req: Request<{ schedule_uuid: string; alert_uuid: string }>,
        res: ScheduleResponse,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.schedule_uuid;
        const alert_uuid = req.params.alert_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                `No requesting_uuid was provided while deleting an alert in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting alert ${alert_uuid} in schedule ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete the alert
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_SCHEDULE,
                API_SCOPE.DELETE_ALERT,
            )
        ) {
            const new_schedule = await deleteAlertInSchedule(
                schedule_uuid,
                alert_uuid,
            );
            if (!new_schedule) {
                req.log.warn(
                    `An attempt was made to delete an alert in the schedule ` +
                        `with uuid ${schedule_uuid}, but that schedule or alert was not found`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Schedule or alert not found.`,
                });
                return;
            }
            req.log.debug(
                `Deleted alert with uuid ${alert_uuid} in schedule ${schedule_uuid}`,
            );
            res.status(StatusCodes.OK).json(new_schedule);
        } else {
            req.log.warn({
                msg: `Forbidden user attempted to delete an alert in schedule ${schedule_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

// --- Schedule Routes ---

/**
 * Get all schedules. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_SCHEDULES} scope.
 */
router.get("/", async (req: Request, res: SchedulesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all schedules.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all schedules.",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all schedule information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_SCHEDULES)) {
        const schedules = await getSchedules();
        // If no schedules are found, log an error, but still return an empty
        // list of schedules
        if (!schedules) {
            req.log.error("No schedules found in the database.");
        } else {
            req.log.debug("Returned all schedules");
        }
        res.status(StatusCodes.OK).json(schedules);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all schedules",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get the active schedule. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ACTIVE_SCHEDULE} scope.
 */
router.get("/active", async (req: Request, res: ScheduleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting the active schedule.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Getting the active schedule.`,
        requesting_uuid: requesting_uuid,
    });

    // A get active schedule request is valid if the requesting user can get all
    // schedules or get the active schedule at a time
    if (
        await verifyRequest(
            requesting_uuid,
            API_SCOPE.GET_ALL_SCHEDULES,
            API_SCOPE.GET_ONE_SCHEDULE,
            API_SCOPE.GET_ACTIVE_SCHEDULE,
        )
    ) {
        // If the user is authorized, get a schedule's information
        const schedule = await getActiveSchedule();
        if (!schedule) {
            req.log.warn(`Active schedule not found.`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Active schedule not found.`,
            });
            return;
        }
        req.log.debug("Returned active schedule.");
        res.status(StatusCodes.OK).json(schedule);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get the active schedule",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get the active public schedule. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ACTIVE_PUBLIC_SCHEDULE} scope.
 */
router.get("/public", async (req: Request, res: PublicScheduleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting the active public schedule.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Getting the active public schedule.`,
        requesting_uuid: requesting_uuid,
    });

    // A get active public schedule request is valid if the requesting user
    // can get all schedules or get one schedule or get the active schedule
    // or get the active public schedule at a time
    if (
        await verifyRequest(
            requesting_uuid,
            API_SCOPE.GET_ALL_SCHEDULES,
            API_SCOPE.GET_ONE_SCHEDULE,
            API_SCOPE.GET_ACTIVE_SCHEDULE,
            API_SCOPE.GET_ACTIVE_PUBLIC_SCHEDULE,
        )
    ) {
        // If the user is authorized, get a schedule's information
        const schedule = await getActivePublicSchedule();
        if (!schedule) {
            req.log.warn(`Active public schedule not found.`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Active public schedule not found.`,
            });
            return;
        }
        req.log.debug("Returned active public schedule.");
        res.status(StatusCodes.OK).json(schedule);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get the active public schedule",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get a specific schedule. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ONE_SCHEDULE} scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a schedule",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting a schedule by uuid ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get schedule request is valid if the requesting user can get all
        // schedules or get one schedule at a time
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_SCHEDULES,
                API_SCOPE.GET_ONE_SCHEDULE,
            )
        ) {
            // If the user is authorized, get a schedule's information
            const schedule = await getSchedule(schedule_uuid);
            if (!schedule) {
                req.log.warn(`Schedule not found by uuid ${schedule_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No schedule found with uuid \`${schedule_uuid}\`.`,
                });
                return;
            }
            req.log.debug("Returned schedule.");
            res.status(StatusCodes.OK).json(schedule);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a schedule",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Creates a new schedule. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_SCHEDULE} scope.
 */
router.post("/", async (req: ScheduleRequest, res: ScheduleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const schedule_obj = req.body.schedule_obj;
    const schedule_uuid = schedule_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating a schedule",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Creating a schedule.`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create a schedule
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_SCHEDULE)) {
        const schedule = await createSchedule(schedule_obj);
        if (!schedule) {
            req.log.warn(
                `An attempt was made to create a schedule with uuid ` +
                    `${schedule_uuid}, but a schedule with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A schedule with uuid \`${schedule_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created schedule with uuid ${schedule_uuid}`);
        res.status(StatusCodes.CREATED).json(schedule);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create a schedule",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a specific schedule. This route will not create a new schedule if the
 * UUID does not exist. Instead, it will return a 404 error. This is a
 * protected route, and a `requesting_uuid` header is required to call it.
 * The user must have the {@link API_SCOPE.UPDATE_SCHEDULE} scope.
 */
router.put("/", async (req: ScheduleRequest, res: ScheduleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const schedule_obj = req.body.schedule_obj;
    const schedule_uuid = schedule_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating a schedule",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Updating a schedule by uuid ${schedule_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, update a schedule's information
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_SCHEDULE)) {
        const schedule = await updateSchedule(schedule_obj);
        if (!schedule) {
            req.log.warn(
                `Could not update schedule with uuid ${schedule_uuid} ` +
                    `because it was not found.`,
            );
            res.status(StatusCodes.NOT_FOUND).json({
                error:
                    `Could not update schedule with uuid ` +
                    `\`${schedule_uuid}\` because it was not found.`,
            });
            return;
        }
        req.log.debug("Returned updated schedule.");
        res.status(StatusCodes.OK).json(schedule);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to update a schedule",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Set the active schedule by uuid. Requires the {@link API_SCOPE.UPDATE_SCHEDULE} scope.
 */
router.patch(
    "/active/:UUID",
    async (req: Request<{ UUID: string }>, res: ScheduleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating active schedule",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Setting active schedule to uuid ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a schedule object
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_SCHEDULE)) {
            const schedule = await setActiveSchedule(schedule_uuid);
            if (!schedule) {
                req.log.warn(
                    `Schedule with uuid ${schedule_uuid} could not be ` +
                        `activated because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Schedule with uuid ${schedule_uuid} could not be ` +
                        `activated because it was not found.`,
                });
                return;
            }
            req.log.debug(`Activated schedule ${schedule_uuid}`);
            res.status(StatusCodes.OK).json(schedule);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to activate a schedule",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Set the active schedule by uuid. Requires the {@link API_SCOPE.UPDATE_SCHEDULE} scope.
 */
router.patch(
    "/:UUID",
    async (
        req: Request<
            { UUID: string },
            {},
            { partial_schedule_obj: Partial<TSchedule> }
        >,
        res: ScheduleResponse,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.UUID;
        const partial_schedule = req.body.partial_schedule_obj;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating active schedule",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Patching schedule with uuid ${schedule_uuid}`,
            partial_schedule_obj: partial_schedule,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a schedule object
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_SCHEDULE)) {
            const schedule = await patchSchedule(
                schedule_uuid,
                partial_schedule,
            );
            if (!schedule) {
                req.log.warn(
                    `Schedule with uuid ${schedule_uuid} could not be ` +
                        `patched because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Schedule with uuid ${schedule_uuid} could not be ` +
                        `patched because it was not found.`,
                });
                return;
            }
            req.log.debug(`Patched schedule ${schedule_uuid}`);
            res.status(StatusCodes.OK).json(schedule);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to activate a schedule",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specific schedule. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_SCHEDULE} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const schedule_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a schedule",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a schedule by uuid ${schedule_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a schedule object
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_SCHEDULE)) {
            const schedule = await deleteSchedule(schedule_uuid);
            if (!schedule) {
                req.log.warn(
                    `Schedule with uuid ${schedule_uuid} could not be ` +
                        `deleted because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Schedule with uuid ${schedule_uuid} could not be ` +
                        `deleted because it was not found.`,
                });
                return;
            }
            req.log.debug(`Deleted schedule ${schedule_uuid}`);
            res.status(StatusCodes.NO_CONTENT).json({});
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a schedule",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
