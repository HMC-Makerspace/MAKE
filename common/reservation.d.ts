import { UnixTimestamp, UUID } from "./global";

export enum RESERVATION_TYPE {
    ITEM = "item",
    MACHINE = "machine",
    AREA = "area",
}

/**
 * TReservation - A reservation for an item, machine, or area in the space
 * @prop uuid - A unique id
 * @prop type - The type of reservation, either item, machine, or area
 * @prop reserved_uuid - The UUID of the item/machine/area being reserved
 * @prop timestamp_start - The UNIX timestamp that the reservation starts
 * @prop timestamp_end - The UNIX timestamp that the reservation ends
 * @prop purpose - An optional description of the purpose of this reservation
 */
export type TReservation = {
    uuid: UUID;
    type: RESERVATION_TYPE;
    reserved_uuid: UUID;
    timestamp_start: UnixTimestamp;
    timestamp_end: UnixTimestamp;
    purpose?: string;
};
