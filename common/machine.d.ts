import { UUID } from "./global";

/**
 * TMachine - Information about a machine in the space
 * @prop uuid - A unique id
 * @prop name - The name of the machine
 * @prop description - A longer description of what the machine is/does
 * @prop image - A link to an image of the machine, relative to the `server/`
 *               directory
 * @prop count - The number of this machine available in the space
 * @prop online - The total number of online/working machines of this type
 * @prop manual_link - The link to a manual/documentation for this machine
 */
export type TMachine = {
    uuid: UUID;
    name: string;
    description?: string;
    image?: string;
    count: number;
    online: number;
    manual_link?: string;
};
