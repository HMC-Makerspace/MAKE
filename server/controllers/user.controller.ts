import { CertificationUUID } from "common/certification";
import { API_SCOPE } from "common/global";
import { TUser, TUserRole, UserRoleUUID, UserUUID } from "common/user";
import { Certificate, Certification } from "models/certification.model";
import { User, UserRole } from "models/user.model";
import mongoose from "mongoose";

/**
 * Get all users in the database
 * @returns A promise to list of TUser objects representing all users in the db
 */
export async function getUsers(): Promise<TUser[]> {
    const Users = mongoose.model("User", User);
    return Users.find();
}

/**
 * Get a specific user's information, searching by UUID
 * @param uuid The user's UUID to search by
 * @returns A promise to a TUser object, or null if no user has the given UUID
 */
export async function getUser(uuid: UserUUID): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
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
    const Users = mongoose.model("User", User);
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
    const Users = mongoose.model("User", User);
    return Users.findOne({ email: email });
}

/**
 * Update a user's information given an entire TUser object. The user is found
 * by UUID.
 * @param user_obj The user's complete and updated information
 */
export async function updateUser(user_obj: TUser): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
    // Update the given user with a new user_obj, searching by uuid
    // and return the new user object
    return Users.findOneAndReplace({ uuid: user_obj.uuid }, user_obj, {
        returnDocument: "after",
    });
}

/**
 * Update a user's public information (name, email, and college_id) given the
 * user's UUID.
 * @param user_uuid The UUID of the user to update
 * @param name The user's new name, or null to keep the existing name
 * @param email The user's new email, or null to keep the existing email
 * @param college_id The user's new college ID, or null to keep the existing ID
 * @returns The updated user object, or null if the user doesn't exist
 *     with the given UUID
 */
export async function updateUserPublicInfo(
    user_uuid: UserUUID,
    name?: string,
    email?: string,
    college_id?: string,
): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
    const user = await Users.findOne({ uuid: user_uuid });
    // If the user doesn't exist, no changes are made
    if (!user) {
        return null;
    }
    // Update the user's information if provided
    if (name) {
        user.name = name;
    }
    if (email) {
        user.email = email;
    }
    if (college_id) {
        user.college_id = college_id;
    }
    // Save the updated user and return it
    return user.save();
}

/**
 * Create a new user in the database. This function will return the created
 * user object, or null if a user with the same UUID already exists.
 * @param user_obj The user's complete information
 */
export async function createUser(user_obj: TUser): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
    const user_uuid = user_obj.uuid;
    // Check if the user already exists
    const existing_user = await Users.exists({ uuid: user_uuid });
    if (existing_user) {
        // If so, return null, and don't create a new user
        return null;
    }
    // If the user doesn't exist
    // Add the default user roles to the user
    const default_roles = await getDefaultUserRoles();
    user_obj.active_roles = default_roles.map((role) => ({
        role_uuid: role.uuid,
        timestamp_gained: Date.now() / 1000,
    }));
    // Create a new user and return it
    const new_user = new Users(user_obj);
    return new_user.save();
}

/**
 * Delete a user by UUID. This function will return the deleted user object, or
 * null if no user was found with the given UUID.
 * @param uuid The user's UUID
 */
export async function deleteUser(uuid: UserUUID): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
    return Users.findOneAndDelete({ uuid: uuid });
}

/**
 * Get all user role objects in the database
 * @returns A list {@link TUserRole} of all user roles in the db
 */
export async function getUserRoles(): Promise<TUserRole[]> {
    const UserRoles = mongoose.model("UserRole", UserRole);
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
    const UserRoles = mongoose.model("UserRole", UserRole);
    return UserRoles.findOne({ uuid: role_uuid });
}

/**
 * Get all user roles that are applied to new users by default
 * @returns A list of {@link TUserRole} objects that are marked as default
 */
export async function getDefaultUserRoles(): Promise<TUserRole[]> {
    const UserRoles = mongoose.model("UserRole", UserRole);
    return UserRoles.find({ default: true });
}

/**
 * Update a user role with a new TUserRole object, and return the updated object.
 * @param role_obj The new user role object, or null if the role was not found
 */
export async function updateUserRole(
    role_obj: TUserRole,
): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole);
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
    const UserRoles = mongoose.model("UserRole", UserRole);
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
    const UserRoles = mongoose.model("UserRole", UserRole);
    return UserRoles.findOneAndDelete({ uuid: role_uuid });
}

/**
 * Get all API scopes for a given user, searching by UUID
 * @param uuid The UUID of the user to use
 * @returns A list of {@link API_SCOPE} that the user has
 */
export async function getUserScopes(uuid: UserUUID): Promise<API_SCOPE[]> {
    const user = await getUser(uuid);
    let scopes: API_SCOPE[] = [];
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

/**
 * Grant a role to a user, given their UUID and the UUID of the role to grant.
 * If the user already has the role, no changes are made.
 * @param user_uuid The UUID of the user to grant the role to
 * @param role_uuid The UUID of the role to grant
 * @returns The updated user object, or null if the user or role doesn't exist.
 *      If the user already has the role, the original user object is returned.
 */
export async function grantRoleToUser(
    user_uuid: UserUUID,
    role_uuid: UserRoleUUID,
): Promise<TUser | null> {
    // Find the user and the role
    const Users = mongoose.model("User", User);
    const UserRoles = mongoose.model("UserRole", UserRole);
    const user = await Users.findOne({ uuid: user_uuid });
    const role = await UserRoles.findOne({ uuid: role_uuid });
    // If either the user or role doesn't exist, we can't grant the role
    if (!user || !role) {
        return null;
    }
    // If the user already has the role, no changes are made
    if (user.active_roles.some((log) => log.role_uuid === role_uuid)) {
        return user;
    } else {
        // Otherwise, add the role to the user's active role list
        user.active_roles.push({
            role_uuid: role_uuid,
            timestamp_gained: Date.now() / 1000,
        });
        return user.save();
    }
}

/**
 * Revoke a role from a user, given their UUID and the UUID of the role to revoke.
 * If the user doesn't have the role, no changes are made.
 * @param user_uuid The UUID of the user to revoke the role from
 * @param role_uuid The UUID of the role to revoke
 * @returns The updated user object, or null if the user or role doesn't exist.
 *     If the user doesn't have the role, the original user object is returned.
 */
export async function revokeRoleFromUser(
    user_uuid: UserUUID,
    role_uuid: UserRoleUUID,
): Promise<TUser | null> {
    // Find the user
    const Users = mongoose.model("User", User);
    const user = await Users.findOne({ uuid: user_uuid });
    // If either the user or role doesn't exist, we can't revoke the role
    if (!user) {
        return null;
    }
    // Get the user's active role log for the role to revoke
    const role_log = user.active_roles.find(
        (log) => log.role_uuid === role_uuid,
    );
    // If the user doesn't actively have the role, no changes are made
    if (!role_log) {
        return user;
    } else {
        // Otherwise, remove the role from the user's active role list
        user.active_roles = user.active_roles.filter(
            (log) => log.role_uuid !== role_uuid,
        );
        // Add the role to the user's past role list
        user.past_roles.push({
            role_uuid: role_uuid,
            timestamp_gained: role_log.timestamp_gained,
            timestamp_revoked: Date.now() / 1000,
        });
        return user.save();
    }
}

/**
 * Grant a role to a user, given their UUID and the UUID of the role to grant.
 * If the user already has the role, no changes are made.
 * @param user_uuid The UUID of the user to grant the role to
 * @param certification_uuid The UUID of the certificate to grant
 * @returns The updated user object, or null if the user or role doesn't exist.
 *      If the user already has the role, the original user object is returned.
 */
export async function grantCertificateToUser(
    user_uuid: UserUUID,
    certification_uuid: CertificationUUID,
    level: number = 1,
): Promise<TUser | null> {
    // Find the user
    const Users = mongoose.model("User", User);
    const Certifications = mongoose.model("Certification", Certification);
    const user = await Users.findOne({ uuid: user_uuid });
    const certification = await Certifications.findOne({
        uuid: certification_uuid,
    });
    // If either the user or certification doesn't exist, then there is
    // nothing to grant
    if (!user) {
        throw new Error("User not found");
    }
    if (!certification) {
        throw new Error("Certification not found");
    }
    // If the requested level is higher than the max level for the certification,
    // then the certification cannot be granted
    if (certification.max_level && level > certification.max_level) {
        throw new Error("Level exceeds maximum level for certification");
    }
    // If the user already has the certificate, then move the old certificate
    // to the past certificates list
    if (
        user.active_certificates &&
        user.active_certificates.some(
            (cert) => cert.certification_uuid === certification_uuid,
        )
    ) {
        // Move the old certificate to the past certificates list
        const old_cert = user.active_certificates.find(
            (cert) => cert.certification_uuid === certification_uuid,
        );
        if (!user.past_certificates) {
            user.past_certificates = [];
        }
        user.past_certificates.push(old_cert!);
        // Remove the old certificate from the active certificates list
        user.active_certificates = user.active_certificates.filter(
            (cert) => cert.certification_uuid !== certification_uuid,
        );
    }
    // Add the new certificate to the active certificates list
    if (!user.active_certificates) {
        user.active_certificates = [];
    }
    const now = Date.now() / 1000;
    // If the certification has a time limit, set the expiration date
    const valid_until = certification.seconds_valid_for
        ? now + certification.seconds_valid_for
        : undefined;
    user.active_certificates.push({
        certification_uuid: certification_uuid,
        level: level,
        timestamp_granted: now,
        timestamp_expires: valid_until,
    });
    return user.save();
}

/**
 * Revoke a certificate from a user, given their UUID and the UUID of the
 * certificate to revoke.
 * If the user doesn't have the certificate, no changes are made.
 * @param user_uuid The UUID of the user to revoke the certificate from
 * @param certification_uuid The UUID of the certification to revoke
 * @returns The updated user object, or null if the user or certificate doesn't
 *          exist. If the user doesn't have the certificate, the original user
 *          object is returned.
 */
export async function revokeCertificateFromUser(
    user_uuid: UserUUID,
    certification_uuid: CertificationUUID,
): Promise<TUser | null> {
    // Find the user and the certificate
    const Users = mongoose.model("User", User);
    const user = await Users.findOne({ uuid: user_uuid });
    // If the user doesn't exist, we can't revoke the certificate
    if (!user) {
        return null;
    }
    // Get the user's active certificate log for the role to revoke
    // Check if the user has active certificates
    if (!user.active_certificates) {
        return user;
    }
    // If so, set certificate to the user's active certificates
    const certificate = user.active_certificates.find(
        (cert) => cert.certification_uuid === certification_uuid,
    );
    // If the user doesn't actively have the certificate, no changes are made
    if (!certificate) {
        return user;
    } else {
        // Otherwise, remove the certificate from the user's active certificate list
        // And add it to the past certificates
        user.active_certificates = user.active_certificates.filter(
            (cert) => cert.certification_uuid !== certification_uuid,
        );
        if (!user.past_certificates) {
            user.past_certificates = [];
        }
        user.past_certificates.push(certificate);
    }
    return user.save();
}

/**
 * Initialize the database with an admin role if one does not already exist.
 * Only to be used during initial setup.
 * @returns The created admin role, or null if an admin role already exists
 */
export async function initializeAdminRole(): Promise<TUserRole | null> {
    const UserRoles = mongoose.model("UserRole", UserRole);
    // Check if any admin role already exists
    const existsAdminRole = await UserRoles.exists({
        scopes: { $elemMatch: { $eq: API_SCOPE.ADMIN } },
    });
    if (existsAdminRole) {
        // If so, this route is invalid, as it should only be used to create
        // the first admin role
        return null;
    }
    // If no roles have admin scope, create a new admin role and return it
    const newRole = new UserRoles({
        uuid: crypto.randomUUID(),
        title: "Initial Admin Role",
        description:
            "This admin role was automatically generated. It is advised to " +
            "create a new admin role and delete this one after setup is complete.",
        color: "#FF0000",
        scopes: [API_SCOPE.ADMIN],
        default: false,
    });
    return newRole.save();
}

/**
 * Initialize the database with an admin user if one does not already exist.
 * Only to be used during initial setup.
 * @param admin_role_uuid The UUID of the admin role to assign to the new user
 * @returns The created admin user, or null if an admin user already exists
 */
export async function initializeAdmin(
    admin_role_uuid: UserRoleUUID,
): Promise<TUser | null> {
    const Users = mongoose.model("User", User);
    // Check if any admin users already exist
    const existsAdmin = await Users.exists({
        active_roles: { $elemMatch: { role_uuid: admin_role_uuid } },
    });
    if (existsAdmin) {
        // If so, this route is invalid, as it should only be used to create
        // the first admin user
        return null;
    }
    // If no users have admin scope, create a new admin user and return it
    const newAdmin = new Users({
        uuid: crypto.randomUUID(),
        name: "Auto-Generated Admin (DELETE AFTER SETUP)",
        email: "admin@admin.com",
        college_id: "000000000",
        active_roles: [
            {
                role_uuid: admin_role_uuid,
                timestamp_gained: Date.now() / 1000,
            },
        ],
        past_roles: [],
    });
    return newAdmin.save();
}
