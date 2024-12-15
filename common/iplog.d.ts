import { UnixTimestamp } from "./global";

/**
 * IPlog - Object to store information about the IP logs
 * @property uuid - the unique identifier for the IP log
 * @property ip - the IP address of the user
 * @property timestamp - when it was logged
 * @property user - the uuid of the user requested
 */
export type TIPlog = {
    uuid: UUID;
    ip: string;
    timestamp: UnixTimestamp;
    //user: UUID; // do we include this? it looks like we wanted this but it wasn't actually stored in the db
};