import { API_SCOPES, UUID } from "common/global";
import {
    getWorkshops,
    getWorkshop,
    createWorkshop,
    deleteWorkshop,
    updateWorkshop,
    rsvpToWorkshop,
    cancelRSVPToWorkshop,
    signInToWorkshop,
} from "controllers/workshop.controller";
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
import { TWorkshop } from "common/workshop";

// --- Request and Response Types ---
type WorkshopRequest = Request<{}, {}, { workshop_obj: TWorkshop }>;
type RSVPRequest = Request<{
    UUID: any;
    workshop_uuid: string;
    user_uuid: string;
}>;
type WorkshopResponse = Response<TWorkshop | TWorkshop[] | ErrorResponse>;

const router = Router();

// --- Workshop Routes ---

/**
 * Creates a new workshop. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPES.CREATE_WORKSHOP} scope.
 */
router.post("/", async (req: WorkshopRequest, res: WorkshopResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const workshop_obj = req.body.workshop_obj;
    const workshop_uuid = workshop_obj.uuid;

    // If no requesting workshop uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating a workshop",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Creating a workshop.`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create a workshop
    if (await verifyRequest(requesting_uuid, API_SCOPES.CREATE_WORKSHOP)) {
        const workshop = await createWorkshop(workshop_obj);
        if (!workshop) {
            req.log.warn(
                `An attempt was made to create a workshop with uuid ` +
                    `${workshop_uuid}, but a workshop with that uuid already exists`,
            );
            res.status(StatusCodes.NOT_ACCEPTABLE).json({
                error: `A workshop with uuid \`${workshop_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created workshop with uuid ${workshop_uuid}`);
        res.status(StatusCodes.OK).json(workshop);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create a workshop",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Deletes a workshop. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPES.DELETE_WORKSHOP} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: WorkshopResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const workshop_uuid = req.params.UUID;

        // If no requesting workshop uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a workshop",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a workshop by uuid ${workshop_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a workshop object
        if (await verifyRequest(requesting_uuid, API_SCOPES.DELETE_WORKSHOP)) {
            const workshop = await deleteWorkshop(workshop_uuid);
            if (!workshop) {
                req.log.warn(`Failed to delete workshop ${workshop_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Failed to delete workshop \`${workshop_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Deleted workshop ${workshop_uuid}`);
            res.status(StatusCodes.OK).json(workshop);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a workshop",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update a specific workshop. This route will not create a new workshop if the
 * UUID does not exist. Instead, it will return a 404 error.
 * This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPES.UPDATE_WORKSHOP} scope.
 */
router.put("/", async (req: WorkshopRequest, res: WorkshopResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const workshop_obj = req.body.workshop_obj;
    const workshop_uuid = workshop_obj.uuid;

    // If no requesting workshop uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating a workshop",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Updating a workshop by uuid ${workshop_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, update a workshop's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.UPDATE_WORKSHOP)) {
        const workshop = await updateWorkshop(workshop_obj);
        if (!workshop) {
            req.log.warn(`Workshop ${workshop_uuid} failed to update`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Workshop \`${workshop_uuid}\` failed to update.`,
            });
            return;
        }
        req.log.debug("Returned updated workshop.");
        res.status(StatusCodes.OK).json(workshop);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to update a workshop",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get all workshops. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.GET_ALL_WORKSHOPS} scope.
 */
router.get("/", async (req: WorkshopRequest, res: WorkshopResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;

    // If no requesting workshop uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all workshops",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all workshops",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all workshop information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_WORKSHOPS)) {
        const workshops = await getWorkshops();
        if (!workshops) {
            req.log.error("No workshops found in the database.");
            res.status(StatusCodes.NOT_FOUND).json({
                error: "No workshops found in the database.",
            });
            return;
        }
        req.log.debug("Returned all workshops");
        res.status(StatusCodes.OK).json(workshops);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all workshops",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get a specific workshop. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.GET_ONE_WORKSHOPS} scope.
 */
router.get(
    "/",
    async (req: Request<{ UUID: string }>, res: WorkshopResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const workshop_uuid = req.body;

        // If no requesting workshop uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a workshop",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting a workshop by uuid ${workshop_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, get a workshop's information
        if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ONE_WORKSHOP)) {
            const workshop = await getWorkshop(workshop_uuid);
            if (!workshop) {
                req.log.warn(`Workshop not found by uuid ${workshop}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No workshop found with uuid \`${workshop}\`.`,
                });
                return;
            }
            req.log.debug("Returned workshop.");
            res.status(StatusCodes.OK).json(workshop);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a workshop",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * rsvpToWorkshop. This is a protected route and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.RSVP_WORKSHOPS} scope.
 */
router.patch(
    "/:workshop_uuid/rsvp/:user_uuid",
    async (req: RSVPRequest, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const workshop_uuid = req.params.workshop_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting workshop uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while checking in a workshop",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `RSVPing to a workshop by uuid ${workshop_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a workshop's information
        if (await verifyRequest(requesting_uuid, API_SCOPES.RSVP_WORKSHOP)) {
            const rsvp_successful = await rsvpToWorkshop(
                workshop_uuid,
                user_uuid,
            );
            if (!rsvp_successful) {
                req.log.warn(
                    `Workshop with uuid ${workshop_uuid} not found, failed to RSVP`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Workshop with uuid \`${workshop_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("RSVP'd successfully.");
            res.status(StatusCodes.OK);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to rsvp to a workshop",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * cancelRSVPToWorkshop. This is a protected route and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.RSVP_WORKSHOPS} scope.
 */
router.patch(
    "/:workshop_uuid/rsvp/:user_uuid",
    async (req: RSVPRequest, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const workshop_uuid = req.params.workshop_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting workshop uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while cancelling a workshop RSVP.",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Cancelling RSVP to a workshop by uuid ${workshop_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a workshop's information
        if (await verifyRequest(requesting_uuid, API_SCOPES.RSVP_WORKSHOP)) {
            const rsvp_successful = await cancelRSVPToWorkshop(
                workshop_uuid,
                user_uuid,
            );
            if (!rsvp_successful) {
                req.log.warn(
                    `Workshop with uuid ${workshop_uuid} not found, failed to cancel RSVP`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Workshop with uuid \`${workshop_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Canceled RSVP successfully.");
            res.status(StatusCodes.OK);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to cancel an rsvp to a workshop",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * signInToWorkshop. This is a protected route and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.SIGN_IN_WORKSHOP} scope.
 */
router.patch(
    "/:workshop_uuid/rsvp/:user_uuid",
    async (req: RSVPRequest, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const workshop_uuid = req.params.workshop_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting workshop uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while signing into a workshop",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Signing into a workshop by uuid ${workshop_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a workshop's information
        if (await verifyRequest(requesting_uuid, API_SCOPES.RSVP_WORKSHOP)) {
            const rsvp_successful = await signInToWorkshop(
                workshop_uuid,
                user_uuid,
            );
            if (!rsvp_successful) {
                req.log.warn(
                    `Workshop with uuid ${workshop_uuid} not found, failed to sign in`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Workshop with uuid \`${workshop_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Signed in successfully!");
            res.status(StatusCodes.OK);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to sign into a workshop",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
