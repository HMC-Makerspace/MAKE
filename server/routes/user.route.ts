import { API_SCOPE } from "common/global";
import {
    createUser,
    createUserRole,
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
import {
    isUserRequestValid,
    verifyRequest,
} from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
    ErrorResponse,
    UNAUTHORIZED_ERROR,
    FORBIDDEN_ERROR,
    VerifyRequestHeader,
    SuccessfulResponse,
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
 * {@link API_SCOPE.GET_ALL_USERS} scope.
 */
router.get("/", async (req: UserRequest, res: UsersResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all users");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting all users",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all user information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_USERS)) {
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
            msg: "Forbidden user attempted to get all users",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
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
 * Update a specific user by UUID. Does not allow creating new users.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.UPDATE_USER} scope to
 * update any user, or the {@link API_SCOPE.UPDATE_USER_SELF} scope to update
 * their own information. If the user is not authorized, a status error is
 * returned. If the user is authorized, the updated user object is returned.
 */
router.put("/", async (req: UserRequest, res: UserResponse) => {
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
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating user by UUID",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Updating user with uuid ${uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // An update request is valid if the requesting user can update any user,
    // or if the requesting user is allowed to update their own information.
    if (
        await isUserRequestValid(
            requesting_uuid,
            uuid,
            API_SCOPE.UPDATE_USER,
            API_SCOPE.UPDATE_USER_SELF,
        )
    ) {
        // If the user is authorized, perform the update.
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
            msg: `Forbidden user attempted to update user with uuid ${uuid}`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Create a new user.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.CREATE_USER} scope If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, the new user object is returned.
 */
router.post("/", async (req: UserRequest, res: UserResponse) => {
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
    const new_user_uuid = user_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating new user.",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Creating user with uuid ${new_user_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, perform the creation
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_USER)) {
        const user = await createUser(user_obj);
        if (!user) {
            req.log.warn(
                `An attempt was made to create a user with uuid ` +
                    `${new_user_uuid}, but a user with that uuid already exists`,
            );
            res.status(StatusCodes.NOT_ACCEPTABLE).json({
                error: `A user with uuid \`${new_user_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created user with uuid ${new_user_uuid}`);
        // Return the updated user object
        res.status(StatusCodes.OK).json(user);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: `Forbidden user attempted to create user with uuid ${new_user_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Delete a specific user by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.DELETE_USER} scope to
 * delete any user, or the {@link API_SCOPE.DELETE_USER_SELF} scope to delete
 * their own information. If the user is not authorized, a status error is
 * returned. If the user is authorized, a status ok is returned.
 */
router.delete(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
        // Check for authorization
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn("No requesting_uuid was provided while deleting user");
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const user_uuid = req.params.UUID;
        req.log.debug({
            msg: `Deleting user with uuid ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A delete request is valid if the requesting user can delete any user,
        // or if the requesting user is allowed to delete their own information
        if (
            await isUserRequestValid(
                requesting_uuid,
                user_uuid,
                API_SCOPE.DELETE_USER,
                API_SCOPE.DELETE_USER_SELF,
            )
        ) {
            // If the user is authorized, perform the deletion
            const deleted_user = await deleteUser(user_uuid);
            if (!deleted_user) {
                req.log.warn(`No user found to delete with uuid ${user_uuid}`);
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
                msg: `Forbidden user attempted to delete user with uuid ${user_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

// --- User Role Routes ---

/**
 * Get all user roles. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_USER_ROLES} scope.
 */
router.get("/role/", async (req: Request, res: UserRolesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting all user roles",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting all user roles",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all user role information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_ROLES)) {
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
            msg: "Forbidden user attempted to get all user roles",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
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
 * Update a single user role by UUID. This will not create the user if the UUID
 * does not already exist. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_ROLE} scope to update any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * updated user role object is returned.
 */
router.put("/role/", async (req: UserRoleRequest, res: UserRoleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const role_obj = req.body.role_obj;
    const role_uuid = role_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while updating user role " +
                `with uuid ${role_uuid}.`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Updating user role by uuid ${role_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all user role information
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_ROLE)) {
        const user_role = await updateUserRole(role_obj);
        if (!user_role) {
            req.log.warn(`No user role found with uuid ${role_uuid}`);
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
            msg: "Forbidden user attempted to update user role",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Create a single user role by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.UPDATE_ROLE} scope to update any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * updated user role object is returned.
 */
router.post("/role/", async (req: UserRoleRequest, res: UserRoleResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    const role_obj = req.body.role_obj;
    const role_uuid = role_obj.uuid;
    // If no requesting user_uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while creating user role " +
                `with uuid ${role_uuid}.`,
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: `Creating new user role with uuid ${role_uuid}`,
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all user role information
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_ROLE)) {
        const user_role = await createUserRole(role_obj);
        if (!user_role) {
            req.log.warn(
                `An attempt was made to create a user role with uuid ` +
                    `${role_uuid}, but a role with that uuid already exists`,
            );
            res.status(StatusCodes.NOT_ACCEPTABLE).json({
                error: `A user role with uuid \`${role_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created user role with uuid ${role_uuid}`);
        res.status(StatusCodes.OK).json(user_role);
    } else {
        // If the user is not authorized, provide a status error
        req.log.warn({
            msg: "Forbidden user attempted to create user role",
            requesting_uuid: requesting_uuid,
        });
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Delete a single user role by UUID. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_ROLE} scope to delete any user role. If the user is
 * not authorized, a status error is returned. If the user is authorized, the
 * user role object is deleted and a status ok is returned.
 */
router.delete(
    "/role/:UUID",
    async (req: Request<{ UUID: string }>, res: SuccessfulResponse) => {
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
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        // If the user is authorized, get all user role information
        if (await verifyRequest(requesting_uuid, API_SCOPE.DELETE_ROLE)) {
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
                msg: "Forbidden user attempted to delete user role",
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
