import { UnixTimestamp, UUID } from "./global";

/**
 * TCertification - Information about a given certification
 * @property uuid - unique id
 * @property name - short name of the cerfication
 * @property description - what the certification gives access to
 * @property seconds_valid_for - how long the certification will last for
 */
export type TCertification = {
    uuid: UUID;
    name: string;
    description: string;
    seconds_valid_for: number;
};

/**
 * TCertificate - A certificate gained by a certain user
 * @prop cert_uuid - The UUID of the certification that this certificate is for
 * @prop level - The level of skill that this user has for the certificate
 * @prop timestamp_granted - The UNIX timestamp this certificate was granted
 * @prop timestamp_expires - The UNIX timestamp this certificate expires
 */
export type TCertificate = {
    cert_uuid: UUID;
    level: number;
    timestamp_granted: UnixTimestamp;
    timestamp_expires: UnixTimestamp;
};
