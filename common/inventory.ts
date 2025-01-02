import { AreaUUID } from "./area";
import type { CertificationUUID } from "./certification";
import type { UUID } from "./global";
import type { UserRoleUUID } from "./user";

export type InventoryItemUUID = UUID;

/**
 * ITEM_RELATIVE_QUANTITY - The relative (high/low) of an item
 */
enum ITEM_RELATIVE_QUANTITY {
    LOW = -1,
    HIGH = -2,
}

export type ItemQuantity = ITEM_RELATIVE_QUANTITY | number;

/**
 * TLocation - Location of an inventory item
 * @property room - The UUID of an area where the item is stored
 * @property quantity - of item stored in this location
 * @property container - (optional) subsection of room
 * @property specific - specific section of container
 */
export type TInventoryItemLocation = {
    room: AreaUUID;
    container?: string;
    specific?: string;
    quantity: ItemQuantity;
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
 * TItemCertificate: The specification for a certification required to use an item
 * @property certification_uuid - The UUID of the required certification
 * @property required_level - The minimum cert level needed to use this item
 */
export type TItemCertificate = {
    certification_uuid: CertificationUUID;
    required_level: number;
};

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
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this item. A user must have at least one of
 *      these roles to checkout the given item. If not present, any user may
 *      checkout this item.
 */
export type TInventoryItem = {
    uuid: InventoryItemUUID;
    name: string;
    long_name?: string;
    role: ITEM_ROLE;
    access_type: ITEM_ACCESS_TYPE;
    locations: TInventoryItemLocation[];
    reorder_url?: string;
    serial_number?: string;
    kit_contents?: InventoryItemUUID[];
    keywords?: string[];
    required_certifications?: TItemCertificate[];
    authorized_roles?: UserRoleUUID[];
};
