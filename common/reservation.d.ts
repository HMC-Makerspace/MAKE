import type { AreaUUID } from "./area";
import type { UnixTimestamp, UUID } from "./global";
import type { InventoryItemUUID } from "./inventory";
import type { MachineUUID } from "./machine";
import type { UserUUID } from "./user";

export enum RESERVATION_TYPE {
    ITEM = "item",
    MACHINE = "machine",
    AREA = "area",
}

/**
 * TReservation - A reservation for an item, machine, or area in the space
 * @property uuid - A unique id for this reservation
 * @property type - The type of reservation, either item, machine, or area
 * @property reserved_uuid - The UUID of the item/machine/area being reserved
 * @property user_uuid - The UUID of the user who is making this reservation
 * @property timestamp_start - The UNIX timestamp that the reservation starts
 * @property timestamp_end - The UNIX timestamp that the reservation ends
 * @property purpose - (optional) An description of the purpose for this reservation
 */
export type TReservation = {
    uuid: UUID;
    type: RESERVATION_TYPE;
    reserved_uuid: InventoryItemUUID | MachineUUID | AreaUUID;
    user_uuid: UserUUID;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    purpose?: string;
};
