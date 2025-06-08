import { CertificationUUID } from "./certification";
import { FileUUID, TDocument } from "./file";
import { UnixTimestamp, UUID } from "./global";
import { UserRoleUUID } from "./user";

export type MachineUUID = UUID;

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
        label: "Offline",
        short_label: "Offline",
    },
    {
        key: MACHINE_STATUS_TYPE.ONLINE,
        label: "Online",
        short_label: "Online",
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
 * TMachineStatus - The status of a single machine in the space
 * @property status - The current status of the machine, as described by
 *      {@link MACHINE_STATUS_TYPE}
 * @property available - Whether the machine is currently available (not reserved)
 * @property message - (optional) A message about the status of the machine
 */
export type TMachineStatus = {
    status: MACHINE_STATUS_TYPE;
    available: boolean;
    message?: string;
};

/**
 * TMachineStatusLog - A log about a change in status for type of machine
 * @property timestamp - The timestamp this log occurred
 * @property statuses - The status of each of the machines
 */
export type TMachineStatusLog = {
    timestamp: UnixTimestamp;
    statuses: TMachineStatus[];
};

/**
 * TMachine - Information about a type of machine in the space
 * @property uuid - A unique id
 * @property name - The name of the machine
 * @property description - (optional) A longer description of the machine
 * @property images - (optional) A list of UUIDs of {@link TFile | File} objects
 *      that are images of this machine
 * @property count - The quantity of this machine available in the space
 * @property current_statuses - A list of status objects indicating the current
 *      status of each of the `count` machines in the space
 * @property status_logs - A list of changes in status logged by timestamp
 * @property documents - (optional) A list of {@link TDocument | Document} objects
 *      about this machine (manuals, data sheets, how-to videos, etc.)
 * @property required_certs - UUIDs of certs required to use/reserve the machine
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this machine. A user must have at least one of these
 *      roles to see the given machine in the area tab. If not present, this
 *      machine is public.
 * @property reservable - (optional) Whether this machine is allowed to be
 *      reserved. Only users with the required certifications and at least one
 *      authorized role can reserve this machine.
 */
export type TMachine = {
    uuid: MachineUUID;
    name: string;
    description?: string;
    images?: FileUUID[];
    count: number;
    current_statuses: TMachineStatus[];
    status_logs: TMachineStatusLog[];
    documents?: TDocument[];
    required_certifications?: CertificationUUID[];
    authorized_roles?: UserRoleUUID[];
    reservable?: boolean;
};

/**
 * TMachinePublicData - A specific subset of {@link TMachine} that is safe to
 *     expose to the public, namely removing UUID and status logs
 */
export type TPublicMachineData = Omit<TMachine, "status_logs">;