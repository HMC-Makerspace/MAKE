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
import { VerifyRequestHeader } from "common/verify";

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
    // If no requesting checkout_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all checkouts");
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
 * Get a specific checkout by UUID
 */
router.get("/:UUID", async (req: Request, res: Response) => {
    const checkout_uuid: string = req.params.UUID;
    req.log.debug(`Getting checkout by uuid ${checkout_uuid}`);

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
});

/**
 * Update a specific checkout by UUID
 */
router.post("/:UUID", async (req: Request, res: Response) => {
    const checkout_uuid = req.body();
    req.log.debug(`Updating checkout by uuid ${checkout_uuid}`);

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
});

export default router;
