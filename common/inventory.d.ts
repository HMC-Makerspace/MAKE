import { UUID } from "./global"

/** 
 * Location - Location of an inventory item
 * @property room - in which item is stored
 * @property quantity - of item stored in this location
 * @property container - (optional) subsection of room
 * @property specific - specific section of container
*/
export type Location = {
    room: string,
    quantity: number,
    container?: string,
    specific?:string,
}

/**
 * Item Role - describes if item is tool, material, or kit
 * @member Tool - scissors, pens, etc.
 * @member Material - paper, cloth, etc.
 * @member Kit - a collection of multiple items
 */
export enum ITEM_ROLE {
    TOOL = "T",
    MATERIAL = "M",
    KIT = "K"
}

/**
 * Item Access Type - describes use capability (inside or outside of the makerspace, checkout needed or no checkout needed)
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
    STAFF_ONLY
}

/** 
 * InventoryItem - Unique object for item
 * @property uuid - unique id
 * @property name - short name
 * @property long_name - (optional) contains brand, exact type, etc. 
 * @property role - tool, material, or kit
 * @property access_type - see access type documentation
 * @property locations - see location documentation
 * @property reorder_url - (optional) url for reordering item
 * @property serial_number - (optional) serial number of item
 * @property kit_contents - (optional) if kit, lists all components of kit
 * @property keywords - (optional) keywords associated with item
 * @property certifications - (optional) certifications required to use item
*/
export type InventoryItem = {
    uuid: UUID,
    name: string,
    long_name?: string,
    role: ITEM_ROLE, 
    access_type: ITEM_ACCESS_TYPE,
    locations: Location[],
    reorder_url?: string,
    serial_number?: string,
    kit_contents?: string[]
    keywords?: string,
    certifications?: string[]
}

    
/** 
 * RestockRequest - object with details of restock request
 * @property uuid - unique id of item requested for restock
 * @property item - item's short name
 * @property quantity - quantity requested to order 
 * @property reason - person's reason for reorder request
 * @property user_uuid - (optional) the uuid of user requesting restock
 * @property authorized_request - if request is authorized -----> not sure about this one
 * @property timestamp_sent - timestamp at time of restock request submission
 * @property timestamp_completed - (optional) timestamp at time of restock request completion
 * @property is_approved - (optional) if restock request is approved
 * @property completion_note - (optional) note regarding the completion of the restock
*/
export type RestockRequest = {
    uuid: UUID,
    item: InventoryItem["name"], //-----> not sure about this, maybe should just be string
    quantity: string,
    reason: string,
    user_uuid?: UUID,
    authorized_request: Boolean,
    timestamp_sent: number,
    timestamp_completed?: number,
    is_approved?: Boolean,
    completion_note?: string,
}
