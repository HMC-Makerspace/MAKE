import { API_SCOPE } from "common/global";
import {
    getCertifications,
    getCertification,
    createCertification,
    deleteCertification,
    updateCertification,
    getCertificationsVisibleToUser,
} from "controllers/certification.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TCertification } from "common/certification";

// --- Request and Response Types ---
type CertificationRequest = Request<
    {},
    {},
    { certification_obj: TCertification }
>;
type CertificationResponse = Response<TCertification | ErrorResponse>;
type CertificationsResponse = Response<TCertification[] | ErrorResponse>;

const router = Router();

// --- Certification Routes ---

/**
 * Get all public certifications. This route allows for an optional
 * `requesting_uuid` header to find all certifications that this user is
 * authorized to see. If the user is an admin or has the
 * {@link API_SCOPE.GET_ALL_CERTIFICATIONS} scope, all certifications
 * are returned.
 */
router.get("/public", async (req: Request, res: CertificationsResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    req.log.debug({
        msg: `Getting certifications visible to user ${requesting_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    const certification = await getCertificationsVisibleToUser(requesting_uuid);
    if (!certification) {
        req.log.warn(
            `No certification items found visible to user ${requesting_uuid}`,
        );
    } else {
        req.log.debug(
            `Returned all certifications visible to user ${requesting_uuid}`,
        );
    }
    res.status(StatusCodes.OK).json(certification);
});

/**
 * Get all certifications. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_CERTIFICATIONS} scope.
 */
router.get(
    "/",
    async (req: CertificationRequest, res: CertificationsResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;

        // If no requesting certification uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting all certifications",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: "Getting all certifications.",
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, get all certification information
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_CERTIFICATIONS,
            )
        ) {
            const certifications = await getCertifications();

            // If not certifications are found, log an error, but still return an empty list of certifications
            if (!certifications) {
                req.log.error("No certifications found in the database.");
            } else {
                req.log.error("Returned all certifications.");
            }
            res.status(StatusCodes.OK).json(certifications);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get all certifications",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get a specific certification. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ONE_CERTIFICATION} scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: CertificationResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const certification_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a certification",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting a certification by uuid ${certification_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get certification request is valid if the requesting user can get all
        // certifications or get one certification at a time
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_CERTIFICATIONS,
                API_SCOPE.GET_ONE_CERTIFICATION,
            )
        ) {
            // If the user is authorized, get a certification's information
            const certification = await getCertification(certification_uuid);
            if (!certification) {
                req.log.warn(
                    `Certification not found by uuid ${certification_uuid}`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No certification found with uuid \`${certification_uuid}\`.`,
                });
                return;
            }
            req.log.debug("Returned certification.");
            res.status(StatusCodes.OK).json(certification);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a certification",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Creates a new certification. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_CERTIFICATION} scope.
 */
router.post(
    "/",
    async (req: CertificationRequest, res: CertificationResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const certification_obj = req.body.certification_obj;
        const certification_uuid = certification_obj.uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while creating a certification",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Creating a certification.`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, create a certification
        if (
            await verifyRequest(requesting_uuid, API_SCOPE.CREATE_CERTIFICATION)
        ) {
            const certification = await createCertification(certification_obj);
            if (!certification) {
                req.log.warn(
                    `An attempt was made to create a certification with uuid ` +
                        `${certification_uuid}, but a certification with that uuid already exists`,
                );
                res.status(StatusCodes.CONFLICT).json({
                    error: `A certification with uuid \`${certification_uuid}\` already exists.`,
                });
                return;
            }
            req.log.debug(
                `Created certification with uuid ${certification_uuid}`,
            );
            res.status(StatusCodes.CREATED).json(certification);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to create a certification",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Update a specific certification. This route will not create a new certification if the
 * UUID does not exist. Instead, it will return a 404 error. This is a
 * protected route, and a `requesting_uuid` header is required to call it.
 * The user must have the {@link API_SCOPE.UPDATE_CERTIFICATION} scope.
 */
router.put(
    "/",
    async (req: CertificationRequest, res: CertificationResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const certification_obj = req.body.certification_obj;
        const certification_uuid = certification_obj.uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating a certification",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Updating a certification by uuid ${certification_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a certification's information
        if (
            await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_CERTIFICATION)
        ) {
            const certification = await updateCertification(certification_obj);
            if (!certification) {
                req.log.warn(
                    `Could not update certification with uuid ${certification_uuid} ` +
                        `because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Could not update certification with uuid ` +
                        `\`${certification_uuid}\` because it was not found.`,
                });
                return;
            }
            req.log.debug("Returned updated certification.");
            res.status(StatusCodes.OK).json(certification);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to update a certification",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specific certification. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_CERTIFICATION} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: CertificationResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const certification_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a certification",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a certification by uuid ${certification_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a certification object
        if (
            await verifyRequest(requesting_uuid, API_SCOPE.DELETE_CERTIFICATION)
        ) {
            const certification = await deleteCertification(certification_uuid);
            if (!certification) {
                req.log.warn(
                    `Certification with uuid ${certification_uuid} could not be ` +
                        `deleted because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Certification with uuid ${certification_uuid} could not be ` +
                        `deleted because it was not found.`,
                });
                return;
            }
            req.log.debug(`Deleted certification ${certification_uuid}`);
            res.status(StatusCodes.OK).json(certification);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a certification",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
