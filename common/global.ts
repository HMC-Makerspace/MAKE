/**
 * A generic UUID string
 */
export type UUID = string;

/**
 * A generic Unix timestamp as a number
 */
export type UnixTimestamp = number;

/**
 * API_SCOPES - an enum of all possible API scopes
 */
export enum API_SCOPES {
    ADMIN = "admin",
    CHECKOUT = "checkout",
    PRINTER = "3dprinter",
    INVENTORY = "inventory",
    INVENTORY_EDITOR = "inventory_editor",
    ALL_USERS = "users",
}
