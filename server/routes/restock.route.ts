import { API_SCOPE } from "common/global";
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
import { TInventoryItem } from "common/inventory";
import { TRestockRequest, TRestockRequestLog } from "common/restock";
import {
    getRestockRequestsByUser,
    getRestockRequest,
    getRestockRequests,
    updateRestockRequest,
    updateRestockRequestStatus,
    createRestockRequest,
    deleteRestockRequest,
} from "controllers/restock.controller";

// --- Request and Response Types ---
// ok, this is a bad name but its a request related to restock requests,
// what do you want from me
type RestockRequestRequest = Request<{}, {}, { request_obj: TRestockRequest }>;
type RestockResponse = Response<TRestockRequest | ErrorResponse>;
type RestocksResponse = Response<TRestockRequest[] | ErrorResponse>;
type RestockLogRequest = Request<
    { UUID: string },
    {},
    { status_obj: TRestockRequestLog }
>;

const router = Router();

// --- Restock Request Routes ---

/**
 * Get all restock requests made by a specific user.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.GET_ALL_RESTOCKS},
 * {@link API_SCOPE.GET_RESTOCKS_BY_USER}, or be requesting their own restock
 * requests with the {@link API_SCOPE.GET_RESTOCKS_BY_SELF} scope. If the user
 * is not authorized, a status error is returned. If the user is authorized,
 * a list of restock requests are returned.
 */
router.get(
    "/by/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: RestocksResponse) => {
        const user_uuid = req.params.user_uuid;
        if (!user_uuid) {
            req.log.warn(
                "No user UUID was provided while getting restock requests by user",
            );
            res.status(StatusCodes.BAD_REQUEST).json({
                error: "No user UUID was provided.",
            });
            return;
        }

        // Check for authorization
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting restock requests by user",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        req.log.debug({
            msg: `Getting restock requests by user with uuid ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // This request is valid if the requesting user can get all restock
        // requests, get restock requests for any user, or get their own
        // restock requests.
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_RESTOCKS,
                API_SCOPE.GET_RESTOCKS_BY_USER,
                user_uuid === requesting_uuid && API_SCOPE.GET_RESTOCKS_BY_SELF,
            )
        ) {
            // If the user is authorized, get their restock requests.
            const restocks = await getRestockRequestsByUser(user_uuid);
            // Return the user's restock requests
            res.status(StatusCodes.OK).json(restocks);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg:
                    `Forbidden user attempted to get restock requests by ` +
                    `user with uuid ${user_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get a single restock request by UUID.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: RestockResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const restock_uuid = req.params.UUID;
        req.log.debug({
            msg: `Getting restock request by uuid ${restock_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        const restock = await getRestockRequest(restock_uuid);

        if (!restock) {
            req.log.warn(`No restock request found with uuid ${restock_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No restock request found with uuid \`${restock_uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Found restock request with uuid ${restock_uuid}`);
        res.status(StatusCodes.OK).json(restock);
    },
);

/**
 * Get all restock requests. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_RESTOCKS} scope.
 */
router.get("/", async (req: Request, res: RestocksResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all restock requests",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting all restock requests",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all restock requests information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_RESTOCKS)) {
        const restocks = await getRestockRequests();
        // If no restock requests are found, log an error, but still return an
        // empty array
        if (!restocks) {
            req.log.error("No restock requests found in the database");
        } else {
            req.log.debug("Returned all restock requests");
        }
        res.status(StatusCodes.OK).json(restocks);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: "Forbidden user attempted to get all restock requests",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a single restock request by UUID. This will not create the restock
 * request if it does not already exist. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_RESTOCK} scope. If the user is not authorized,
 * a status error is returned. If the user is authorized, the updated restock
 * request object is returned.
 */
router.put("/", async (req: RestockRequestRequest, res: RestockResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const request_obj = req.body.request_obj;
    const request_uuid = request_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating restock request " +
                `with uuid ${request_uuid}.`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Updating restock request by uuid ${request_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, perform the update
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_RESTOCK)) {
        const restock = await updateRestockRequest(request_obj);
        if (!restock) {
            req.log.warn(`No restock request found with uuid ${request_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No restock request found with uuid \`${request_uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Updated restock request with uuid ${request_uuid}`);
        res.status(StatusCodes.OK).json(restock);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: "Forbidden user attempted to update restock request",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

router.patch(
    "/status/:UUID",
    async (req: RestockLogRequest, res: RestockResponse) => {
        const status_obj = req.body.status_obj;
        if (!status_obj) {
            req.log.warn("No status object provided to update restock request");
            res.status(StatusCodes.BAD_REQUEST).json({
                error: "No status object provided.",
            });
            return;
        }
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const restock_uuid = req.params.UUID;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating restock request " +
                    `with uuid ${restock_uuid}.`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        req.log.debug({
            msg: `Updating restock request status by uuid ${restock_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // This request is valid if the requesting user can update any restock
        // request, or if the requesting user can update the status of any
        // restock request.
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_RESTOCK,
                API_SCOPE.UPDATE_RESTOCK_STATUS,
            )
        ) {
            const restock = await updateRestockRequestStatus(
                restock_uuid,
                status_obj,
            );
            if (!restock) {
                req.log.warn(
                    `No restock request found with uuid ${restock_uuid}`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No restock request found with uuid \`${restock_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Updated restock request with uuid ${restock_uuid}`);
            // TODO: Email the requesting user that the restock status has been updated
            res.status(StatusCodes.OK).json(restock);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: "Forbidden user attempted to update restock request status",
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Create a restock request. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_RESTOCK} scope to update any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * updated user role object is returned.
 */
router.post("/", async (req: RestockRequestRequest, res: RestockResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const restock_obj = req.body.request_obj;
    const restock_uuid = restock_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating restock request " +
                `with uuid ${restock_uuid}.`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Creating restock request by uuid ${restock_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create the restock request information
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_RESTOCK)) {
        const restock = await createRestockRequest(restock_obj);
        if (!restock) {
            req.log.warn(
                `An attempt was made to create a restock request with uuid ` +
                    `${restock_uuid}, but a request with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A restock request with uuid \`${restock_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created restock request with uuid ${restock_uuid}`);
        res.status(StatusCodes.CREATED).json(restock);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create restock request",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Delete a single restock request by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_RESTOCK} scope. If the user is not authorized, a
 * status error is returned. If the user is authorized, a status ok is returned.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const restock_uuid = req.params.UUID;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting restock request " +
                    `with uuid ${restock_uuid}.`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        req.log.debug({
            msg: `Deleting restock request by uuid ${restock_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, perform the deletion
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_RESTOCK)) {
            const deleted = await deleteRestockRequest(restock_uuid);
            if (!deleted) {
                req.log.warn(
                    `No restock request found with uuid ${restock_uuid}`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No restock request found with uuid \`${restock_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Deleted restock request with uuid ${restock_uuid}`);
            res.status(StatusCodes.NO_CONTENT).json({});
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: "Forbidden user attempted to delete restock request",
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
