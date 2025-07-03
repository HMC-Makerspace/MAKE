import type { CertificationUUID, TRequiredCertificate } from "./certification";
import type { FileUUID, TFile } from "./file";
import type { UnixTimestamp, UUID } from "./global";
import type { MachineUUID } from "./machine";
import type { UserRoleUUID } from "./user";
import type { TDocument } from "./file";

export type AreaUUID = UUID;

/**
 * TAreaStatus - A status about an area in the space
 * @property timestamp - The timestamp this status occurred
 * @property reserved - (optional) Whether the space is currently available for use
 * @property message - (optional) A status message about the state of the area
 */
export type TAreaStatus = {
    timestamp: UnixTimestamp;
    reserved?: boolean;
    message?: string;
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
 * @property status - The current status of the area.
 * @property status_logs - A list of past statuses
 * @property required_certifications - (optional) UUIDs of certs required to
 *      use/reserve the area
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to see this area. A user must have at least one of these
 *      to reserve the area. If null, area needs to rolls to be reserved.
 *      If set as the empty list, only admin users will be able to reserve this area.
 * @property reservable - (optional) Whether this area is allowed to be reserved.
 *      Only users with the required certifications and authorized roles can
 *      reserve this area.
 * @property reserved - (optional) Whether this area is currently reserved.
 *      Only users with the required certifications and authorized roles can
 *      reserve this area.
 * @property visible_to - (optional) A list of user roles that can view this area
 *      on the main area page. If set to null, the area will be publicly visible
 *      by anyone. If set to the empty list, the area will only be visible to admins.
 */
export type TArea = {
    uuid: AreaUUID;
    name: string;
    description?: string;
    documents?: TDocument[];
    equipment?: MachineUUID[];
    images?: FileUUID[];
    required_certifications?: TRequiredCertificate[];
    authorized_roles?: UserRoleUUID[] | null;
    reservable?: boolean;
    reserved?: boolean;
    visible_to?: UserRoleUUID[] | null;
};
