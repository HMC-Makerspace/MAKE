import { API_SCOPE } from "common/global";
import { UserUUID } from "common/user";
import { getUserScopes } from "./user.controller";
import { Request, Response, NextFunction } from "express";
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

export function verifySchema<S, R extends Request>(
    schema: Joi.ObjectSchema<S> | Joi.ArraySchema<S> ,
    path_name: keyof R["body"],
): (req: Request, res: Response, next: NextFunction) => void {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const obj = req.body[path_name];
        const { error, value } = schema.validate(obj);
        req.log.info("verifying schema")

        if (error) {
            req.log.error({
                msg:`An attempt was made to create a ` + 
                `${String(path_name)}, but was passed in a faulty data.`,
                err: error
        });
            res.status(StatusCodes.NOT_ACCEPTABLE).json({
                error: `Failed to create ${String(path_name)} data. ${error}`,
            });
            next(error);
        }
        req.body[path_name] = value;

        next();
    }
}
