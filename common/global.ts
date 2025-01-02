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
    // Area scopes
    GET_ALL_AREAS = "get_areas",
    GET_AREA = "get_area",
    CREATE_AREA = "create_area",
    UPDATE_AREA = "update_area",
    UPDATE_AREA_STATUS = "update_area_status",
    DELETE_AREA = "delete_area",
    // Checkout scopes
    GET_ALL_CHECKOUTS = "get_checkouts",
    GET_ONE_CHECKOUT = "get_checkout",
    GET_CHECKOUTS_BY_USER = "get_user_checkouts",
    GET_CHECKOUTS_BY_SELF = "get_own_checkouts",
    CREATE_CHECKOUT = "create_checkout",
    UPDATE_CHECKOUT = "update_checkout",
    DELETE_CHECKOUT = "delete_checkout",
    // 3D
    PRINTER = "3dprinter",
    // Inventory scopes
    GET_ALL_INVENTORY = "get_inventory",
    CREATE_ITEM = "create_item",
    UPDATE_ITEM = "update_item",
    DELETE_ITEM = "delete_item",
    // INVENTORY_EDITOR = "inventory_editor", // TODO: Use later?
    // Machine scopes
    GET_ALL_MACHINES = "get_machines",
    GET_MACHINE = "get_machine",
    CREATE_MACHINE = "create_machine",
    UPDATE_MACHINE = "update_machine",
    UPDATE_MACHINE_STATUSES = "update_machine_statuses",
    DELETE_MACHINE = "delete_machine",
    // Restock Request scopes
    GET_ALL_RESTOCKS = "get_restock_requests",
    GET_RESTOCKS_BY_USER = "get_user_restock_requests",
    GET_RESTOCKS_BY_SELF = "get_own_restock_requests",
    CREATE_RESTOCK = "create_restock_request",
    UPDATE_RESTOCK = "update_restock_request",
    UPDATE_RESTOCK_STATUS = "update_restock_status",
    DELETE_RESTOCK = "delete_restock_request",
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
    GET_WORKSHOP = "get_workshop",
    CREATE_WORKSHOP = "create_workshop",
    UPDATE_WORKSHOP = "update_workshop",
    DELETE_WORKSHOP = "delete_workshop",
    RSVP_WORKSHOP = "rsvp_workshop",
    SIGN_IN_WORKSHOP = "sign_in_workshop",
}
