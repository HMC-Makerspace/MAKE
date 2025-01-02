import { UUID } from "crypto";
import { InventoryItemUUID, ItemQuantity } from "./inventory";
import { UserUUID } from "./user";
import { UnixTimestamp } from "./global";

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
    PENDING_APPROVAL = 0,
    APPROVED_WAITING,
    APPROVED_ORDERED,
    RESTOCKED,
    DENIED,
}

/**
 * TRestockRequestStatusLog - A log of info about a restock request's status
 * @property status - The updated status of the restock request
 * @property timestamp - The timestamp this update was logged
 * @property message - (optional) A message to display to the requesting user
 */
export type TRestockRequestLog = {
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
 *      of {@link TRestockRequestLog | `RestockRequestStatusLog`}
 */
export type TRestockRequest = {
    uuid: UUID;
    item_uuid: InventoryItemUUID;
    current_quantity: ItemQuantity;
    quantity_requested?: number;
    reason?: string;
    requesting_user: UserUUID;
    current_status: RESTOCK_REQUEST_STATUS;
    status_logs: TRestockRequestLog[];
};
