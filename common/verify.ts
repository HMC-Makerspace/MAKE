import { UserUUID } from "./user";
import { IncomingHttpHeaders } from "http";

/**
 * VerifyRequestHeader - A standard interface for verifying requests
 * @property requesting_uuid - The UUID of the user making this request. The
 *      user's roles will be queried to determine if they have the proper API
 *      scopes to make the given request.
 */
export type VerifyRequestHeader = IncomingHttpHeaders & {
    requesting_uuid: UserUUID;
};

/**
 * ErrorResponse - A standard interface for returning errors
 * @property error - A string describing the error that occurred
 */
export type ErrorResponse = {
    error: string;
};

/**
 * PROTECTED_ERROR - A standard error message for protected routes that require
 * a requesting user UUID to be provided.
 */
export const PROTECTED_ERROR: ErrorResponse = {
    error:
        "This is a protected route, and no requesting user UUID was " +
        "provided. Add `requesting_uuid` as a header with a user's uuid to " +
        "make this request.",
};

/**
 * UNAUTHORIZED_ERROR - A standard error message for unauthorized requests,
 * where the requesting user UUID does not have the proper API scopes.
 */
export const UNAUTHORIZED_ERROR: ErrorResponse = {
    error:
        "This is a protected call, and the requesting user UUID does not " +
        "have the proper API scopes required.",
};
