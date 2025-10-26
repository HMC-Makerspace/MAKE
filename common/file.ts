import type { UnixTimestamp, UUID } from "./global";
import { UserRoleUUID } from "./user";

export type FileUUID = UUID;

export enum FILE_RESOURCE_TYPE {
    USER = "user",
    AREA = "area",
    MACHINE = "machine",
    WORKSHOP = "workshop",
}

/**
 * All relevant user information
 * @property uuid - The file's unique identifier for the database
 * @property name - The user's preferred name
 * @property path - The path of this file on the server
 * @property timestamp_upload - The timestamp this file was uploaded to the server
 * @property timestamp_expires - (optional) The timestamp this file will be deleted. If not present, will not be deleted.
 * @property size - The size of the file in bytes
 */
export type TFile = {
    uuid: FileUUID;
    name: string;
    path: string;
    timestamp_upload: UnixTimestamp;
    timestamp_expires?: UnixTimestamp;
    size: number;
    resource_uuid: UUID;
    resource_type: FILE_RESOURCE_TYPE;
};

/**
 * TAreaDocument - A document link for users to access
 * @property name - The name of the document
 * @property link - The link to the document
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to see this file. A user must have at least one of these
 *      roles to see the given file.
 *      If null, this file is public.
 *      If set as an empty list, only admins are able to see the file.
 */
export type TDocument = {
    name: string;
    link: string;
    authorized_roles?: UserRoleUUID[] | null;
};
