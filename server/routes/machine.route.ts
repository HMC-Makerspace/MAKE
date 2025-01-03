import { API_SCOPE } from "common/global";
import { TMachine, TMachineStatus, TPublicMachineData } from "common/machine";
import {
    ErrorResponse,
    FORBIDDEN_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import {
    createMachine,
    deleteMachine,
    getMachine,
    getMachines,
    getMachinesVisibleToUser,
    updateMachine,
    updateMachineStatuses,
} from "controllers/machine.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

// --- Request and Response Types ---
type MachineRequest = Request<{}, {}, { machine_obj: TMachine }>;
type MachineResponse = Response<TMachine | ErrorResponse>;
type MachinesResponse = Response<TMachine[] | ErrorResponse>;

type MachineStatusRequest = Request<
    { machine_uuid: string },
    {},
    { statuses: TMachineStatus[] }
>;

const router = Router();

// --- Machine Routes ---

/**
 * Get all public machines. This route allows for an optional
 * `requesting_uuid` header to find all machines that this user is
 * authorized to see. If the user is an admin or has the
 * {@link API_SCOPE.GET_ALL_CERTIFICATIONS} scope, all machines
 * are returned.
 */
router.get(
    "/public",
    async (req: Request, res: Response<TPublicMachineData[]>) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;

        req.log.debug({
            msg: `Getting machines visible to user ${requesting_uuid}.`,
            requesting_uuid: requesting_uuid,
        });

        const machines = await getMachinesVisibleToUser(requesting_uuid);
        if (!machines) {
            req.log.warn(`No machines visible to user ${requesting_uuid}.`);
        } else {
            req.log.debug(
                `Returned machines visible to user ${requesting_uuid}.`,
            );
        }
        res.status(StatusCodes.OK).json(machines);
    },
);

/**
 * Get a specific machine by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_MACHINES} scope or the {@link API_SCOPE.GET_MACHINE}
 * scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: MachineResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting all machines",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const machine_uuid = req.params.UUID;

        req.log.debug({
            msg: `Getting machine by uuid ${machine_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // The user must be authorized to get all machines or get a specific machine
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_MACHINES,
                API_SCOPE.GET_MACHINE,
            )
        ) {
            // If the user is authorized, get the machine information
            const machine = await getMachine(machine_uuid);
            if (!machine) {
                req.log.warn(`Machine not found by uuid ${machine}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No machine found with uuid \`${machine}\`.`,
                });
                return;
            }
            req.log.debug("Returned machine.");
            res.status(StatusCodes.OK).json(machine);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: `Forbidden user attempted to get a machine by uuid ${machine_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get all machines. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_MACHINES} scope.
 */
router.get("/", async (req: MachineRequest, res: MachinesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all machines",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all machines",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all machine information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_MACHINES)) {
        const machines = await getMachines();
        // If no machines are found, log an error, but still return
        // the empty array
        if (!machines) {
            req.log.error("No machines found in the database.");
        } else {
            req.log.debug("Returned all machines");
        }
        res.status(StatusCodes.OK).json(machines);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all machines",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Creates a new machine. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_MACHINE} scope.
 */
router.post("/", async (req: MachineRequest, res: MachineResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const machine_obj = req.body.machine_obj;
    const machine_uuid = machine_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating a machine",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Creating a machine.`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create a machine
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_MACHINE)) {
        const machine = await createMachine(machine_obj);
        if (!machine) {
            req.log.warn(
                `An attempt was made to create a machine with uuid ` +
                    `${machine_uuid}, but a machine with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A machine with uuid \`${machine_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created machine with uuid ${machine_uuid}`);
        res.status(StatusCodes.CREATED).json(machine);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create a machine",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a specific machine. This route will not create a new machine if the
 * UUID does not exist. Instead, it will return a 404 error.
 * This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_MACHINE} scope.
 */
router.put("/", async (req: MachineRequest, res: MachineResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const machine_obj = req.body.machine_obj;
    const machine_uuid = machine_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating a machine",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Updating a machine by uuid ${machine_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, update a machine's information
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_MACHINE)) {
        const machine = await updateMachine(machine_obj);
        if (!machine) {
            req.log.warn(`Machine ${machine_uuid} failed to update`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Machine \`${machine_uuid}\` failed to update.`,
            });
            return;
        }
        req.log.debug("Returned updated machine.");
        res.status(StatusCodes.OK).json(machine);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to update a machine",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Deletes a machine. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_MACHINE} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: MachineResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const machine_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a machine",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a machine by uuid ${machine_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a machine object
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_MACHINE)) {
            const machine = await deleteMachine(machine_uuid);
            if (!machine) {
                req.log.warn(`Failed to delete machine ${machine_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Failed to delete machine \`${machine_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Deleted machine ${machine_uuid}`);
            res.status(StatusCodes.OK).json(machine);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a machine",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update the list of statuses for a machine type. This is a protected route
 * and a `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_MACHINE_STATUSES} scope, or be able to update any
 * machine.
 */
router.patch(
    "/:machine_uuid/statuses/",
    async (req: MachineStatusRequest, res: MachineResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const machine_uuid = req.params.machine_uuid;
        const statuses = req.body.statuses;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating the machine statuses",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating statuses of machine with uuid ${machine_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update the machine's statuses
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_MACHINE,
                API_SCOPE.UPDATE_MACHINE_STATUSES,
            )
        ) {
            const updated_machine = await updateMachineStatuses(
                machine_uuid,
                statuses,
            );
            if (!updated_machine) {
                req.log.warn(
                    `Machine with uuid ${machine_uuid} not found, failed to update statuses`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Machine with uuid \`${machine_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Updated machine statuses successfully.");
            res.status(StatusCodes.OK).json(updated_machine);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to update machine statuses",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
