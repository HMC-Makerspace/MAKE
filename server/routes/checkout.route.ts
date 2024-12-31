import { API_SCOPES } from "common/global";
import {
    getCheckouts,
    getCheckout,
    createCheckout,
    deleteCheckout,
    updateCheckout,
} from "controllers/checkout.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    PROTECTED_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TCheckout } from "common/checkout";

// --- Request and Response Types ---
type CheckoutRequest = Request<{}, {}, { checkout_obj: TCheckout }>;
type CheckoutResponse = Response<TCheckout | TCheckout[] | ErrorResponse>;

const router = Router();

// --- Checkout Routes ---

/**
 * Get all checkouts. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.GET_ALL_CHECKOUTS} scope.
 */
router.get("/", async (req: CheckoutRequest, res: CheckoutResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    req.log.debug({
        msg: "Getting all checkouts",
        requesting_uuid: requesting_uuid,
    });
    
    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all checkouts");
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }
    
    // If the user is authorized, get all checkout information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_CHECKOUTS)) {
        const checkouts = await getCheckouts();
        if (!checkouts) {
            req.log.debug("No checkouts found in the database.");
            res.status(StatusCodes.NOT_FOUND).json({
                error: "No checkouts found in the database.",
            });
            return;
        }
        req.log.debug("Returned all checkouts");
        res.status(StatusCodes.OK).json(checkouts);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to get all checkouts",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Get a specific checkout. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPES.GET_CHECKOUT} scope.
 */
router.get("/:UUID", async (req: Request<{ UUID: string }>, res: CheckoutResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const checkout_uuid = req.body;
    req.log.debug({
        msg: `Getting a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all users");
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }

    // If the user is authorized, get a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_CHECKOUT)) {
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
            msg: "Unauthorized user attempted to get a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Update a specific checkout by
 * A protected route
 */
router.post("/", async (req: CheckoutRequest, res: Response) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const checkout_obj = req.body.checkout_obj;
    const checkout_uuid = checkout_obj.uuid;
    req.log.debug({
        msg: `Updating a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while updating a checkout");
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }

    // If the user is authorized, update a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.UPDATE_CHECKOUT)) {
        req.log.debug("Returned checkout ${checkout_uuid}");
        const checkout = await updateCheckout(checkout_obj);
        if (!checkout) {
            req.log.warn(`Checkout ${checkout_uuid} failed to update`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Checkout \`${checkout_uuid}\` failed to update.`,
            });
            return;
        }
        req.log.debug("Returned updated checkout.");
        res.status(StatusCodes.OK).json(checkout);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to update a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Delete a specific checkout. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPES.DELETE_CHECKOUT} scope.
 */
router.delete("/:UUID", async (req: Request<{ UUID: string }>, res: CheckoutResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const checkout_obj = req.body.checkout_obj;
    const checkout_uuid = checkout_obj.uuid;
    req.log.debug({
        msg: `Deleting a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while deleting a checkout");
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }

    // If the user is authorized, delete a checkout object
    if (await verifyRequest(requesting_uuid, API_SCOPES.DELETE_CHECKOUT)) {
        req.log.debug("Deleted checkout ${checkout_uuid}");
        const checkout = await deleteCheckout(checkout_obj);
        if (!checkout) {
            req.log.warn(`Failed to delete checkout ${checkout_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `Failed to delete checkout \`${checkout_uuid}\`.`,
            });
            return;
        }
        req.log.debug("Returned deleted checkout.");
        res.status(StatusCodes.OK).json(checkout);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to delete a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

export default router;
