import { CertificationUUID, TRequiredCertificate } from "./certification";
import { FileUUID, TDocument } from "./file";
import { UnixTimestamp, UUID } from "./global";
import { InventoryItemUUID, ITEM_ACCESS_TYPE } from "./inventory";
import { UserRoleUUID } from "./user";

export type MachineUUID = UUID;
export type InstanceUUID = UUID;

/**
 * MACHINE_STATUS_TYPE - Possible statuses for a machine
 */
export enum MACHINE_STATUS_TYPE {
    OFFLINE = 0,
    ONLINE,
    FLAGGED_FOR_REPAIR,
    IN_REPAIR,
}

/**
 * MACHINE_STATUS_LABELS - A list of objects defining
 * various string representations of machine statuses
 */
export const MACHINE_STATUS_LABELS = [
    {
        key: MACHINE_STATUS_TYPE.OFFLINE,
        label: "Out of Order",
        short_label: "Out of Order",
    },
    {
        key: MACHINE_STATUS_TYPE.ONLINE,
        label: "Operational",
        short_label: "Operational",
    },
    {
        key: MACHINE_STATUS_TYPE.FLAGGED_FOR_REPAIR,
        label: "Flagged for Repair",
        short_label: "Flagged",
    },
    {
        key: MACHINE_STATUS_TYPE.IN_REPAIR,
        label: "In Repair",
        short_label: "In Repair",
    },
];

/**
 * Editing levels for machines
 */
export enum MACHINE_EDIT_LEVEL {
    STATIC = "static",
    BASIC = "basic",
    STATUS_FLAG_ONLY = "statusFlag",
    STATUS_ALL = "statusAll",
    FULL = "full",
}

/**
 * TMachineInstance - Information about a single instance of a machine in the space
 * @property uuid - A unique identifier for this instance
 * @property name - (optional) The name of this specific machine instance. If not set,
 *      defaults to the name of the machine and an indexing number, like "Machine 1"
 * @property status - The current status of the machine, as described by
 *      {@link MACHINE_STATUS_TYPE}
 * @property reserved - (optional) Whether the machine is currently available (not reserved),
 *      should be null if the machine is not reservable.
 * @property message - (optional) A message about the status of the machine
 */
export type TMachineInstance = {
    uuid: InstanceUUID;
    name?: string;
    status: MACHINE_STATUS_TYPE;
    reserved?: boolean;
    message?: string;
};

/**
 * TMachineStatusLog - A log about a change in status for an instance of a machine
 * @property timestamp - The timestamp this log occurred
 * @property instance_uuid - The uuid of the machine instance this status refers to
 * @property status - The updated status code
 * @property message - A relevant informational message associated with the status
 */
export type TMachineInstanceStatusLog = {
    timestamp: UnixTimestamp;
    instance_uuid: InstanceUUID;
    status: MACHINE_STATUS_TYPE;
    message?: string;
};

/**
 * TMachine - Information about a type of machine in the space
 * @property uuid - A unique id
 * @property name - The name of the machine
 * @property description - (optional) A longer description of the machine
 * @property images - (optional) A list of UUIDs of {@link TFile | File} objects
 *      that are images of this machine
 * @property count - The quantity of this machine available in the space
 * @property instances - A list of `count` machine instances with statuses.
 * @property status_logs - A list of changes in status logged by timestamp
 * @property documents - (optional) A list of {@link TDocument | Document} objects
 *      about this machine (manuals, data sheets, how-to videos, etc.)
 * @property required_certs - UUIDs of certs required to use/reserve the machine
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this machine. A user must have at least one of these
 *      roles to see the given machine in the area tab and reserve the machine.
 *      If null, this machine is public and reservable by anyone.
 *      If set as an empty list, only admins are able to see or reserve the machine.
 * @property reservable - (optional) Whether this machine is allowed to be
 *      reserved. Only users with the required certifications and at least one
 *      authorized role can reserve this machine.
 * @property reservation_type - (optional) Whether the machine should be used
 *      in the space or can be taken home once reserved. Only needs to be set if
 *      reservable is true.
 */
export type TMachine = {
    uuid: MachineUUID;
    name: string;
    description?: string;
    images?: FileUUID[];
    count: number;
    instances: TMachineInstance[];
    status_logs: TMachineInstanceStatusLog[];
    documents?: TDocument[];
    required_certifications?: TRequiredCertificate[];
    authorized_roles?: UserRoleUUID[] | null;
    reservable?: boolean;
    reservation_type?:
        | ITEM_ACCESS_TYPE.CHECKOUT_IN_SPACE
        | ITEM_ACCESS_TYPE.CHECKOUT_TAKE_HOME;
};

/**
 * TMachinePublicData - A specific subset of {@link TMachine} that is safe to
 *     expose to the public, namely removing UUID and status logs
 */
export type TPublicMachineData = Omit<TMachine, "status_logs">;
