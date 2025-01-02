import type { CertificationUUID } from "./certification";
import type { FileUUID, TFile } from "./file";
import type { UnixTimestamp, UUID } from "./global";
import type { MachineUUID, TDocument } from "./machine";
import type { UserRoleUUID } from "./user";

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
 * @property current_statuses - A list of status objects indicating the current
 *      status of each of the `count` machines in the space
 * @property status_logs - A list of changes in status logged by timestamp
 * @property required_certifications - UUIDs of certs required to use/reserve
 *      the area
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this area. A user must have at least one of these
 *      roles to reserve the given area. If not present, any user may
 *      use/reserve this area.
 * @property hidden - (optional) Whether this area should be hidden from the
 *     public. If true, only users with an authorized role may see this area.
 *     Defaults to false if not present.
 */
export type TArea = {
    uuid: AreaUUID;
    name: string;
    description?: string;
    documents?: TDocument[];
    equipment?: MachineUUID[];
    current_status: TAreaStatus;
    status_logs: TAreaStatusLog[];
    required_certifications?: CertificationUUID[];
    authorized_roles?: UserRoleUUID[];
    hidden?: boolean;
};

export type TPublicAreaData = Omit<TArea, "uuid" | "status_logs">;
