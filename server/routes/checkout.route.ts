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
    PROTECTED_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TCheckout } from "common/checkout";

type CheckoutRequest = Request<{}, {}, { checkout_obj: TCheckout }>;

const router = Router();

/**
 * Get all checkouts. This is a protected route, and a `requesting_uuid` header
 * is required to call it.
 */
router.get("/", async (req: Request, res: Response) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    req.log.debug({
        msg: "Getting all checkouts",
        requesting_uuid: requesting_uuid,
    });
    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all checkouts",
        );
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting checkout UUID " +
                "was provided. Add `requesting_uuid` as a header with a " +
                "checkout's to make this request.",
        });
        return;
    }
    // If the user is authorized, get all checkout information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_CHECKOUTS)) {
        req.log.debug("Returned all checkouts");
        const checkouts = await getCheckouts();
        res.status(StatusCodes.OK).json(checkouts);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to get all checkouts",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting checkout UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

/**
 * Get a specific checkout by UUID,
 * A protected route
 */
router.get("/:UUID", async (req: Request<{ UUID: string }>, res: Response) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const checkout_uuid = req.params.UUID;
    req.log.debug({
        msg: `Getting a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all checkouts",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }
    // If the user is authorized, get a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_CHECKOUTS)) {
        req.log.debug("Returned checkout ${checkout_uuid}");
        const checkout = await getCheckout(checkout_uuid);
        if (!checkout) {
            req.log.warn(`Checkout not found by uuid ${checkout_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No checkout found with uuid \`${checkout_uuid}\`.`,
            });
            return;
        }
        req.log.debug({
            msg: `Found checkout by uuid ${checkout_uuid}`,
            checkout: checkout,
        });
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
        msg: `Deleting a checkout by uuid ${checkout_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all checkouts",
        );
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting checkout UUID " +
                "was provided. Add `requesting_uuid` as a header with a " +
                "checkout to make this request.",
        });
        return;
    }

    // If the user is authorized, update a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_CHECKOUTS)) {
        req.log.debug("Returned checkout ${checkout_uuid}");
        const checkout = await updateCheckout(checkout_obj);
        if (!checkout) {
            req.log.warn(`Checkout not found by uuid ${checkout_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No checkout found with uuid \`${checkout_uuid}\`.`,
            });
            return;
        }
        req.log.debug({
            msg: `Found checkout by uuid ${checkout_uuid}`,
            checkout: checkout,
        });
        res.status(StatusCodes.OK).json(checkout);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to update a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting checkout UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

/**
 * Deletes a checkout by uuid
 */
router.delete("/:UUID", async (req: Request, res: Response) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const checkout_uuid = req.params.UUID;
    req.log.debug({
        msg: "Updating a checkout by uuid ${checkout_uuid}",
        requesting_uuid: requesting_uuid,
    });

    // If no requesting checkout uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all checkouts",
        );
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting checkout UUID " +
                "was provided. Add `requesting_uuid` as a header with a " +
                "checkout to make this request.",
        });
        return;
    }

    // If the user is authorized, update a checkout's information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_CHECKOUTS)) {
        req.log.debug("Returned checkout ${checkout_uuid}");
        const checkout = await getCheckout(checkout_uuid);
        if (!checkout) {
            req.log.warn(`Checkout not found by uuid ${checkout_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No checkout found with uuid \`${checkout_uuid}\`.`,
            });
            return;
        }
        req.log.debug({
            msg: `Found checkout by uuid ${checkout_uuid}`,
            checkout: checkout,
        });
        deleteCheckout(checkout);
        res.status(StatusCodes.OK).json(checkout);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to delete a checkout",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting checkout UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

export default router;
