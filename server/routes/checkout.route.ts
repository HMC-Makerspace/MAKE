import { API_SCOPE } from "common/global";
import {
    getCheckouts,
    getCheckout,
    createCheckout,
    deleteCheckout,
    updateCheckout,
    checkInCheckout,
    extendCheckout,
    getCheckoutsByUser,
} from "controllers/checkout.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TCheckout } from "common/checkout";

// --- Request and Response Types ---
type CheckoutRequest = Request<{}, {}, { checkout_obj: TCheckout }>;
type CheckoutResponse = Response<TCheckout | ErrorResponse>;
type CheckoutsResponse = Response<TCheckout[] | ErrorResponse>;

const router = Router();

// --- Checkout Routes ---

/**
 * Get all checkouts made by a specific user. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.GET_CHECKOUTS_BY_USER} scope. If the requesting user is
 * the same as the user being queried, the {@link API_SCOPE.GET_CHECKOUTS_BY_SELF}
 * scope is allowed instead. This route will return a list of checkouts made by
 * the user, or a 403 error if the user is not authorized to view the checkouts.
 */
router.get(
    "/by/user/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: CheckoutsResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a user's checkouts",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting checkouts for user ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get checkouts by user request is valid if the requesting user can
        // get all checkouts, get checkouts for any user, or get their own checkouts
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_CHECKOUTS,
                API_SCOPE.GET_CHECKOUTS_BY_USER,
                requesting_uuid == user_uuid && API_SCOPE.GET_CHECKOUTS_BY_SELF,
            )
        ) {
            // If authorized, get the user's checkout information
            const checkouts = await getCheckoutsByUser(user_uuid);
            req.log.debug("Returned user's checkouts.");
            res.status(StatusCodes.OK).json(checkouts);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a user's checkouts",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get all checkouts. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_CHECKOUTS} scope.
 */
router.get("/", async (req: Request, res: CheckoutsResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all checkouts",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all checkouts",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all checkout information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_CHECKOUTS)) {
        const checkouts = await getCheckouts();
        // If no checkouts are found, log an error, but still return an empty
        // list of checkouts
        if (!checkouts) {
            req.log.error("No checkouts found in the database.");
        } else {
            req.log.debug("Returned all checkouts");
        }
        res.status(StatusCodes.OK).json(checkouts);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all checkouts",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get a specific checkout. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ONE_CHECKOUT} scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: CheckoutResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const checkout_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a checkout",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting a checkout by uuid ${checkout_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get checkout request is valid if the requesting user can get all
        // checkouts or get one checkout at a time
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_CHECKOUTS,
                API_SCOPE.GET_ONE_CHECKOUT,
            )
        ) {
            // If the user is authorized, get a checkout's information
            const checkout = await getCheckout(checkout_uuid);
            if (!checkout) {
                req.log.warn(`Checkout not found by uuid ${checkout_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No checkout found with uuid \`${checkout_uuid}\`.`,
                });
                return;
            }
            req.log.debug("Returned checkout.");
            res.status(StatusCodes.OK).json(checkout);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a checkout",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Creates a new checkout. This is a protected route, and a 'requesting_uuid'
 * header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_CHECKOUT} scope.
 */
router.post("/", async (req: CheckoutRequest, res: CheckoutResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const checkout_obj = req.body.checkout_obj;
    const checkout_uuid = checkout_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating a checkout",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Creating a checkout.`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, create a checkout
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_CHECKOUT)) {
        const checkout = await createCheckout(checkout_obj);
        if (!checkout) {
            req.log.warn(
                `An attempt was made to create a checkout with uuid ` +
                    `${checkout_uuid}, but a checkout with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A checkout with uuid \`${checkout_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created checkout with uuid ${checkout_uuid}`);
        res.status(StatusCodes.CREATED).json(checkout);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to create a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Update a specific checkout. This route will not create a new checkout if the
 * UUID does not exist. Instead, it will return a 404 error. This is a
 * protected route, and a `requesting_uuid` header is required to call it.
 * The user must have the {@link API_SCOPE.UPDATE_CHECKOUT} scope.
 */
router.put("/", async (req: CheckoutRequest, res: CheckoutResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const checkout_obj = req.body.checkout_obj;
    const checkout_uuid = checkout_obj.uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating a checkout",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: `Updating a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, update a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_CHECKOUT)) {
        const checkout = await updateCheckout(checkout_obj);
        if (!checkout) {
            req.log.warn(
                `Could not update checkout with uuid ${checkout_uuid} ` +
                    `because it was not found.`,
            );
            res.status(StatusCodes.NOT_FOUND).json({
                error:
                    `Could not update checkout with uuid ` +
                    `\`${checkout_uuid}\` because it was not found.`,
            });
            return;
        }
        req.log.debug("Returned updated checkout.");
        res.status(StatusCodes.OK).json(checkout);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to update a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Check in a specific checkout. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_CHECKOUT} scope. This route will return the updated
 * checkout object, or a 404 error if the checkout UUID is not found.
 * @example
 * ```ts
 * fetch("/checkout/check_in/checkout1234", {
 *   method: "PATCH",
 *   headers: {
 *     "Content-Type": "application/json",
 *     "requesting_uuid": "user1234",
 *   },
 * });
 * ```
 */
router.patch(
    "/:UUID/check_in",
    async (req: Request<{ UUID: string }>, res: CheckoutResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const checkout_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while checking in a checkout",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Checking in a checkout by uuid ${checkout_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a checkout's information
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_CHECKOUT)) {
            const checkout = await checkInCheckout(checkout_uuid);
            if (!checkout) {
                req.log.warn(
                    `Checkout with uuid ${checkout_uuid} not found, failed to check in`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Checkout with uuid \`${checkout_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Checked in checkout successfully.");
            res.status(StatusCodes.OK).json(checkout);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to check in a checkout",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Extend a specific checkout to a new due date. This is a protected route, and
 * a `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_CHECKOUT} scope.
 * The body of the request should contain a `new_timestamp_due` field with the
 * new due date in seconds since the Unix epoch.
 * @example
 * ```ts
 * fetch("/checkout/extend/checkout1234", {
 *   method: "PATCH",
 *   headers: {
 *     "Content-Type": "application/json",
 *     "requesting_uuid": "user1234",
 *   },
 *   body: JSON.stringify({
 *     new_timestamp_due: 1630000000,
 *   }),
 * });
 * ```
 * This route will return the updated checkout object, or a 404 error if the
 * checkout UUID is not found.
 */
router.patch(
    "/:UUID/extend",
    async (
        req: Request<{ UUID: string }, {}, { new_timestamp_due: number }>,
        res: CheckoutResponse,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const checkout_uuid = req.params.UUID;
        const new_timestamp_due = req.body.new_timestamp_due;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while extending a checkout",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg:
                `Extending a checkout by uuid ${checkout_uuid} until ` +
                new Date(new_timestamp_due).toISOString(),
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, update a checkout's information
        if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_CHECKOUT)) {
            const checkout = await extendCheckout(
                checkout_uuid,
                new_timestamp_due,
            );
            if (!checkout) {
                req.log.warn(
                    `Checkout with uuid ${checkout_uuid} not found, failed to extend`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Checkout with uuid \`${checkout_uuid}\` not found.`,
                });
                return;
            }
            req.log.debug("Extended checkout successfully.");
            res.status(StatusCodes.OK).json(checkout);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to extend a checkout",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specific checkout. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_CHECKOUT} scope.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: CheckoutResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const checkout_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting a checkout",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Deleting a checkout by uuid ${checkout_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // If the user is authorized, delete a checkout object
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_CHECKOUT)) {
            const checkout = await deleteCheckout(checkout_uuid);
            if (!checkout) {
                req.log.warn(
                    `Checkout with uuid ${checkout_uuid} could not be ` +
                        `deleted because it was not found.`,
                );
                res.status(StatusCodes.NOT_FOUND).json({
                    error:
                        `Checkout with uuid ${checkout_uuid} could not be ` +
                        `deleted because it was not found.`,
                });
                return;
            }
            req.log.debug(`Deleted checkout ${checkout_uuid}`);
            res.status(StatusCodes.OK).json(checkout);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a checkout",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
