import type { UnixTimestamp } from "./global";
import type { InventoryItemUUID, TInventoryItem } from "./inventory";
import type { UserUUID } from "./user";

/**
 * TCheckoutItem - Information about a single item in a checkout
 * @property item_uuid - The UUID of the {@link TInventoryItem | InventoryItem}
 *      being checked out
 * @property quantity - The quantity of the item being checked out
 * @property location_index - The index of the location this item is being
 *      checked out from, based on the
 *      {@link TInventoryItem.locations | InventoryItem's `locations`} list
 */
export type TCheckoutItem = {
    item_uuid: InventoryItemUUID;
    quantity: number;
    location_index: number;
};

/**
 * Checkout - Object to store information about a single checkouts
 * @property uuid -  the unique identifier for each checkout
 * @property items - a list of {@link TCheckoutItem | CheckoutItems} in this
 *      checkout.
 * @property checked_out_by - the uuid of the user who checked out the item
 * @property timestamp_out - the timestamp of when the item was checked out
 * @property timestamp_due - the timestamp of when the item is due
 * @property timestamp_in - (optional) the timestamp of when the item was
 *      checked in. If not present, item has not been checked in yet
 * @property notifications_sent - The number of overdue checkout reminder
 *      notifications sent to the user
 */
export type TCheckout = {
    uuid: UUID;
    items: TCheckoutItem[];
    checked_out_by: UserUUID;
    timestamp_out: UnixTimestamp;
    timestamp_due: UnixTimestamp;
    timestamp_in?: UnixTimestamp;
    notifications_sent: number;
};
