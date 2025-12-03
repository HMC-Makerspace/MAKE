import { API_SCOPE } from "common/global";
import { UserUUID } from "common/user";
import { getUserScopes } from "./user.controller";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";

/**
 * Verify that a user is allowed to access an endpoint. A user must have at
 * least one of the required scopes to access the endpoint. If the user has
 * the ADMIN scope, they will be granted access to all endpoints.
 * @param user_uuid The UUID of the user to verify
 * @param allowed_scopes The list of possible scopes allowed to access the endpoint
 * @returns A promise to a boolean, true if the user has all required scopes
 */
export async function verifyRequest(
    user_uuid: UserUUID,
    ...allowed_scopes: (API_SCOPE | false)[]
): Promise<boolean> {
    // Remove any false values from the allowed scopes list, as they are
    // placeholders for conditional scopes
    const true_scopes = allowed_scopes.filter((scope) => scope !== false);
    // Get a list of the user's scopes
    const scopes = await getUserScopes(user_uuid);
    // Check that the user's scopes list includes all required scopes,
    // or that the user has the ADMIN scope
    return (
        scopes.includes(API_SCOPE.ADMIN) ||
        true_scopes.some((scope) => scopes.includes(scope))
    );
}

/**
 * Verify that a user is allowed to access an endpoint that requires multiple
 * scopes. Scopes are supplied in groups, and the user must have all scopes in
 * at least one group to access the endpoint. If the user has the ADMIN scope,
 * they will be granted access to all endpoints.
 * @param user_uuid The UUID of the user to verify
 * @param scope_groups A list of groups of scopes, where the user must have all
 *     scopes in at least one group to access the endpoint
 * @returns A promise to a boolean, true if the user has all required scopes
 */
export async function verifyCompoundRequest(
    user_uuid: UserUUID,
    ...scope_groups: API_SCOPE[][]
): Promise<boolean> {
    // Get a list of the user's scopes
    const scopes = await getUserScopes(user_uuid);
    // Check that the user's scopes list includes all required scopes,
    // or that the user has the ADMIN scope
    return (
        scopes.includes(API_SCOPE.ADMIN) ||
        scope_groups.some((group) =>
            group.every((scope) => scopes.includes(scope)),
        )
    );
}

export async function verifySchema<T>(
    schema: Joi.ObjectSchema<T>,
    obj: T, 
    req: Request,
    res: Response,
    obj_des: string,
): Promise<T | undefined> {
    const { error, value } = schema.validate(obj);

    if (error) {
        req.log.error(
            `An attempt was made to create a ` + 
            `${obj_des}, but was passed in a faulty data ${error}`
        );
        res.status(StatusCodes.NOT_ACCEPTABLE).json({
            error: `Failed to create ${obj_des} data. ${error}`,
        });
        return undefined;
    }

    return value;
}
