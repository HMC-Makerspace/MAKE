import { API_SCOPES } from "common/global";
import {
    deleteUser,
    deleteUserRole,
    getUser,
    getUserByCollegeID,
    getUserByEmail,
    getUserRole,
    getUserRoles,
    getUsers,
    updateUser,
    updateUserRole,
} from "controllers/user.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    PROTECTED_ERROR,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import { TUser, TUserRole } from "common/user";

// --- Request and Response Types ---
type UserRequest = Request<{}, {}, { user_obj: TUser }>;
type UserResponse = Response<TUser | ErrorResponse>;
type UsersResponse = Response<TUser[] | ErrorResponse>;

type UserRoleRequest = Request<{}, {}, { role_obj: TUserRole }>;
type UserRoleResponse = Response<TUserRole | ErrorResponse>;
type UserRolesResponse = Response<TUserRole[] | ErrorResponse>;

const router = Router();

// --- User Routes ---

/**
 * Get all users. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPES.GET_ALL_USERS} scope.
 */
router.get("/", async (req: UserRequest, res: UsersResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    req.log.debug({
        msg: "Getting all users",
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all users");
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
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
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Get a specific user by UUID
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: UserResponse) => {
        const user_uuid = req.params.UUID;
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
    },
);

/**
 * Get a specific user by email
 */
router.get(
    "/by/email/:email",
    async (req: Request<{ email: string }>, res: UserResponse) => {
        const user_email = req.params.email;
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
    },
);

/**
 * Get a specific user by college id
 */
router.get(
    "/by/id/:id",
    async (req: Request<{ id: string }>, res: UserResponse) => {
        const user_id = req.params.id;
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
    },
);

/**
 * Update a specific user by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPES.UPDATE_USER} scope to
 * update any user, or the {@link API_SCOPES.UPDATE_USER_SELF} scope to update
 * their own information. If the user is not authorized, a status error is
 * returned. If the user is authorized, the updated user object is returned.
 */
router.post("/update", async (req: UserRequest, res: UserResponse) => {
    // Get the user object from the request body
    const user_obj = req.body.user_obj;
    if (!user_obj) {
        req.log.warn("No user object provided to update");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No user object provided to update.",
        });
        return;
    }

    // Check for authorization
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
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
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
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

    // If the user is authorized, perform the update
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
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
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
router.delete(
    "/:UUID",
    async (
        req: Request<{ UUID: string }>,
        res: Response<null | ErrorResponse>,
    ) => {
        const user_uuid = req.params.UUID;

        // Check for authorization
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        req.log.debug({
            msg: `Deleting user with uuid ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn("No requesting_uuid was provided while deleting user");
            res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
            return;
        }

        // A delete request is valid if the requesting user can delete any user,
        // or if the requesting user is allowed to delete their own information
        const isValid =
            (await verifyRequest(requesting_uuid, API_SCOPES.DELETE_USER)) ||
            (requesting_uuid === user_uuid &&
                (await verifyRequest(
                    requesting_uuid,
                    API_SCOPES.DELETE_USER_SELF,
                )));

        // If the user is authorized, perform the deletion
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
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        }
    },
);

// --- User Role Routes ---

/**
 * Get all user roles. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPES.GET_ALL_USER_ROLES} scope.
 */
router.get("/role/", async (req: Request, res: UserRolesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    req.log.debug({
        msg: "Getting all user roles",
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all user roles",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }
    // If the user is authorized, get all user role information
    if (await verifyRequest(requesting_uuid, API_SCOPES.GET_ALL_ROLES)) {
        const user_roles = await getUserRoles();
        if (!user_roles) {
            req.log.error("No user roles found in the database");
            res.status(StatusCodes.NOT_FOUND).json({
                error: "No user roles found in the database.",
            });
            return;
        }
        req.log.debug("Returned all user roles");
        res.status(StatusCodes.OK).json(user_roles);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: "Unauthorized user attempted to get all user roles",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Get a single user role by UUID.
 */
router.get(
    "/role/:UUID",
    async (req: Request<{ UUID: string }>, res: UserRoleResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const role_uuid = req.params.UUID;
        req.log.debug({
            msg: `Getting user role by uuid ${role_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        const user_role = await getUserRole(role_uuid);
        if (!user_role) {
            req.log.warn(`No user role found with uuid ${role_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No user role found with uuid \`${role_uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Found user role with uuid ${role_uuid}`);
        res.status(StatusCodes.OK).json(user_role);
    },
);

/**
 * Update a single user role by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPES.UPDATE_ROLE} scope to update any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * updated user role object is returned.
 */
router.post("/role/", async (req: UserRoleRequest, res: UserRoleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const role_obj = req.body.role_obj;
    const role_uuid = role_obj.uuid;
    req.log.debug({
        msg: `Updating user role by uuid ${role_uuid}`,
        requesting_uuid: requesting_uuid,
    });
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating user role " +
                `with uuid ${role_uuid}.`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
        return;
    }
    // If the user is authorized, get all user role information
    if (await verifyRequest(requesting_uuid, API_SCOPES.UPDATE_ROLE)) {
        const user_role = await updateUserRole(role_obj);
        if (!user_role) {
            req.log.error(`No user role found with uuid ${role_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No user role found with uuid \`${role_uuid}\`.`,
            });
            return;
        }
        req.log.debug(`Updated user role with uuid ${role_uuid}`);
        res.status(StatusCodes.OK).json(user_role);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: "Unauthorized user attempted to update user role",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
    }
});

/**
 * Delete a single user role by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPES.DELETE_ROLE} scope to delete any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * user role object is deleted and a status ok is returned.
 */
router.delete(
    "/role/:UUID",
    async (
        req: Request<{ UUID: string }>,
        res: Response<null | ErrorResponse>,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const role_uuid = req.params.UUID;
        req.log.debug({
            msg: `Deleting user role by uuid ${role_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while deleting user role " +
                    `with uuid ${role_uuid}.`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(PROTECTED_ERROR);
            return;
        }
        // If the user is authorized, get all user role information
        if (await verifyRequest(requesting_uuid, API_SCOPES.DELETE_ROLE)) {
            const user_role = await deleteUserRole(role_uuid);
            if (!user_role) {
                req.log.error(`No user role found with uuid ${role_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No user role found with uuid \`${role_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Deleted user role with uuid ${role_uuid}`);
            // Return a status ok, deleted user role object is not returned
            res.status(StatusCodes.OK);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: "Unauthorized user attempted to delete user role",
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        }
    },
);

export default router;
