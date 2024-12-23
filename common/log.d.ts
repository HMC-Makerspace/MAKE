import type { Http2ServerRequest } from "http2";
import type { UnixTimestamp, UUID } from "./global";

/**
 * IPlog - Object to store information about the IP logs
 * @property uuid - the unique identifier for the IP log
 * @property ip - the IP address of the request origin
 * @property timestamp - when it was logged
 * @property request - The HTTP request object for this call
 */
export type TIPLog = {
    uuid: UUID;
    ip: string;
    timestamp: UnixTimestamp;
    request: Http2ServerRequest;
};

/**
 * Redirect - Handling page redirects
 * @property uuid - the unique identifier for the redirect
 * @property path - the path to redirect from
 * @property redirect - where the path is redirected to
 * @property logs - history of redirect usage, as {@link TIPLog | IP Logs}
 */
export type TRedirect = {
    uuid: UUID;
    path: string;
    redirect: string;
    logs: TIPLog[];
};

/**
 * PrinterLog - Object to store information about Bambu Printer logs
 * @property uuid - the unique identifier for the Printer log
 * @property printer_name - the name of the printer being logged
 * @property printer_online - if the printer is or isn't online
 * @property printer_json - a dictionary of the printer log
 * @see {@link https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md#pushingpushall | The OpenBambuAPI}
 * for information about `printer_json`
 */
export type TPrinterLog = {
    uuid: UUID;
    printer_name: string;
    printer_online: boolean;
    printer_json?: {
        [key: string]: any;
    };
};
