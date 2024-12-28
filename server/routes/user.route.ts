import { API_SCOPES } from "common/global";
import {
    getUser,
    getUserByCollegeID,
    getUserByEmail,
    getUsers,
} from "controllers/user.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { VerifyRequestHeader } from "common/verify";

const router = Router();

/**
 * Get all users. This is a protected route, and a `requesting_uuid` header
 * is required to call it.
 */
router.get("/", async (req: Request, res: Response) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    req.log.debug({
        msg: "Getting all users",
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all users");
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting user UUID was " +
                "provided. Add `requesting_uuid` as a header with a user's " +
                "to make this request.",
        });
        return;
    }
    // If the user is authorized, get all user information
    if (await verifyRequest(requesting_uuid, API_SCOPES.ALL_USERS)) {
        req.log.debug("Returned all users");
        const users = await getUsers();
        res.status(StatusCodes.OK).json(users);
    } else {
        req.log.warn({
            msg: "Unauthorized user attempted to get all users",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting user UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

/**
 * Get a specific user by UUID
 */
router.get("/:UUID", async (req: Request, res: Response) => {
    const user_uuid: string = req.params.UUID;
    req.log.debug(`Getting user by uuid ${user_uuid}`);

    const user = await getUser(user_uuid);

    if (!user) {
        req.log.warn(`User not found by uuid ${user_uuid}`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: `No user found with uuid \`${user_uuid}\`.`,
        });
        return;
    }

    req.log.debug({
        msg: `Found user by uuid ${user_uuid}`,
        user: user,
    });

    res.status(StatusCodes.OK).json(user);
});

/**
 * Get a specific user by email
 */
router.get("/by/email/:email", async (req: Request, res: Response) => {
    const user_email: string = req.params.email;
    req.log.debug(`Getting user by email ${user_email}`);

    const user = await getUserByEmail(user_email);

    if (!user) {
        req.log.warn(`User not found by email ${user_email}`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: `No user found with email \`${user_email}\`.`,
        });
        return;
    }

    req.log.debug({
        msg: `Found user by email ${user_email}`,
        user: user,
    });

    res.status(StatusCodes.OK).json(user);
});

/**
 * Get a specific user by college id
 */
router.get("/by/id/:id", async (req: Request, res: Response) => {
    const user_id: string = req.params.id;
    req.log.debug(`Getting user by college id ${user_id}`);

    const user = await getUserByCollegeID(user_id);

    if (!user) {
        req.log.warn(`User not found by college id ${user_id}`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: `No user found with college id \`${user_id}\`.`,
        });
        return;
    }

    req.log.debug({
        msg: `Found user by college id ${user_id}`,
        user: user,
    });

    res.status(StatusCodes.OK).json(user);
});

export default router;
