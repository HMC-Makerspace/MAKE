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
    // TODO: Kiosk scopes?
    // Area scopes
    GET_ALL_AREAS = "get_areas",
    GET_ONE_AREA = "get_area",
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
    // File scopes
    GET_ALL_FILES = "get_files",
    GET_ONE_FILE = "get_file",
    GET_FILES_BY_USER = "get_user_files",
    GET_OWN_FILES = "get_own_fils",
    RENAME_FILE = "rename_file",
    RENAME_OWN_FILE = "rename_own_file",
    CREATE_FILE = "create_file",
    CREATE_OWN_FILE = "create_own_file",
    DELETE_FILE = "delete_file",
    DELETE_FILES_BY_USER = "delete_user_files",
    DELETE_OWN_FILE = "delete_own_file",
    // 3D
    PRINTER = "3dprinter", // TODO: later
    // Inventory scopes
    GET_ALL_INVENTORY = "get_inventory",
    CREATE_ITEM = "create_item",
    UPDATE_ITEM = "update_item",
    DELETE_ITEM = "delete_item",
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
    // Schedule scopes
    GET_ALL_SCHEDULES = "get_schedules",
    GET_ONE_SCHEDULE = "get_schedule",
    GET_CURRENT_SCHEDULE = "get_current_schedule",
    GET_CURRENT_PUBLIC_SCHEDULE = "get_current_public_schedule",
    CREATE_SCHEDULE = "create_schedule",
    UPDATE_SCHEDULE = "update_schedule",
    DELETE_SCHEDULE = "delete_schedule",
    // Schedule Alert scopes
    CREATE_ALERT = "create_alert",
    UPDATE_ALERT = "update_alert",
    DELETE_ALERT = "delete_alert",
    // Shift scopes
    GET_ALL_SHIFTS = "get_shifts",
    GET_SHIFT = "get_shift",
    GET_OWN_SHIFTS = "get_own_shift",
    GET_USER_PICKED_UP_SHIFTS = "get_picked_up_shifts",
    GET_USER_DROPPED_SHIFTS = "get_dropped_up_shifts",
    CREATE_SHIFT = "create_shift",
    UPDATE_SHIFT = "update_shift",
    POST_SHIFT_EVENT = "post_shift_event",
    DELETE_SHIFT = "delete_shift",
    // User scopes
    GET_ALL_USERS = "get_users",
    UPDATE_USER = "update_user",
    UPDATE_INFO_SELF = "update_self",
    CREATE_USER = "create_user",
    DELETE_USER = "delete_user",
    DELETE_USER_SELF = "delete_self",
    // Role scopes
    GET_ALL_ROLES = "get_roles",
    UPDATE_ROLE = "update_role",
    CREATE_ROLE = "create_role",
    DELETE_ROLE = "delete_role",
    GRANT_ROLE = "grant_role",
    REVOKE_ROLE = "revoke_role",
    // Workshop scopes
    GET_ALL_WORKSHOPS = "get_workshops",
    GET_WORKSHOP = "get_workshop",
    CREATE_WORKSHOP = "create_workshop",
    UPDATE_WORKSHOP = "update_workshop",
    DELETE_WORKSHOP = "delete_workshop",
    RSVP_WORKSHOP = "rsvp_workshop",
    SIGN_IN_WORKSHOP = "sign_in_workshop",
    // Certification scopes
    GET_ALL_CERTIFICATIONS = "get_certifications",
    GET_ONE_CERTIFICATION = "get_certification",
    CREATE_CERTIFICATION = "create_certification",
    UPDATE_CERTIFICATION = "update_certification",
    DELETE_CERTIFICATION = "delete_certification",
    // Certification Type scopes
    GET_ALL_CERTIFICATION_TYPES = "get_certification_types",
    GET_ONE_CERTIFICATION_TYPE = "get_certification_type",
    CREATE_CERTIFICATION_TYPE = "create_certification_type",
    UPDATE_CERTIFICATION_TYPE = "update_certification_type",
    DELETE_CERTIFICATION_TYPE = "delete_certification_type",
}
