import { QUIZ_IDS, PROFICIENCIES } from "./config";

/**
 * @typedef {Object} User - All relevant user information
 * @property {string} uuid - The user's unique identifier for the database
 * @property {string} name
 */
export type User = {
    uuid: string;
    name: string;
    email: string;
    cx_id: number;
    role: "user" | "steward" | "head_steward" | "admin";
    passed_quizzes: {
        [quiz_id in (typeof QUIZ_IDS)[number]]: string;
    };
    proficiencies?: (typeof PROFICIENCIES)[number][];
};
