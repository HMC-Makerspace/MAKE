import type { UserUUID } from "./user";
import type { IncomingHttpHeaders } from "http";
import type { Response } from "express";

/**
 * VerifyRequestHeader - A standard interface for verifying requests
 * @property requesting_uuid - The UUID of the user making this request. The
 *      user's roles will be queried to determine if they have the proper API
 *      scopes to make the given request.
 */
export type VerifyRequestHeader = IncomingHttpHeaders & {
    requesting_uuid: UserUUID;
    passkey: string;
};

/**
 * ErrorResponse - A standard interface for returning errors
 * @property error - A string describing the error that occurred
 */
export type ErrorResponse = {
    error: string;
};

/**
 * UNAUTHORIZED_ERROR - A standard error message for protected routes that require
 * a requesting user UUID to be provided.
 */
export const UNAUTHORIZED_ERROR: ErrorResponse = {
    error:
        "This is a protected route, and no user session was provided" +
        "provided. Please sign in with SSO to complete this request, " +
        "or add a requesting_uuid and passkey header as an alternate auth.",
};

/**
 * FORBIDDEN_ERROR - A standard error message for unauthorized requests,
 * where the requesting user UUID does not have the proper API scopes.
 */
export const FORBIDDEN_ERROR: ErrorResponse = {
    error:
        "This is a protected call, and the requesting user UUID does not " +
        "have the proper API scopes required.",
};

export type SuccessfulResponse = Response<null | ErrorResponse | {}>;

/**
 * Custom logic for validating college ID numbers.
 * TODO: Modify this function to suit your needs.
 * If the return value is a string, the result is the corrected, valid version
 * of the given input ID, which may be the original value or a modified version
 * (e.g. trimmed whitespace). If the return value is null, the ID is invalid
 * and will be ignored.
 * @param college_id The provided user's college ID
 * @returns The corrected ID, or null if the id is invalid
 */
export function validateCollegeIDStrict(college_id: string): string | null {
    // Remove whitespace
    college_id = college_id.trim();
    // Remove underscores, (semi)colons, spaces, and question marks
    college_id = college_id.replace(/[\_\;\: \?]/, "");
    if (college_id.length >= 9) {
        if (college_id.match(/^(25|9)/) && college_id.length === 9) {
            return college_id; // Valid ID
        } else if (college_id.startsWith("0")) {
            // Attempt to revalidate ID by dropping leading 0
            return validateCollegeID(college_id.slice(1));
        } else {
            // Attempt to revalidate ID by dropping trailing number
            return validateCollegeID(
                college_id.slice(0, college_id.length - 1),
            );
        }
    } else if (college_id.length === 8) {
        if (college_id.match(/^[1-5]/)) {
            return college_id; // Valid ID
        } else {
            return null;
        }
    } else {
        return null;
    }
}


/**
 * Validate a user's email
 * TODO: Modify this function to suit your needs.
 * If the return value is a string, the result is the corrected, valid
 * version of the given input email, which may be the original value or
 * a modified version (e.g. lowercase). If the return value is null,
 * the email format is invalid and will be ignored.
 * @param college_id The provided user's email
 * @returns The corrected email, or null if the email is invalid
 */
export function validateEmailStrict(email: string): string | null {
    // Remove whitespace and make case insensitive
    email = email.trim().toLowerCase();
    // Basic email format check
    if (!email.match(/^.+@.+$/)) {
        return null;
    }
    // Convert g.hmc.edu to hmc.edu
    if (email.endsWith("g.hmc.edu")) {
        return validateEmailStrict(
            email.substring(0, email.indexOf("g.hmc.edu")) + "hmc.edu",
        );
    }
    return email;
}

/**
 * Validate a user's college ID, but default to accepting the original value if invalid.
 * @param college_id The provided user's college ID
 * @returns The corrected ID, or the input value if invalid.
 */
export function validateCollegeID(college_id: string): string {
    const new_id = validateCollegeIDStrict(college_id);
    return new_id === null ? college_id : new_id;
}


/**
 * Validate a user's email, but default to accepting the original value if invalid.
 * @param college_id The provided user's email
 * @returns The corrected email, or the input value if invalid.
 */
export function validateEmail(college_id: string): string {
    const new_id = validateEmailStrict(college_id);
    return new_id === null ? college_id : new_id;
}