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
    getUserScopes,
    grantRoleToUser,
    initializeAdmin,
    initializeAdminRole,
    updateUser,
    updateUserPublicInfo,
    updateUserRole,
} from "controllers/user.controller";
import { verifyRequest } from "controllers/verify.controller";
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
type UsersRequest = Request<{}, {}, {}>;
type UsersResponse = Response<TUser[] | ErrorResponse>;

type UserScopesResponse = Response<API_SCOPE[] | ErrorResponse>;

type UserRoleRequest = Request<{}, {}, { role_obj: TUserRole }>;
type UserRoleResponse = Response<TUserRole | ErrorResponse>;
type UserRolesResponse = Response<TUserRole[] | ErrorResponse>;

type UserUpdateInfoRequest = Request<
    { UUID: string },
    {},
    { name?: string; email?: string; college_id?: string }
>;

const router = Router();

// --- User Role Routes, must be first to properly cascade routes ---

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
        // If no user roles are found, log an error, but still return an
        // empty array
        if (!user_roles) {
            req.log.error("No user roles found in the database");
        } else {
            req.log.debug("Returned all user roles");
        }
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

    // If the user is authorized, perform the update
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
 * Create a user role. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_ROLE} scope. If the user is not authorized, a
 * status error is returned. If the user is authorized, the newly created
 * user role object is returned.
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

    // If the user is authorized, create the role
    if (await verifyRequest(requesting_uuid, API_SCOPE.CREATE_ROLE)) {
        const user_role = await createUserRole(role_obj);
        if (!user_role) {
            req.log.warn(
                `An attempt was made to create a user role with uuid ` +
                    `${role_uuid}, but a role with that uuid already exists`,
            );
            res.status(StatusCodes.CONFLICT).json({
                error: `A user role with uuid \`${role_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created user role with uuid ${role_uuid}`);
        res.status(StatusCodes.CREATED).json(user_role);
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
        // If the user is authorized, delete the role
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

router.patch(
    "/:user_uuid/grant/role/:role_uuid",
    async (
        req: Request<{ user_uuid: string; role_uuid: string }>,
        res: UserResponse,
    ) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;
        const role_uuid = req.params.role_uuid;
        req.log.debug({
            msg: `Granting user with uuid ${user_uuid} role with uuid ${role_uuid}`,
            requesting_uuid: requesting_uuid,
        });
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while granting user " +
                    `with uuid ${user_uuid} role with uuid ${role_uuid}.`,
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }
        // If the user is authorized, grant the role
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_USER,
                API_SCOPE.GRANT_ROLE,
            )
        ) {
            const updated_user = await grantRoleToUser(user_uuid, role_uuid);
            if (!updated_user) {
                req.log.error(`No user or role found with given uuids`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `Either the user or role uuid was not found.`,
                });
                return;
            }
            req.log.debug(
                `Granted user with uuid ${user_uuid} role with uuid ${role_uuid}`,
            );
            // Return a status ok, granted user role object is not returned
            res.status(StatusCodes.OK).json(updated_user);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: "Forbidden user attempted to grant user role",
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

// --- Certificate Routes ---

// --- Admin Routes ---

/**
 * Initialize the first admin role and user in the database. This route
 * is not protected, and can only be called once to initialize the first
 * admin user. If an admin role or user already exists, an error is returned.
 */
router.post("/initialize_admin", async (req: Request, res: UserResponse) => {
    req.log.info("Initializing the first admin role and user in the database");
    const initial_admin_role = await initializeAdminRole();
    if (!initial_admin_role) {
        res.status(StatusCodes.CONFLICT).json({
            error: "An admin role already exists.",
        });
        return;
    }
    const initial_admin = await initializeAdmin(initial_admin_role.uuid);
    if (!initial_admin) {
        res.status(StatusCodes.CONFLICT).json({
            error: "An admin user already exists.",
        });
        return;
    }
    res.status(StatusCodes.OK).json(initial_admin);
});

/**
 * Get the user information for the requesting user. This is a public
 * route, but a `requesting_uuid` header is required to call it.
 * If the user is not found, a status error is returned. If the user is
 * found, the user object is returned.
 */
router.get("/self", async (req: Request, res: UserResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting self");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting self",
        requesting_uuid: requesting_uuid,
    });

    const user = await getUser(requesting_uuid);

    if (!user) {
        req.log.warn(`User not found by uuid ${requesting_uuid}`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: `No user found with uuid \`${requesting_uuid}\`.`,
        });
        return;
    }

    req.log.debug({
        msg: `Found user by uuid ${requesting_uuid}`,
        user: user,
    });

    res.status(StatusCodes.OK).json(user);
});

/**
 * Get all API scopes for the requesting user. This is a public route, but a
 * `requesting_uuid` header is required to call it. If the user is not found,
 * a status error is returned. If the user is found, the user's API scopes
 * are returned.
 */
router.get("/self/scopes", async (req: Request, res: UserScopesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;
    if (!requesting_uuid) {
        req.log.warn(
            "No requesting_uuid was provided while getting own scopes",
        );
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }
    req.log.debug({
        msg: "Getting own scopes",
        requesting_uuid: requesting_uuid,
    });

    const scopes = await getUserScopes(requesting_uuid);

    req.log.debug({
        msg: `Returning scopes for user with uuid ${requesting_uuid}`,
        user: scopes,
    });

    res.status(StatusCodes.OK).json(scopes);
});

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

        res.status(StatusCodes.CREATED).json(user);
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
 * Get all users. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_USERS} scope.
 */
router.get("/", async (req: UsersRequest, res: UsersResponse) => {
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
        // If no users are found, log an error, but still return an
        // empty array
        if (!users) {
            req.log.error("No users found in the database");
        } else {
            req.log.debug("Returned all users");
        }
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
 * Update a specific user by UUID. Does not allow creating new users.
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.UPDATE_USER} scope If
 * the user is not authorized, a status error is returned. If the user is
 * authorized, the updated user object is returned.
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

    // Check if the request is valid
    if (await verifyRequest(requesting_uuid, API_SCOPE.UPDATE_USER)) {
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
 * call it. The user must have the {@link API_SCOPE.CREATE_USER} scope. If the
 * user is not authorized, a status error is returned. If the user is
 * authorized, the new user object is returned.
 */
router.post("/", async (req: UserRequest, res: UserResponse) => {
    // Get the user object from the request body
    const user_obj = req.body.user_obj;
    if (!user_obj) {
        req.log.warn("No user object provided to create new user.");
        res.status(StatusCodes.BAD_REQUEST).json({
            error: "No user object was provided.",
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
            res.status(StatusCodes.CONFLICT).json({
                error: `A user with uuid \`${new_user_uuid}\` already exists.`,
            });
            return;
        }
        req.log.debug(`Created user with uuid ${new_user_uuid}`);
        // Return the new user object
        res.status(StatusCodes.CREATED).json(user);
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
 * Update a user's public information by UUID
 * This is a protected route, and a `requesting_uuid` header is required to
 * call it. The user must have the {@link API_SCOPE.UPDATE_USER} scope. If the
 * user is requesting to update their own information, they must have the
 * {@link API_SCOPE.UPDATE_INFO_SELF} scope. If the user is not authorized, a
 * status error is returned. If the user is authorized, the updated user object
 * is returned.
 */
router.patch(
    "/info/:UUID",
    async (req: UserUpdateInfoRequest, res: UserResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        // If no requesting user_uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while updating user info",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        const user_uuid = req.params.UUID;
        const new_name = req.body.name;
        const new_email = req.body.email;
        const new_college_id = req.body.college_id;
        req.log.debug({
            msg: `Updating user's public info with uuid ${user_uuid}`,
            requesting_uuid: user_uuid,
        });

        // A patch request is valid if the requesting user can update any user,
        // or if the requesting user is allowed to update their own information
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.UPDATE_USER,
                requesting_uuid === user_uuid && API_SCOPE.UPDATE_INFO_SELF,
            )
        ) {
            // If the user is authorized, perform the update
            const updated_user = await updateUserPublicInfo(
                user_uuid,
                new_name,
                new_email,
                new_college_id,
            );
            if (!updated_user) {
                req.log.warn(`No user found to update with uuid ${user_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No user found to update with uuid \`${user_uuid}\`.`,
                });
                return;
            }
            req.log.debug(`Updated user with uuid ${user_uuid}`);
            // Return the updated user object
            res.status(StatusCodes.OK).json(updated_user);
        } else {
            // If the user is not authorized, provide a status error
            req.log.warn({
                msg: `Forbidden user attempted to update user with uuid ${user_uuid}`,
                requesting_uuid: requesting_uuid,
            });
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

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
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.DELETE_USER,
                requesting_uuid === user_uuid && API_SCOPE.DELETE_USER_SELF,
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

export default router;
