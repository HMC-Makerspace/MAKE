import mongoose from "mongoose";
import type {
    TUser,
    TUserAvailability,
    TUserAvailabilityTime,
    TUserRole,
    TUserRoleLog,
} from "common/user";
import { Certificate } from "./certification.model";

/**
 * See {@link TUserRole} documentation for type information.
 */
export const UserRole = new mongoose.Schema<TUserRole>(
    {
        uuid: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: false },
        color: { type: String, required: true },
        scopes: { type: [String], required: true },
        default: { type: Boolean, required: true },
    },
    { collection: "user_roles" },
);

/**
 * See {@link TUserRoleLog} documentation for type information.
 * Stored as children of {@link User}.
 */
const UserRoleLog = new mongoose.Schema<TUserRoleLog>({
    role_uuid: { type: String, required: true },
    timestamp_gained: { type: Number, required: true },
    timestamp_revoked: { type: Number, required: false },
});

/**
 * See {@link TUserAvailabilityTime} documentation for type information.
 * Stored as children of {@link UserAvailability}.
 */
const UserAvailabilityTime = new mongoose.Schema<TUserAvailabilityTime>({
    sec_start: { type: Number, required: true },
    sec_end: { type: Number, required: true },
});

/**
 * See {@link TUserAvailability} documentation for type information.
 * Stored as children of {@link User}.
 */
const UserAvailability = new mongoose.Schema<TUserAvailability>({
    day: { type: Number, required: true },
    availability: { type: [UserAvailabilityTime], required: true },
});

/**
 * See {@link TUser} documentation for type information.
 */
export const User = new mongoose.Schema<TUser>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        college_id: { type: String, required: true },
        active_roles: { type: [UserRoleLog], required: true },
        past_roles: { type: [UserRoleLog], required: true },
        certificates: { type: [Certificate], required: false },
        files: { type: [String], required: false },
        availability: { type: [UserAvailability], required: false },
    },
    { collection: "users" },
);
