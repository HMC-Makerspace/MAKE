import type { CertificationUUID } from "./certification";
import type { UnixTimestamp, UUID } from "./global";
import type { UserRoleUUID, UserUUID } from "./user";

export type InventoryItemUUID = UUID;

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
export type TInventoryItemLocation = {
    room: string;
    container?: string;
    specific?: string;
    quantity: ITEM_RELATIVE_QUANTITY | number;
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
 * ITEM_ACCESS_TYPE - describes use capability (use inside or outside of the space,
 *                    checkout needed or no checkout needed)
 * @member USE_IN_SPACE - can use in the space without checkout
 * @member CHECKOUT_IN_SPACE - can check out, use in the space
 * @member CHECKOUT_TAKE_HOME - can check out and take home
 * @member TAKE_HOME - can take home freely without needing to checkout
 */
export enum ITEM_ACCESS_TYPE {
    USE_IN_SPACE = 0,
    CHECKOUT_IN_SPACE,
    CHECKOUT_TAKE_HOME,
    TAKE_HOME,
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
 * @property required_certs - UUIDs of certs required to use item
 * @property required_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this item. This list is A user must have at least one of
 *      these roles to checkout the given item. If not present, any user may
 *      checkout this item.
 */
export type TInventoryItem = {
    uuid: InventoryItemUUID;
    name: string;
    long_name?: string;
    role: ITEM_ROLE;
    access_type: ITEM_ACCESS_TYPE;
    locations: TLocation[];
    reorder_url?: string;
    serial_number?: string;
    kit_contents?: InventoryItemUUID[];
    keywords?: string;
    required_certifications?: CertificationUUID[];
    required_roles?: UserRoleUUID[];
};

/**
 * RESTOCK_REQUEST_STATUS - The status of an individual restock request
 * @member PENDING_APPROVAL - the request has been submitted but not yet seen
 *      for approval
 * @member DENIED - the request has been denied
 * @member APPROVED_WAITING - The request has been approved but not yet
 *      purchased (do to being out of stock, or otherwise)
 * @member APPROVED_ORDERED - The request has been approved and the item has
 *      been ordered but has not yet arrived
 * @member RESTOCKED - The item has arrived and been restocked
 */
export enum RESTOCK_REQUEST_STATUS {
    PENDING_APPROVAL,
    DENIED,
    APPROVED_WAITING,
    APPROVED_ORDERED,
    RESTOCKED,
}

/**
 * TRestockRequestStatusLog - A log of info about a restock request's status
 * @property status - The updated status of the restock request
 * @property timestamp - The timestamp this update was logged
 * @property message - (optional) A message to display to the requesting user
 */
export type TRestockRequestStatusLog = {
    timestamp: UnixTimestamp;
    status: RESTOCK_REQUEST_STATUS;
    message?: string;
};

/**
 * TRestockRequest - A request to restock a given item
 * @property uuid - a unique identifier for this request
 * @property item - a UUID of the item to be restocked
 * @property current_quantity - The current quantity of the item when the
 *      request was submitted
 * @property quantity_requested - (optional) The requested quantity to purchase
 * @property reason - (optional) A description for why this item needs to
 *      be restocked
 * @property requesting_user - The UUID of the user who created this request
 * @property current_status - The current status of this request, as described
 *      by {@link RESTOCK_REQUEST_STATUS}
 * @property status_logs - A list of status logs for this request, as a list
 *      of {@link TRestockRequestStatusLog | `RestockRequestStatusLog`}
 */
export type TRestockRequest = {
    uuid: UUID;
    item_uuid: InventoryItemUUID;
    current_quantity: ITEM_RELATIVE_QUANTITY | number;
    quantity_requested?: number;
    reason?: string;
    requesting_user: UserUUID;
    current_status: RESTOCK_REQUEST_STATUS;
    status_logs: TRestockRequestStatusLog[];
};
