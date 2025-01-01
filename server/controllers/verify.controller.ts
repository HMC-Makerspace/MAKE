import { API_SCOPE } from "common/global";
import { UserUUID } from "common/user";
import { getUserScopes } from "./user.controller";

/**
 * Verify that a user has all required scopes to access an endpoint. If the
 * user has the ADMIN scope, they will be granted access to all endpoints.
 * @param user_uuid The UUID of the user to verify
 * @param required_scopes The scopes required to access the endpoint
 * @returns A promise to a boolean, true if the user has all required scopes
 */
export async function verifyRequest(
    user_uuid: UserUUID,
    ...required_scopes: API_SCOPE[]
): Promise<boolean> {
    // Get a list of the user's scopes
    const scopes = await getUserScopes(user_uuid);
    // Check that the user's scopes list includes all required scopes,
    // or that the user has the ADMIN scope
    return (
        scopes.includes(API_SCOPE.ADMIN) ||
        required_scopes.every((scope) => scopes.includes(scope))
    );
}

/**
 * Verify that a user has the required scopes to access an endpoint. By
 * default, this function will check for the standard scope, and if the user
 * is requesting information about themselves, it will also check for the
 * self scope. If the user is an admin, they will be granted access to all
 * endpoints.
 * @param requesting_uuid The UUID of the user making the request
 * @param target_user_uuid The UUID of the user who's data is being requested
 * @param standard_scope The scope required to access the endpoint for any user
 * @param self_scope The scope required to access the endpoint for self requests
 * @returns A promise to a boolean, true if the user has access to the endpoint
 */
export async function isUserRequestValid(
    requesting_uuid: UserUUID,
    target_user_uuid: UserUUID,
    standard_scope: API_SCOPE,
    self_scope: API_SCOPE,
): Promise<boolean> {
    // Check for standard scope verification
    if (await verifyRequest(requesting_uuid, standard_scope)) {
        return true;
    } else if (target_user_uuid === requesting_uuid) {
        // Check for self scope verification
        return await verifyRequest(requesting_uuid, self_scope);
    } else {
        // If neither verification is successful, return false
        return false;
    }
}
