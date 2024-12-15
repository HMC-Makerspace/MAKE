import { UnixTimestamp } from "./global";

/**
 * Checkout - Object to store information about all checkouts
 * @property uuid -  the unique identifier for each checkout
 * @property items - a list of the uuids of each item being checked out (contained in a dictionary uuid:quantity)
 * @property checked_out_by - the uuid of the user who checked out the item
 * @property timestamp_out - the timestamp of when the item was checked out
 * @property timestamp_due - the timestamp of when the item is due
 * @property timestamp_in - the timestamp of when the item was checked in
 */
export type TCheckout = {
    uuid: UUID;
    items: {
        [item: UUID]: number;
    };
    checked_out_by: UUID;
    timestamp_out: UnixTimestamp;
    timestamp_due: UnixTimestamp;
    timestamp_in: UnixTimestamp;
};