import { UUID } from "./global";

/**
 * ITEM_RELATIVE_QUANTITY - The relative (high/low) of an item
 */
enum ITEM_RELATIVE_QUANTITY {
    LOW = -1,
    HIGH = -2,
}

/**
 * TLocation - Location of an inventory item
 * @property room - in which item is stored
 * @property quantity - of item stored in this location
 * @property container - (optional) subsection of room
 * @property specific - specific section of container
 */
export type TLocation = {
    room: string;
    quantity: ITEM_RELATIVE_QUANTITY | number;
    container?: string;
    specific?: string;
};

/**
 * ITEM_ROLE - describes if item is tool, material, or kit
 * @member Tool - scissors, pens, etc.
 * @member Material - paper, cloth, etc.
 * @member Kit - a collection of multiple items
 */
export enum ITEM_ROLE {
    TOOL = "T",
    MATERIAL = "M",
    KIT = "K",
}

/**
 * ITEM_ACCESS_TYPE - describes use capability (inside or outside of the makerspace,
 *                    checkout needed or no checkout needed)
 * @member USE_IN_SPACE - cannot check out, use in the makerspace
 * @member CHECKOUT_IN_SPACE - can check out, use in the makerspace
 * @member CHECKOUT_TAKE_HOME - can check out and take home
 * @member TAKE_HOME - can take home
 * @member CERT_REQUIRED - needs approval to check out (welders, loom computer, cameras, etc.)
 * @member STAFF_ONLY - only staff can use
 */
export enum ITEM_ACCESS_TYPE {
    USE_IN_SPACE,
    CHECKOUT_IN_SPACE,
    CHECKOUT_TAKE_HOME,
    TAKE_HOME,
    CERT_REQUIRED,
    STAFF_ONLY,
}

/**
 * TInventoryItem - Unique object for item
 * @property uuid - unique id
 * @property name - short name of the item
 * @property long_name - (optional) contains brand, exact type, etc.
 * @property role - One of T (for Tool), M (for Material), or K (for Kit)
 * @property access_type - See {@link ITEM_ACCESS_TYPE} documentation
 * @property locations - See {@link TLocation} documentation
 * @property reorder_url - (optional) url for reordering item
 * @property serial_number - (optional) serial number of item
 * @property kit_contents - (optional) if kit, lists all item UUIDs in this kit
 * @property keywords - (optional) keywords associated with item
 * @property certifications - (optional) UUIDs of certs required to use item
 */
export type TInventoryItem = {
    uuid: UUID;
    name: string;
    long_name?: string;
    role: ITEM_ROLE;
    access_type: ITEM_ACCESS_TYPE;
    locations: TLocation[];
    reorder_url?: string;
    serial_number?: string;
    kit_contents?: UUID[];
    keywords?: string;
    certifications?: string[];
};

/**
 * TRestockRequest - object with details of restock request
 * @property uuid - unique id of item requested for restock
 * @property item - item's short name
 * @property quantity - quantity requested to order
 * @property reason - person's reason for reorder request
 * @property user_uuid - (optional) the uuid of user requesting restock
 * @property authorized_request - if request is from an authorized source
 *                                (e.g. checkout computer)
 * @property timestamp_sent - UNIX timestamp of when request was submitted
 * @property timestamp_completed - (optional) UNIX timestamp of completion
 * @property is_approved - (optional) if restock request is approved
 * @property completion_note - (optional) Note about completion of the restock
 */
export type TRestockRequestOLD = {
    uuid: UUID;
    item: string;
    quantity: string;
    reason: string;
    user_uuid?: UUID;
    authorized_request: boolean;
    timestamp_sent: number;
    timestamp_completed?: number;
    is_approved?: boolean;
    completion_note?: string;
};
