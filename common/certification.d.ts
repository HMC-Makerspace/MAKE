import type { UnixTimestamp, UUID } from "./global";

export type CertificationUUID = UUID;

export type CertificationTypeUUID = UUID;

/**
 * TCertificationType - A description of a type or style of certification
 * @property uuid - The index of this certification type
 * @property name - The name of this certification type
 * @property description - (optional) A description of what this certification type is
 */
export type TCertificationType = {
    uuid: CertificationTypeUUID;
    name: string;
    description?: string;
};

/**
 * TCertification - Information about a given certification
 * @property uuid - unique id
 * @property name - short name of the certification
 * @property description - (optional) what the certification gives access to
 * @property type - The UUID of a {@link TCertificationType | CertificationType}
 *      that indicates the type of this cert
 * @property color - A hex color code to be used for displaying this certification
 * @property max_level - (optional) The maximum level that can be achieved for
 *      this certification. If not present, has no max level.
 * @property seconds_valid_for - (optional) how long the certification will last
 *      for in seconds. If not present, all certificates for this certification
 *      will never expire.
 */
export type TCertification = {
    uuid: CertificationUUID;
    name: string;
    description?: string;
    type: CertificationTypeUUID;
    color: string;
    max_level?: number;
    seconds_valid_for?: number;
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
