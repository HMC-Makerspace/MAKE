import { API_SCOPE } from "common/global";
import { TArea, TAreaStatus, TPublicAreaData } from "common/area";
import {
    ErrorResponse,
    FORBIDDEN_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import {
    createArea,
    deleteArea,
    getArea,
    getAreas,
    getAreasVisibleToUser,
    updateArea,
    updateAreaStatus,
} from "controllers/area.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

// --- Request and Response Types ---
type AreaRequest = Request<{}, {}, { area_obj: TArea }>;
type AreaResponse = Response<TArea | ErrorResponse>;
type AreasResponse = Response<TArea[] | ErrorResponse>;

type AreaStatusRequest = Request<
    { area_uuid: string },
    {},
    { status: TAreaStatus }
>;

const router = Router();

// --- Area Routes ---

/**
 * Get all public areas. This route allows for an optional
 * `requesting_uuid` header to find all areas that this user is
 * authorized to see. If the user is an admin or has the
 * {@link API_SCOPE.GET_ALL_AREAS} scope, all areas
 * are returned.
 */
router.get(
    "/public",
    async (req: Request, res: Response<TPublicAreaData[]>) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;

        req.log.debug({
            msg: `Getting areas visible to user ${requesting_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        const areas = await getAreasVisibleToUser(requesting_uuid);
        if (!areas) {
            req.log.warn(`No areas visible to user ${requesting_uuid}.`);
        } else {
            req.log.debug(`Returned areas visible to user ${requesting_uuid}.`);
        }
        res.status(StatusCodes.OK).json(areas);
    },
);

/**
 * Get a specific area by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_AREAS} scope or the {@link API_SCOPE.GET_ONE_AREA}
 * scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: AreaResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting area by uuid",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const area_uuid = req.params.UUID;

        req.log.debug({
            msg: `Getting area by uuid ${area_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // The user must be authorized to get all areas or get a specific area
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_AREAS,
                API_SCOPE.GET_ONE_AREA,
            )
        ) {
            // If the user is authorized, get the area information
            const area = await getArea(area_uuid);
            if (!area) {
                req.log.warn(`Area not found by uuid ${area}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No area found with uuid \`${area}\`.`,
                });
                return;
            }
            req.log.debug("Returned area.");
            res.status(StatusCodes.OK).json(area);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: `Forbidden user attempted to get a area by uuid ${area_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get all areas. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_AREAS} scope.
 */
router.get("/", async (req: AreaRequest, res: AreasResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all areas");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all areas",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all area information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_AREAS)) {
        const areas = await getAreas();
        // If no areas are found, log an error, but still return
        // the empty array
        if (!areas) {
            req.log.error("No areas found in the database.");
        } else {
            req.log.debug("Returned all areas");
        }
        res.status(StatusCodes.OK).json(areas);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all areas",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Creates a new area. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_AREA} scope.
 */
router.post("/", async (req: AreaRequest, res: AreaResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const area_obj = req.body.area_obj;
    const area_uuid = area_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while creating a area");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Creating a area.`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create a area
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_AREA)) {
        const area = await createArea(area_obj);
        if (!area) {
            req.log.warn(
                `An attempt was made to create a area with uuid ` +
                    `${area_uuid}, but a area with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A area with uuid \`${area_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created area with uuid ${area_uuid}`);
        res.status(StatusCodes.CREATED).json(area);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create a area",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a specific area. This route will not create a new area if the
 * UUID does not exist. Instead, it will return a 404 error.
 * This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_AREA} scope.
 */
router.put("/", async (req: AreaRequest, res: AreaResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const area_obj = req.body.area_obj;
    const area_uuid = area_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while updating a area");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Updating a area by uuid ${area_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, update a area's information
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_AREA)) {
        const area = await updateArea(area_obj);
        if (!area) {
            req.log.warn(`Area ${area_uuid} failed to update`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Area \`${area_uuid}\` failed to update.`,
            });
            return;
        }
        req.log.debug("Returned updated area.");
        res.status(StatusCodes.OK).json(area);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to update a area",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Deletes a area. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_AREA} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: AreaResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const area_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a area",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a area by uuid ${area_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a area object
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_AREA)) {
            const area = await deleteArea(area_uuid);
            if (!area) {
                req.log.warn(`Failed to delete area ${area_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Failed to delete area \`${area_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Deleted area ${area_uuid}`);
            res.status(StatusCodes.OK).json(area);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a area",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update the list of status for a area type. This is a protected route
 * and a `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_AREA_STATUS} scope, or be able to update any
 * area.
 */
router.patch(
    "/:area_uuid/status/",
    async (req: AreaStatusRequest, res: AreaResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const area_uuid = req.params.area_uuid;
        const status = req.body.status;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating area status",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating status of area with uuid ${area_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update the area's status
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_AREA,
                API_SCOPE.UPDATE_AREA_STATUS,
            )
        ) {
            const updated_area = await updateAreaStatus(area_uuid, status);
            if (!updated_area) {
                req.log.warn(
                    `Area with uuid ${area_uuid} not found, failed to update status`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Area with uuid \`${area_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Updated area status successfully.");
            res.status(StatusCodes.OK).json(updated_area);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to update area status",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
