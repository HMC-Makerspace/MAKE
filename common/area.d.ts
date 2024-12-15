import { UUID } from "./global";

/**
 * TAreaDocument - A document specific to an area in the space
 * @prop name - The name of the document
 * @prop link - The link to the document
 */
export type TAreaDocument = {
    name: string;
    link: string;
};

/**
 * TArea - Information about an area in the space
 * @prop uuid - A unique id
 * @prop name - The name of the area/location
 * @prop description - A longer description of what the area is for/contains
 * @prop documents - A list of documents for policy/information about the area
 * @prop equipment - A list of machine UUIDs that are available in this area
 */
export type TArea = {
    uuid: UUID;
    name: string;
    description?: string;
    documents?: TAreaDocument[];
    equipment?: UUID[];
};
