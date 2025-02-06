import { TDocument } from "./file";
import type { UnixTimestamp, UUID } from "./global";

export type CertificationUUID = UUID;

export enum CERTIFICATION_VISIBILITY {
    PUBLIC = "public",
    PRIVATE = "private",
    SCHEDULE = "schedule",
}

/**
 * TCertification - Information about a given certification
 * @property uuid - unique id
 * @property name - short name of the certification
 * @property description - (optional) what the certification gives access to
 * @property visibility - whether or not the certification is public, and should
 *     be displayed to all users, private, and only assignable by admins, or
 *     visible on the schedule
 * @property color - A hex color code to be used for displaying this certification
 * @property max_level - (optional) The maximum level that can be achieved for
 *      this certification. If not present, has no max level.
 * @property seconds_valid_for - (optional) how long the certification will last
 *      for in seconds. If not present, all certificates for this certification
 *      will never expire.
 * @property documents - (optional) A list of documents that are related to this
 *     certification, such as a training manual or a Google form link.
 * @property authorized_roles - (optional) a list of UserRole UUIDs that are
 *      allowed to see this workshop. If not present, any user may see this
 *      workshop
 */
export type TCertification = {
    uuid: CertificationUUID;
    name: string;
    description?: string;
    visibility: CERTIFICATION_VISIBILITY;
    color: string;
    max_level?: number;
    seconds_valid_for?: number;
    documents?: TDocument[];
    prerequisites?: CertificationUUID[];
    authorized_roles?: UserRoleUUID[];
};

/**
 * TCertificate - A certificate gained by a certain user
 * @property certification_uuid - The UUID of the certification that this
 *      certificate is for
 * @property level - The level of skill that this user has for the certificate
 * @property timestamp_granted - The UNIX timestamp this certificate was granted
 * @property timestamp_expires - (optional) The UNIX timestamp this certificate
 *      expires for the given user. If not present, certificate never expires.
 */
export type TCertificate = {
    certification_uuid: CertificationUUID;
    level: number;
    timestamp_granted: UnixTimestamp;
    timestamp_expires?: UnixTimestamp;
};

[
    {
        uuid: "certification-uuid-1",
        name: "Sample Certification",
        description: "A sample certification for testing purposes",
        visibility: "scheduled",
        color: "#FF0000",
        max_level: 3,
        seconds_valid_for: 31536000,
        documents: [],
        prerequisites: [],
        authorized_roles: [],
    },
];
