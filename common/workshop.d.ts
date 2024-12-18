import type { UnixTimestamp } from "./global";
import type { CertificationUUID, TCertification } from "./certification";
import type { UserUUID } from "./user";
import type { FileUUID } from "./file";

/**
 * Workshop - Object to store information about all workshops
 * @property uuid - the unique identifier of the workshop
 * @property title - the name of the workshop
 * @property description (optional) - description of the workshop's activity
 * @property instructors - the list of instructors teaching the workshop, as
 *      user UUIDs
 * @property support_instructors - (optional) the list additional workers
 *      facilitating this workshop, as User UUIDs
 * @property timestamp_start - the time that the workshop starts
 * @property timestamp_end - the time that the workshop ends
 * @property timestamp_public - the time this workshop becomes publicly visible
 * @property capacity (optional) - the number of users the instructors can
 *      teach. If not listed, has no max capacity
 * @property required_certs - the UUIDs of {@link TCertification | Certifications}
 *      needed to participate in the workshop
 * @property rsvp_list - a map of RSVP'd user UUIDs to the timestamp that they
 *      signed up for the workshop
 * @property users_notified - a list of users who have been notified about the
 *      workshop
 * @property photos - (optional) a list UUIDs of {@link TFile | image Files} to
 *      display for this workshop
 */
export type TWorkshop = {
    uuid: UUID;
    title: string;
    description?: string;
    instructors: UserUUID[];
    support_instructors?: UserUUID[];
    capacity?: number;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    timestamp_public: UnixTimestamp;
    required_certifications?: CertificationUUID[];
    rsvp_list: {
        [user: UserUUID]: UnixTimestamp;
    };
    users_notified: UserUUID[];
    sign_in_list: UserUUID[];
    photos?: FileUUID[];
};
