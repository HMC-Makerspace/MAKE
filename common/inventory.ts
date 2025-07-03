import { AreaUUID } from "./area";
import type { CertificationUUID, TRequiredCertificate } from "./certification";
import type { UUID } from "./global";
import type { UserRoleUUID } from "./user";

export type InventoryItemUUID = UUID;

/**
 * ITEM_RELATIVE_QUANTITY - The relative (high/low) of an item
 */
export enum ITEM_RELATIVE_QUANTITY {
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
    area: AreaUUID;
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
    TOOL = "tool",
    MATERIAL = "material",
    KIT = "kit",
    MACHINE = "machine",
    AREA = "area",
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
    USE_IN_SPACE = 1,
    CHECKOUT_IN_SPACE,
    CHECKOUT_TAKE_HOME,
    TAKE_HOME,
}

/**
 * ITEM_ACCESS_DESCRIPTORS: Descriptions of the above item access types
 */
export const ITEM_ACCESS_DESCRIPTORS: {
    type: ITEM_ACCESS_TYPE;
    label: string;
    description: string;
}[] = [
    {
        type: ITEM_ACCESS_TYPE.TAKE_HOME,
        label: "Take Home",
        description: "Free to use in space or take home without checking out",
    },
    {
        type: ITEM_ACCESS_TYPE.USE_IN_SPACE,
        label: "Use In Space",
        description: "Free to use in the space without checking out",
    },
    {
        type: ITEM_ACCESS_TYPE.CHECKOUT_TAKE_HOME,
        label: "Checkout, Take Home",
        description: "Requires a checkout, but can be used or taken home",
    },
    {
        type: ITEM_ACCESS_TYPE.CHECKOUT_IN_SPACE,
        label: "Checkout, Use In Space",
        description: "Requires a checkout, and can only be used in the space",
    },
];

/**
 * TInventoryItem - Unique object for item
 * @property uuid - unique id
 * @property name - short name of the item
 * @property long_name - (optional) contains brand, exact type, etc.
 * @property role - One of T (for Tool), M (for Material), or K (for Kit)
 * @property access_type - See {@link ITEM_ACCESS_TYPE} documentation
 * @property quantity - The quantity of the item in the space
 * @property available - (optional) The current available quantity
 *      after accounting for checkouts/reservations (only applicable to items
 *      with a number quantity, not relative quantity)
 * @property locations - See {@link TLocation} documentation
 * @property reorder_url - (optional) url for reordering item
 * @property serial_number - (optional) serial number of item
 * @property kit_contents - (optional) if kit, lists all item UUIDs in this kit
 * @property keywords - (optional) keywords associated with item
 * @property required_certs - UUIDs of certs required to use item
 * @property authorized_roles - (optional) A list of UserRole UUIDs that are
 *      allowed to use this item. A user must have at least one of
 *      these roles to checkout the given item. If null, any user may
 *      checkout this item.
 */
export type TInventoryItem = {
    uuid: InventoryItemUUID;
    name: string;
    long_name?: string;
    role: ITEM_ROLE;
    linked_uuid?: UUID;
    access_type: ITEM_ACCESS_TYPE;
    quantity: ItemQuantity;
    available?: number;
    locations: TInventoryItemLocation[];
    reorder_url?: string;
    serial_number?: string;
    keywords?: string[];
    required_certifications?: TRequiredCertificate[];
    authorized_roles?: UserRoleUUID[] | null;
};
