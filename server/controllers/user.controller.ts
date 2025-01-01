import { API_SCOPES } from "common/global";
import { TUser, TUserRole, UserRoleUUID, UserUUID } from "common/user";
import { User, UserRole } from "models/user.model";
import mongoose from "mongoose";

/**
 * Get all users in the database
 * @returns A promise to list of TUser objects representing all users in the db
 */
export async function getUsers(): Promise<TUser[]> {
    const Users = mongoose.model("User", User, "users");
    return Users.find();
}

/**
 * Get a specific user's information, searching by UUID
 * @param uuid The user's UUID to search by
 * @returns A promise to a TUser object, or null if no user has the given UUID
 */
export async function getUser(uuid: UserUUID): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    return Users.findOne({ uuid: uuid });
}

/**
 * Get a specific user's information, searching by college id.
 * If multiple users have the same college id, this function will only return
 * the first found.
 * @param id The user's college id to search by
 * @returns A promise to a TUser object, or null if no user has the given id
 */
export async function getUserByCollegeID(id: string): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    return Users.findOne({ college_id: id });
}

/**
 * Get a specific user's information, searching by email.
 * If multiple users have the same email, this function will only return the
 * first found.
 * @param email The user's email to search by
 * @returns A promise to a TUser object, or null if no user has the given email
 */
export async function getUserByEmail(email: string): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    return Users.findOne({ email: email });
}

/**
 * Update a user's information given an entire TUser object. The user is found
 * by UUID.
 * @param user_obj The user's complete and updated information
 */
export async function updateUser(user_obj: TUser): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    // Update the given user with a new user_obj, searching by uuid
    // and return the new user object
    return Users.findOneAndReplace({ uuid: user_obj.uuid }, user_obj, {
        returnDocument: "after",
    });
}

/**
 * Create a new user in the database. This function will return the created
 * user object, or null if a user with the same UUID already exists.
 * @param user_obj The user's complete information
 */
export async function createUser(user_obj: TUser): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    const user_uuid = user_obj.uuid;
    // Check if the user already exists
    const existingUser = await Users.exists({ uuid: user_uuid });
    if (existingUser) {
        // If so, return null, and don't create a new user
        return null;
    }
    // If the user doesn't exist, create a new user and return it
    const newUser = new Users(user_obj);
    return newUser.save();
}

/**
 * Delete a user by UUID. This function will return the deleted user object, or
 * null if no user was found with the given UUID.
 * @param uuid The user's UUID
 */
export async function deleteUser(uuid: UserUUID): Promise<TUser | null> {
    const Users = mongoose.model("User", User, "users");
    return Users.findOneAndDelete({ uuid: uuid });
}

/**
 * Get all user role objects in the database
 * @returns A list {@link TUserRole} of all user roles in the db
 */
export async function getUserRoles(): Promise<TUserRole[]> {
    const UserRoles = mongoose.model("UserRole", UserRole, "user_roles");
    return UserRoles.find();
}

/**
 * Get a specific user role by UUID
 * @param role_uuid The UUID of the user role to find
 * @returns The {@link TUserRole} with the given UUID. If no user role exists
 * with the given UUID, this function returns null.
 */
export async function getUserRole(
    role_uuid: UserRoleUUID,
): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole, "user_roles");
    return UserRoles.findOne({ uuid: role_uuid });
}

/**
 * Update a user role with a new TUserRole object, and return the updated object.
 * @param role_obj The new user role object, or null if the role was not found
 */
export async function updateUserRole(
    role_obj: TUserRole,
): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole, "user_roles");
    return UserRoles.findOneAndReplace({ uuid: role_obj.uuid }, role_obj, {
        returnDocument: "after",
    });
}

/**
 * Create a new user role in the database, and return the created object.
 * @param role_obj The user role's complete information
 */
export async function createUserRole(
    role_obj: TUserRole,
): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole, "user_roles");
    // Check if the user role already exists
    const existingRole = await UserRoles.exists({ uuid: role_obj.uuid });
    if (existingRole) {
        // If so, return null, and don't create a new user role
        return null;
    }
    // If the user role doesn't exist, create a new user role and return it
    const newRole = new UserRoles(role_obj);
    return newRole.save();
}

/**
 * Delete a user role by UUID. This function will return the deleted user role
 * object, or null if no user role was found with the given UUID.
 * @param role_uuid The UUID of the user role to delete
 */
export async function deleteUserRole(
    role_uuid: UserRoleUUID,
): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole, "user_roles");
    return UserRoles.findOneAndDelete({ uuid: role_uuid });
}

/**
 * Get all API scopes for a given user, searching by UUID
 * @param uuid The UUID of the user to use
 * @returns A list of {@link API_SCOPES} that the user has
 */
export async function getUserScopes(uuid: UserUUID): Promise<API_SCOPES[]> {
    const user = await getUser(uuid);
    let scopes: API_SCOPES[] = [];
    // If the user doesn't exist, they have no scopes
    if (!user) {
        return scopes;
    }
    // Otherwise, extend the scopes list using each of their active roles
    for (const role_log of user.active_roles) {
        const role = await getUserRole(role_log.role_uuid);
        if (role) {
            scopes.push(...role.scopes);
        }
    }
    return scopes;
}
