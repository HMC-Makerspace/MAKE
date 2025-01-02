import type { TCertificate } from "./certification";
import type { FileUUID, TFile } from "./file";
import type { API_SCOPE, UnixTimestamp, UUID } from "./global";
import type { SHIFT_DAY } from "./shift";

export type UserUUID = UUID;

export type UserRoleUUID = UUID;

/**
 * TUserRole - A role category for users
 * @property uuid - The unique identifier for this user role
 * @property title - The title of this user role
 * @property description - (optional) A description of what this role is
 * @property color - A hex color code that can be used to display this role
 * @property scopes - A list of {@link API_SCOPE} that users with this role
 *      are allowed to access. Note, users can have multiple roles
 * @property default - A flag for if this is a default role to apply to all
 *      new users
 */
export type TUserRole = {
    uuid: UserRoleUUID;
    title: string;
    description?: string;
    color: string;
    scopes: API_SCOPE[];
    default: boolean;
};

/**
 * TUserRoleLog - A log of when user acquired/lost a {@link TUserRole | UserRole}
 * @property role_uuid - The UUID of a {@link TUserRole | UserRole} that the
 *      user received
 * @property timestamp_gained - the timestamp of when the user gained this role
 * @property timestamp_revoked - (optional) the timestamp of when the user lost
 *      this role. If not present, the user actively has this role.
 */
export type TUserRoleLog = {
    role_uuid: UserRoleUUID;
    timestamp_gained: UnixTimestamp;
    timestamp_revoked?: UnixTimestamp;
};

/**
 * TUserAvailabilityTimeSlot - An individual time slot of a user's availability
 * @property sec_start - The time (in seconds after midnight) this time
 *      slot starts.
 * @property sec_end - The time (in seconds after midnight) this time
 *      slot ends.
 */
export type TUserAvailabilityTime = {
    sec_start: number;
    sec_end: number;
};

/**
 * TUserAvailability - The availability of a User, used for scheduling
 * @property day - The 0-indexed day associated with this availability,
 *      according to {@link SHIFT_DAY}
 * @property availability - A list of pairs of start and end times (in
 *      seconds after midnight) that this user is available on this day
 */
export type TUserAvailability = {
    day: SHIFT_DAY;
    availability: TUserAvailabilityTime[];
};

/**
 * TUser - Information about a user of the space
 * @property uuid - The user's unique identifier for the database
 * @property name - The user's preferred name
 * @property email - The user's student email
 * @property college_id - The user's student ID number as a string
 * @property active_roles - A list of {@link TUserRoleLog | UserRole logs} that
 *      indicates currently active roles for this user
 * @property past_roles - A list of {@link TUserRoleLog | UserRole logs} that
 *      indicates past roles that this user had
 * @property certificates - A list of {@link TCertificate | Certificates} that
 *      this user holds.
 * @property files - The UUIDs of the user's currently uploaded
 *      {@link TFile | Files}
 * @property availability - (optional) A list of availabilities for each day
 *      that the space is open. Only used for hiring. If the user has never
 *      been a worker at the space, this property will not be present
 */
export type TUser = {
    uuid: UserUUID;
    name: string;
    email: string;
    college_id: string;
    active_roles: TUserRoleLog[];
    past_roles: TUserRoleLog[];
    certificates?: TCertificate[];
    files?: FileUUID[];
    availability?: TUserAvailability[];
};
