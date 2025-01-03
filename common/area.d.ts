import type { CertificationUUID } from "./certification";
import type { FileUUID, TFile } from "./file";
import type { UnixTimestamp, UUID } from "./global";
import type { MachineUUID } from "./machine";
import type { UserRoleUUID } from "./user";
import type { TDocument } from "./file";

export type AreaUUID = UUID;

/**
 * TAreaStatus - A status about an area in the space
 * @property available - Whether the space is currently available for use
 * @property message - (optional) A status message about the state of the area
 */
export type TAreaStatus = {
    available: boolean;
    message?: string;
};

/**
 * TAreaStatusLog - A log about a change in status for an area in the space
 * @property timestamp - The timestamp this log occurred
 * @property status - The new status of the area
 */
export type TAreaStatusLog = {
    timestamp: UnixTimestamp;
    status: TAreaStatus;
};

/**
 * TArea - Information about an area in the space
 * @property uuid - A unique id
 * @property name - The name of the area/location
 * @property description - (optional) A longer description of what the area is
 *      for or what it contains
 * @property documents - (optional) A list of documents related to policies or
 *      information about the area
 * @property equipment - (optional) A list of {@link TMachine | machine } UUIDs
 *      that are available in this area
 * @property images - (optional) A list of {@link TFile | File} UUIDs that are
 *     images of this area
 * @property current_statuses - A list of status objects indicating the current
 *      status of each of the `count` machines in the space
 * @property status_logs - A list of changes in status logged by timestamp
 * @property required_certifications - (optional) UUIDs of certs required to
 *      use/reserve the area
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to see this area. A user must have at least one of these
 *      roles to see this area in the area tab. If not present, this is a
 *      public area.
 * @property reservable - (optional) Whether this area is allowed to be reserved.
 *      Only users with the required certifications and authorized roles can
 *      reserve this area.
 */
export type TArea = {
    uuid: AreaUUID;
    name: string;
    description?: string;
    documents?: TDocument[];
    equipment?: MachineUUID[];
    images?: FileUUID[];
    current_status: TAreaStatus;
    status_logs: TAreaStatusLog[];
    required_certifications?: CertificationUUID[];
    authorized_roles?: UserRoleUUID[];
    reservable?: boolean;
};

export type TPublicAreaData = Omit<TArea, "uuid" | "status_logs">;
