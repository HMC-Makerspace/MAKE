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
    GET_ALL_CHECKOUTS = "get_checkouts",
    PRINTER = "3dprinter",
    INVENTORY = "inventory",
    INVENTORY_EDITOR = "inventory_editor",
    GET_ALL_USERS = "get_users",
    UPDATE_USER = "update_user",
    UPDATE_USER_SELF = "update_self",
    DELETE_USER = "delete_user",
    DELETE_USER_SELF = "delete_self",
}
