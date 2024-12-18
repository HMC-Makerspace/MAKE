import type { Http2ServerRequest } from "http2";
import type { UnixTimestamp } from "./global";

/**
 * IPlog - Object to store information about the IP logs
 * @property uuid - the unique identifier for the IP log
 * @property ip - the IP address of the request origin
 * @property timestamp - when it was logged
 * @property request - The HTTP request object for this call
 */
export type TIPlog = {
    uuid: UUID;
    ip: string;
    timestamp: UnixTimestamp;
    request: Http2ServerRequest;
};
