import type { UnixTimestamp, UUID } from "./global";
import type { TIPlog } from "./iplog";

/**
 * Redirect - Handling page redirects
 * @property uuid - the unique identifier for the redirect
 * @property path - the path to redirect from
 * @property redirect - where the path is redirected to
 * @property logs - history of redirect usage, as {@link TIPlog | IP Logs}
 */
export type TRedirect = {
    uuid: UUID;
    path: string;
    redirect: string;
    logs: TIPlog[];
};
