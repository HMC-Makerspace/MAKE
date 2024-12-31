import { API_SCOPES } from "common/global";
import {
    deleteUser,
    getUser,
    getUserByCollegeID,
    getUserByEmail,
    getUsers,
    updateUser,
} from "controllers/user.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { VerifyRequestHeader } from "common/verify";
import { TUser } from "common/user";

const router = Router();

/**
 * Get all users. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.GET_ALL_USERS} scope.
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
                "uuid to make this request.",
        });
        return;
    }
    // If the user is authorized, get all user information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_USERS)) {
        const users = await getUsers();
        if (!users) {
            req.log.error("No users found in the database");
            res.status(StatusCodes.NOT_FOUND).json({
                error: "No users found in the database.",
            });
            return;
        }
        req.log.debug("Returned all users");
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

/**
 * Update a specific user by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPES.UPDATE_USER} scope to
 * update any user, or the {@link API_SCOPES.UPDATE_USER_SELF} scope to update
 * their own information. If the user is not authorized, a status error is
 * returned. If the user is authorized, the updated user object is returned.
 */
router.post("/update", async (req: Request, res: Response) => {
    // Get the user object from the request body
    const user_obj = req.body.user_obj as TUser | undefined;
    if (!user_obj) {
        req.log.warn("No user object provided to update");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No user object provided to update.",
        });
        return;
    }

    // Check for authorization
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    const uuid = user_obj.uuid;
    req.log.debug({
        msg: `Updating user with uuid ${uuid}`,
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating user by UUID",
        );
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting user UUID was " +
                "provided. Add `requesting_uuid` as a header with a user's " +
                "uuid to make this request.",
        });
        return;
    }

    // An update request is valid if the requesting user can update any user,
    // or if the requesting user is allowed to update their own information
    const isValid =
        (await verifyRequest(requesting_uuid, API_SCOPES.UPDATE_USER)) ||
        (requesting_uuid === uuid &&
            (await verifyRequest(
                requesting_uuid,
                API_SCOPES.UPDATE_USER_SELF,
            )));

    // If the user is authorized, get all user information
    if (isValid) {
        const user = await updateUser(user_obj);
        if (!user) {
            req.log.warn(`User not found to update with uuid ${uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No user found to update with uuid \`${uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Updated user with uuid ${uuid}`);
        // Return the updated user object
        res.status(StatusCodes.OK).json(user);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Unauthorized attempted to update user with uuid ${uuid}`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting user UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

/**
 * Delete a specific user by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPES.DELETE_USER} scope to
 * delete any user, or the {@link API_SCOPES.DELETE_USER_SELF} scope to delete
 * their own information. If the user is not authorized, a status error is
 * returned. If the user is authorized, a status ok is returned.
 */
router.delete("/:UUID", async (req: Request, res: Response) => {
    const user_uuid: string = req.params.UUID;

    // Check for authorization
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid: string = headers.requesting_uuid;
    req.log.debug({
        msg: `Deleting user with uuid ${user_uuid}`,
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while deleting user");
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected route, and no requesting user UUID was " +
                "provided. Add `requesting_uuid` as a header with a user's " +
                "uuid to make this request.",
        });
        return;
    }

    // An update request is valid if the requesting user can delete any user,
    // or if the requesting user is allowed to delete their own information
    const isValid =
        (await verifyRequest(requesting_uuid, API_SCOPES.DELETE_USER)) ||
        (requesting_uuid === user_uuid &&
            (await verifyRequest(
                requesting_uuid,
                API_SCOPES.DELETE_USER_SELF,
            )));

    // If the user is authorized, get all user information
    if (isValid) {
        // Delete the user
        const deleted_user = await deleteUser(user_uuid);
        if (!deleted_user) {
            req.log.warn(`User not found to delete with uuid ${user_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No user found to delete with uuid \`${user_uuid}\`.`,
            });
            return;
        } else {
            req.log.debug(`Deleted user with uuid ${user_uuid}`);
            // Return a status ok, deleted user object is not returned
            res.status(StatusCodes.OK);
        }
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Unauthorized attempted to delete user with uuid ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.UNAUTHORIZED).json({
            error:
                "This is a protected call, and the requesting user UUID " +
                "does not have the proper API scopes required.",
        });
    }
});

export default router;
