import { title } from "process";

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
    VIEW_KIOSKS = "view_kiosks",
    USER_KIOSK = "user_kiosk",
    ROLES_KIOSK = "roles_kiosk",
    INVENTORY_KIOSK = "inventory_kiosk",
    AREA_KIOSK = "area_kiosk",
    MACHINE_KIOSK = "machine_kiosk",
    SCHEDULE_KIOSK = "schedule_kiosk",
    SHIFT_KIOSK = "shift_kiosk",
    WORKSHOP_KIOSK = "workshop_kiosk",
    CHECKOUT_KIOSK = "checkout_kiosk",
    RESTOCK_KIOSK = "restock_kiosk",
    CERTIFICATION_KIOSK = "certification_kiosk",
    SETTINGS_KIOSK = "settings_kiosk",
    // Area scopes
    GET_ALL_AREAS = "get_areas",
    GET_ONE_AREA = "get_area",
    CREATE_AREA = "create_area",
    UPDATE_AREA = "update_area",
    UPDATE_AREA_STATUS = "update_area_status",
    DELETE_AREA = "delete_area",
    // Certification scopes
    GET_ALL_CERTIFICATIONS = "get_certifications",
    GET_ONE_CERTIFICATION = "get_certification",
    CREATE_CERTIFICATION = "create_certification",
    UPDATE_CERTIFICATION = "update_certification",
    DELETE_CERTIFICATION = "delete_certification",
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
    GET_OWN_FILES = "get_own_files",
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
    // Role scopes
    GET_ALL_ROLES = "get_roles",
    UPDATE_ROLE = "update_role",
    CREATE_ROLE = "create_role",
    DELETE_ROLE = "delete_role",
    GRANT_ROLE = "grant_role",
    REVOKE_ROLE = "revoke_role",
    // Schedule scopes
    GET_ALL_SCHEDULES = "get_schedules",
    GET_ONE_SCHEDULE = "get_schedule",
    GET_CURRENT_SCHEDULE = "get_current_schedule",
    GET_CURRENT_PUBLIC_SCHEDULE = "get_public_schedule",
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
    // Workshop scopes
    GET_ALL_WORKSHOPS = "get_workshops",
    GET_WORKSHOP = "get_workshop",
    CREATE_WORKSHOP = "create_workshop",
    UPDATE_WORKSHOP = "update_workshop",
    DELETE_WORKSHOP = "delete_workshop",
    RSVP_WORKSHOP = "rsvp_workshop",
    SIGN_IN_WORKSHOP = "sign_in_workshop",
}

export type API_SCOPE_DESCRIPTOR = {
    scope: API_SCOPE;
    label: string;
    description: string;
};

export const API_SCOPE_SECTIONS: {
    title: string;
    scopes: API_SCOPE_DESCRIPTOR[];
}[] = [
    {
        title: "Admin",
        scopes: [
            {
                scope: API_SCOPE.ADMIN,
                label: "Administrator Access",
                description: "Access to all scopes and features",
            },
        ],
    },
    {
        title: "Kiosks",
        scopes: [
            {
                scope: API_SCOPE.VIEW_KIOSKS,
                label: "View Kiosks",
                description: "Able to view kiosk homepage",
            },
            {
                scope: API_SCOPE.USER_KIOSK,
                label: "User Kiosk",
                description: "Access to user kiosk",
            },
            {
                scope: API_SCOPE.ROLES_KIOSK,
                label: "Roles Kiosk",
                description: "Access to roles kiosk",
            },
            {
                scope: API_SCOPE.SCHEDULE_KIOSK,
                label: "Schedule Kiosk",
                description: "Access to schedule kiosk",
            },
            {
                scope: API_SCOPE.SHIFT_KIOSK,
                label: "Shift Kiosk",
                description: "Access to shift kiosk",
            },
            {
                scope: API_SCOPE.WORKSHOP_KIOSK,
                label: "Workshop Kiosk",
                description: "Access to workshop kiosk",
            },
            {
                scope: API_SCOPE.RESTOCK_KIOSK,
                label: "Restock Kiosk",
                description: "Access to restock kiosk",
            },
            {
                scope: API_SCOPE.CERTIFICATION_KIOSK,
                label: "Certification Kiosk",
                description: "Access to certification kiosk",
            },
            {
                scope: API_SCOPE.SETTINGS_KIOSK,
                label: "Settings Kiosk",
                description: "Access to settings kiosk",
            },
        ],
    },
    {
        title: "Areas",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_AREAS,
                label: "Get All Areas",
                description: "Able to view all area data",
            },
            {
                scope: API_SCOPE.GET_ONE_AREA,
                label: "Get Area",
                description: "Able to view all data about individual areas",
            },
            {
                scope: API_SCOPE.CREATE_AREA,
                label: "Create Area",
                description: "Able to create new areas",
            },
            {
                scope: API_SCOPE.UPDATE_AREA,
                label: "Update Area",
                description: "Able to update all area information",
            },
            {
                scope: API_SCOPE.UPDATE_AREA_STATUS,
                label: "Update Area Status",
                description: "Able to update area statuses",
            },
            {
                scope: API_SCOPE.DELETE_AREA,
                label: "Delete Area",
                description: "Able to delete areas",
            },
        ],
    },
    {
        title: "Certifications",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_CERTIFICATIONS,
                label: "Get All Certifications",
                description: "Able to view all certification data",
            },
            {
                scope: API_SCOPE.GET_ONE_CERTIFICATION,
                label: "Get Certification",
                description:
                    "Able to view data about individual certifications",
            },
            {
                scope: API_SCOPE.CREATE_CERTIFICATION,
                label: "Create Certification",
                description: "Able to create new certifications",
            },
            {
                scope: API_SCOPE.UPDATE_CERTIFICATION,
                label: "Update Certification",
                description: "Able to update all certification information",
            },
            {
                scope: API_SCOPE.DELETE_CERTIFICATION,
                label: "Delete Certification",
                description: "Able to delete certifications",
            },
        ],
    },
    {
        title: "Checkouts",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_CHECKOUTS,
                label: "Get All Checkouts",
                description: "Able to view all checkout data",
            },
            {
                scope: API_SCOPE.GET_ONE_CHECKOUT,
                label: "Get Checkout",
                description: "Able to view data about individual checkouts",
            },
            {
                scope: API_SCOPE.GET_CHECKOUTS_BY_USER,
                label: "Get User Checkouts",
                description: "Able to view all checkouts by a user",
            },
            {
                scope: API_SCOPE.GET_CHECKOUTS_BY_SELF,
                label: "Get Own Checkouts",
                description: "Able to view all checkouts by oneself",
            },
            {
                scope: API_SCOPE.CREATE_CHECKOUT,
                label: "Create Checkout",
                description: "Able to create new checkouts",
            },
            {
                scope: API_SCOPE.UPDATE_CHECKOUT,
                label: "Update Checkout",
                description: "Able to update all checkout information",
            },
            {
                scope: API_SCOPE.DELETE_CHECKOUT,
                label: "Delete Checkout",
                description: "Able to delete checkouts",
            },
        ],
    },
    {
        title: "Files",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_FILES,
                label: "Get All Files",
                description: "Able to view all file data",
            },
            {
                scope: API_SCOPE.GET_ONE_FILE,
                label: "Get File",
                description: "Able to view data about individual files",
            },
            {
                scope: API_SCOPE.GET_FILES_BY_USER,
                label: "Get User Files",
                description: "Able to view all files uploaded by a user",
            },
            {
                scope: API_SCOPE.GET_OWN_FILES,
                label: "Get Own Files",
                description: "Able to view all files uploaded by oneself",
            },
            {
                scope: API_SCOPE.RENAME_FILE,
                label: "Rename File",
                description: "Able to rename any file",
            },
            {
                scope: API_SCOPE.RENAME_OWN_FILE,
                label: "Rename Own File",
                description: "Able to rename one's own files",
            },
            {
                scope: API_SCOPE.CREATE_FILE,
                label: "Create Any File",
                description: "Able to upload new files to any storage location",
            },
            {
                scope: API_SCOPE.CREATE_OWN_FILE,
                label: "Upload Own File",
                description: "Able to upload files for oneself",
            },
            {
                scope: API_SCOPE.DELETE_FILE,
                label: "Delete File",
                description: "Able to delete any file",
            },
            {
                scope: API_SCOPE.DELETE_FILES_BY_USER,
                label: "Delete User Files",
                description: "Able to delete all files by a user",
            },
            {
                scope: API_SCOPE.DELETE_OWN_FILE,
                label: "Delete Own Files",
                description: "Able to delete one's own files",
            },
        ],
    },
    {
        title: "Inventory",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_INVENTORY,
                label: "View Inventory",
                description: "Able to view all inventory data",
            },
            {
                scope: API_SCOPE.CREATE_ITEM,
                label: "Create Item",
                description: "Able to create new inventory items",
            },
            {
                scope: API_SCOPE.UPDATE_ITEM,
                label: "Update Item",
                description: "Able to update inventory items",
            },
            {
                scope: API_SCOPE.DELETE_ITEM,
                label: "Delete Item",
                description: "Able to delete inventory items",
            },
        ],
    },
    {
        title: "Machines",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_MACHINES,
                label: "Get All Machines",
                description: "Able to view all machine data",
            },
            {
                scope: API_SCOPE.GET_MACHINE,
                label: "Get Machine",
                description: "Able to view data about individual machines",
            },
            {
                scope: API_SCOPE.CREATE_MACHINE,
                label: "Create Machine",
                description: "Able to create new machines",
            },
            {
                scope: API_SCOPE.UPDATE_MACHINE,
                label: "Update Machine",
                description: "Able to update all machine information",
            },
            {
                scope: API_SCOPE.UPDATE_MACHINE_STATUSES,
                label: "Update Machine Statuses",
                description: "Able to the statuses for any machine",
            },
            {
                scope: API_SCOPE.DELETE_MACHINE,
                label: "Delete Machine",
                description: "Able to delete machines",
            },
        ],
    },
    {
        title: "Restock Requests",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_RESTOCKS,
                label: "Get All Restock Requests",
                description: "Able to view all restock request data",
            },
            {
                scope: API_SCOPE.GET_RESTOCKS_BY_USER,
                label: "Get User Restock Requests",
                description: "Able to view all restock requests by a user",
            },
            {
                scope: API_SCOPE.GET_RESTOCKS_BY_SELF,
                label: "Get Own Restock Requests",
                description:
                    "Able to view all restock requests made by oneself",
            },
            {
                scope: API_SCOPE.CREATE_RESTOCK,
                label: "Create Restock Request",
                description: "Able to create new restock requests",
            },
            {
                scope: API_SCOPE.UPDATE_RESTOCK,
                label: "Update Restock Request",
                description: "Able to update all restock requests",
            },
            {
                scope: API_SCOPE.UPDATE_RESTOCK_STATUS,
                label: "Update Restock Status",
                description: "Able to update the status of any restock request",
            },
            {
                scope: API_SCOPE.DELETE_RESTOCK,
                label: "Delete Restock Request",
                description: "Able to delete restock requests",
            },
        ],
    },
    {
        title: "Roles",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_ROLES,
                label: "Get All Roles",
                description: "Able to view all roles",
            },
            {
                scope: API_SCOPE.UPDATE_ROLE,
                label: "Update Role",
                description: "Able to update role information",
            },
            {
                scope: API_SCOPE.CREATE_ROLE,
                label: "Create Role",
                description: "Able to create new roles",
            },
            {
                scope: API_SCOPE.DELETE_ROLE,
                label: "Delete Role",
                description: "Able to delete roles",
            },
            {
                scope: API_SCOPE.GRANT_ROLE,
                label: "Grant Role",
                description: "Able to grant roles to users",
            },
            {
                scope: API_SCOPE.REVOKE_ROLE,
                label: "Revoke Role",
                description: "Able to revoke roles from users",
            },
        ],
    },
    {
        title: "Schedule",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_SCHEDULES,
                label: "Get All Schedules",
                description: "Able to view all schedule data",
            },
            {
                scope: API_SCOPE.GET_ONE_SCHEDULE,
                label: "Get Schedule",
                description: "Able to view data about individual schedules",
            },
            {
                scope: API_SCOPE.GET_CURRENT_SCHEDULE,
                label: "Get Current Schedule",
                description: "Able to view the current schedule",
            },
            {
                scope: API_SCOPE.GET_CURRENT_PUBLIC_SCHEDULE,
                label: "Get Public Schedule",
                description: "Able to view the current public schedule",
            },
            {
                scope: API_SCOPE.CREATE_SCHEDULE,
                label: "Create Schedule",
                description: "Able to create new schedules",
            },
            {
                scope: API_SCOPE.UPDATE_SCHEDULE,
                label: "Update Schedule",
                description: "Able to update all schedule information",
            },
            {
                scope: API_SCOPE.DELETE_SCHEDULE,
                label: "Delete Schedule",
                description: "Able to delete schedules",
            },
        ],
    },
    {
        title: "Schedule Alerts",
        scopes: [
            {
                scope: API_SCOPE.CREATE_ALERT,
                label: "Create Alert",
                description: "Able to create new schedule alerts",
            },
            {
                scope: API_SCOPE.UPDATE_ALERT,
                label: "Update Alert",
                description: "Able to update all schedule alerts",
            },
            {
                scope: API_SCOPE.DELETE_ALERT,
                label: "Delete Alert",
                description: "Able to delete schedule alerts",
            },
        ],
    },
    {
        title: "Shifts",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_SHIFTS,
                label: "Get All Shifts",
                description: "Able to view all shift data",
            },
            {
                scope: API_SCOPE.GET_SHIFT,
                label: "Get Shift",
                description: "Able to view data about individual shifts",
            },
            {
                scope: API_SCOPE.GET_OWN_SHIFTS,
                label: "Get Own Shifts",
                description: "Able to view all shifts for oneself",
            },
            {
                scope: API_SCOPE.GET_USER_PICKED_UP_SHIFTS,
                label: "Get Picked Up Shifts",
                description: "Able to view all shift pickups",
            },
            {
                scope: API_SCOPE.GET_USER_DROPPED_SHIFTS,
                label: "Get Dropped Shifts",
                description: "Able to view all shift drops",
            },
            {
                scope: API_SCOPE.CREATE_SHIFT,
                label: "Create Shift",
                description: "Able to create new shifts",
            },
            {
                scope: API_SCOPE.UPDATE_SHIFT,
                label: "Update Shift",
                description: "Able to update all shift information",
            },
            {
                scope: API_SCOPE.POST_SHIFT_EVENT,
                label: "Post Shift Event",
                description:
                    "Able to post events to shifts, like drops and pickups",
            },
            {
                scope: API_SCOPE.DELETE_SHIFT,
                label: "Delete Shift",
                description: "Able to delete shifts",
            },
        ],
    },
    {
        title: "Users",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_USERS,
                label: "Get All Users",
                description: "Able to view all users",
            },
            {
                scope: API_SCOPE.UPDATE_USER,
                label: "Update User",
                description: "Able to update user information",
            },
            {
                scope: API_SCOPE.UPDATE_INFO_SELF,
                label: "Update Self",
                description: "Able to update own information",
            },
            {
                scope: API_SCOPE.CREATE_USER,
                label: "Create User",
                description: "Able to create new users",
            },
            {
                scope: API_SCOPE.DELETE_USER,
                label: "Delete User",
                description: "Able to delete users",
            },
            {
                scope: API_SCOPE.DELETE_USER_SELF,
                label: "Delete Self",
                description: "Able to delete own account",
            },
        ],
    },
    {
        title: "Workshops",
        scopes: [
            {
                scope: API_SCOPE.GET_ALL_WORKSHOPS,
                label: "Get All Workshops",
                description: "Able to view all workshop data",
            },
            {
                scope: API_SCOPE.GET_WORKSHOP,
                label: "Get Workshop",
                description: "Able to view data about individual workshops",
            },
            {
                scope: API_SCOPE.CREATE_WORKSHOP,
                label: "Create Workshop",
                description: "Able to create new workshops",
            },
            {
                scope: API_SCOPE.UPDATE_WORKSHOP,
                label: "Update Workshop",
                description: "Able to update all workshop information",
            },
            {
                scope: API_SCOPE.DELETE_WORKSHOP,
                label: "Delete Workshop",
                description: "Able to delete workshops",
            },
            {
                scope: API_SCOPE.RSVP_WORKSHOP,
                label: "RSVP for Workshop",
                description: "Able to RSVP for workshops",
            },
            {
                scope: API_SCOPE.SIGN_IN_WORKSHOP,
                label: "Sign In for Workshop",
                description: "Able to sign in users to a workshop",
            },
        ],
    },
];
