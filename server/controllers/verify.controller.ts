import { API_SCOPES } from "common/global";
import { UserUUID } from "common/user";
import { getUserScopes } from "./user.controller";

export async function verifyRequest(
    user_uuid: UserUUID,
    ...required_scopes: API_SCOPES[]
): Promise<boolean> {
    // Get a list of the user's scopes
    const scopes = await getUserScopes(user_uuid);
    // Check that the user's scopes list includes all required scopes
    return required_scopes.every((scope) => scopes.includes(scope));
}
