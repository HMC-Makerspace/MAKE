import type { FileUUID, TFile } from "./file";
import type { UUID } from "./global";

export type MachineUUID = UUID;

export type AreaUUID = UUID;

/**
 * TAreaDocument - A document specific to an area in the space
 * @property name - The name of the document
 * @property link - The link to the document
 */
export type TDocument = {
    name: string;
    link: string;
};

/**
 * TMachine - Information about a machine in the space
 * @property uuid - A unique id
 * @property name - The name of the machine
 * @property description - (optional) A longer description of the machine
 * @property images - A list of UUIDs of {@link TFile | File} objects that are
 *      images of this machine
 * @property count - The quantity of this machine available in the space
 * @property online - (optional) The total number of working machines of this type
 * @property documents - (optional) A list of {@link TDocument | Document} objects
 *      about this machine (manuals, data sheets, how-to videos, etc.)
 */
export type TMachine = {
    uuid: MachineUUID;
    name: string;
    description?: string;
    images: FileUUID[];
    count: number;
    online?: number;
    documents?: TDocument[];
};

/**
 * TArea - Information about an area in the space
 * @property uuid - A unique id
 * @property name - The name of the area/location
 * @property description - (optional) A longer description of what the area is
 *      for or what it contains
 * @property documents - (optional) A list of documents related to policies or
 *      information about the area
 * @property equipment - (optional) A list of {@link TMachine | machine } UUIDs
 *      that are available in this area
 */
export type TArea = {
    uuid: AreaUUID;
    name: string;
    description?: string;
    documents?: TDocument[];
    equipment?: MachineUUID[];
};
