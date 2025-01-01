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
export enum API_SCOPE {
    ADMIN = "admin",
    // Checkout scopes
    GET_ALL_CHECKOUTS = "get_checkouts",
    GET_ONE_CHECKOUT = "get_checkout",
    GET_CHECKOUTS_FOR_USER = "get_user_checkouts",
    GET_OWN_CHECKOUTS = "get_own_checkouts",
    CREATE_CHECKOUT = "create_checkout",
    UPDATE_CHECKOUT = "update_checkout",
    DELETE_CHECKOUT = "delete_checkout",
    // 3D
    PRINTER = "3dprinter",
    // Inventory scopes
    INVENTORY = "inventory",
    INVENTORY_EDITOR = "inventory_editor",
    // User scopes
    GET_ALL_USERS = "get_users",
    UPDATE_USER = "update_user",
    UPDATE_USER_SELF = "update_self",
    CREATE_USER = "create_user",
    DELETE_USER = "delete_user",
    DELETE_USER_SELF = "delete_self",
    GET_ALL_ROLES = "get_roles",
    UPDATE_ROLE = "update_role",
    CREATE_ROLE = "create_role",
    DELETE_ROLE = "delete_role",
    // Workshop scopes
    GET_ALL_WORKSHOPS = "get_workshops",
    GET_ONE_WORKSHOP = "get_workshop",
    CREATE_WORKSHOP = "create_workshop",
    UPDATE_WORKSHOP = "update_workshop",
    DELETE_WORKSHOP = "delete_workshop",
    RSVP_WORKSHOP = "rsvp_workshop",
    SIGN_IN_WORKSHOP = "sign_in_workshop",
}
