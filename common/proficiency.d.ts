import { UUID } from "./global";

/**
 * TProficiency - Description of a Makerspace machine's proficiency
 * @property uuid - unique id
 * @property name - short name of the certification
 * @property description - what the certification gives access to
 */
export type TProficiency = {
    uuid: UUID;
    name: string;
    description: string;
};

/**
 * PROFICIENCY_LEVEL - How proficient a steward is in a given topic
 * @member BASIC - a basic level of proficiency, able to help with machine
 *                 setup and troubleshoot common problems
 * @member ADVANCED - An advanced level of proficiency, able to assist with
 *                    complex projects and intricate errors.
 */
export enum PROFICIENCY_LEVEL {
    BASIC = 1,
    ADVANCED = 2,
}
