import type { UnixTimestamp, UUID } from "./global";

export type FileUUID = UUID;

/**
 * All relevant user information
 * @property uuid - The file's unique identifier for the database
 * @property name - The user's preferred name
 * @property path - The path of this file on the server
 * @property timestamp_upload - The timestamp this file was uploaded to the server
 * @property timestamp_expires - (optional) The timestamp this file will be deleted. If not present, will not be deleted.
 * @property size - The size of the file in bytes
 * @property user_uuid - (optional) The UUID of the user who uploaded this file. If not present, this file is not for a user.
 */
export type TFile = {
    uuid: FileUUID;
    name: string;
    path: string;
    timestamp_upload: UnixTimestamp;
    timestamp_expires?: UnixTimestamp;
    size: number;
    user_uuid?: UserUUID;
};
