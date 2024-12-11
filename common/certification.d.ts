import { UUID } from "./global";

/** 
 * Certification - declaration for a machine's certification
 * @property uuid - unique id
 * @property name - short name of the cerfication
 * @property description - what the certification gives access to
 * @property seconds_valid_for - how long the certification will last for
*/
export type Certification = {
    uuid: UUID;
    name: string;
    description: string;
    seconds_valid_for: number;
}