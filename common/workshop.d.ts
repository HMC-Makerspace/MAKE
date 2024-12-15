import { UnixTimestamp } from "./global";

/**
 * Workshop - Object to store information about all workshops
 * @property uuid - the unique identifier of the workshop
 * @property title - the name of the workshop
 * @property description - description of the workshop will be teaching
 * @property instructors - the list of instuctors teaching the workshop
 * @property timestamp_start - the time that the workshop starts
 * @property timestamp_end - the time that the workshop ends
 * @property capacity - the number of users the instructors can teach
 * @property required_certs - the google form identifier for quizzes that give the certifications needed to participate in the workshop
 * @property rsvp_list - a list of user's unique identifier who are rsvp'd for the workshop
 * @property users_notified - a list of rsvp'd users who has been emailed by MAKE-bot;
 * @property photos - a list of links to the photos taken during the workshop
 */
export type TWorkshop = {
    uuid: UUID;
    title: string;
    description: string;
    instructors: string;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    capacity: number;
    required_certs: gid[];
    rsvp_list: UUID[];
    users_notified: UUID[];
    photos: string[];
};