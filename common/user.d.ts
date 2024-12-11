import { QUIZ_IDS, PROFICIENCIES } from "./config";

/**
 * USER_ROLE - A given Makerspace user's role
 * @member USER - A standard user
 * @member STEWARD - A Makerspace steward
 * @member HEAD_STEWARD - A head Makerspace steward
 * @member ADMIN - A Makerspace admin (manager or director)
 */
export enum USER_ROLE {
    USER = "user",
    STEWARD = "steward",
    HEAD_STEWARD = "head_steward",
    ADMIN = "admin",
}

/**
 * USER_DEPARTMENT - The given user's departmental association
 * @member WEBSITE - A website/IT developer
 * @member REPAIR - A repair/maintenance steward
 * @member WORKSHOPS - A workshops liaison
 * @member OUTREACH - An outreach lead
 * @member LOGISTICS - A coordination/logistics steward
 * @member INVENTORY - An inventory management steward
 * @member GRANT - A grant coordination steward
 * @member LOOM - A loom training/maintenance steward
 */
export enum USER_DEPARTMENT {
    WEBSITE = "website",
    REPAIR = "repair",
    WORKSHOPS = "workshops",
    OUTREACH = "outreach",
    LOGISTICS = "logistics",
    INVENTORY = "inventory",
    GRANT = "grant",
    LOOM = "loom",
}

// TODO: Setup with real user file information
export type TUserFile = Object;

/**
 * All relevant user information
 * @prop uuid - The user's unique identifier for the database
 * @prop name - The user's preferred name
 * @prop email - The user's student email
 * @prop cx_id - The user's student ID number
 * @prop role - The user's role at the Makerspace
 * @prop passed_quizzes - The dictionary of passed user quizzes, which maps
 *  Google Form quiz ids to UNIX timestamps
 * @prop proficiencies - The list of proficiencies that this user has, which is
 *                       a list of strings in the {@link PROFICIENCIES} dict.
 * @prop files - The current list of the user's uploaded {@link TUserFile}
 * @prop availability - A 2D array of this steward's availability
 * @prop
 */
export type TUser = {
    uuid: string;
    name: string;
    email: string;
    cx_id: number;
    role: USER_ROLE;
    department: USER_DEPARTMENT;
    passed_quizzes: {
        [quiz_id in (typeof QUIZ_IDS)[number]]: number;
    };
    proficiencies?: (typeof PROFICIENCIES)[number][];
    files?: TUserFile[];
    availability?: boolean[][];
    certifications?: { [key: string]: number };
    new_steward?: boolean;
};
