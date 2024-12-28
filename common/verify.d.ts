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
