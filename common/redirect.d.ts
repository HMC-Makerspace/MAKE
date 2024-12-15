import { UnixTimestamp } from "./global";

/**
 * Redirect - Handling page redirects
 * @property uuid - the unique identifier for the redirect
 * @property path - the starting place of the thing
 * @property redirect - where the path is directed to
 * @property logs - history of redirect usage
 */
export type TRedirect = {
    uuid: UUID;
    path: string;
    redirect: string;
    logs: {
        uuid: UUID;
        ip: string;
        timestamp: UnixTimestamp;
    };
};