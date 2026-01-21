import mongoose from "mongoose";
import type {
    TUser,
    TUserAvailability,
    TUserAvailabilityDay,
    TUserAvailabilityTime,
    TUserRole,
    TUserRoleLog,
} from "common/user";
import { Certificate, CertificateSchema } from "./certification.model";
import Joi from 'joi';

/**
 * See {@link TUserRole} documentation for type information.
 */
export const UserRole = new mongoose.Schema<TUserRole>(
    {
        uuid: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: false },
        color: { type: String, required: true },
        scopes: { type: [String], required: true }, // empty list
        default: { type: Boolean, required: true }, // false
        display_hierarchy: { type: Number, required: false },
    },
    { collection: "user_roles" },
);

/**
 * User role schema through joi
 */
export const UserRoleSchema = Joi.object<TUserRole>({
    uuid: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional().allow(""),
    color: Joi.string().required(),
    scopes: Joi.array()
        .items(
            Joi.string()
        )
        .required(),
    default: Joi.bool().required(),
    display_hierarchy: Joi.number().optional()
});

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
 * User role log schema through joi
 */
export const UserRoleLogSchema = Joi.object<TUserRoleLog>({
    role_uuid: Joi.string().required(),
    timestamp_gained: Joi.number().required(),
    timestamp_revoked: Joi.number().optional()
})

/**
 * See {@link TUserAvailabilityTime} documentation for type information.
 * Stored as children of {@link UserAvailability}.
 */
const UserAvailabilityTime = new mongoose.Schema<TUserAvailabilityTime>({
    sec_start: { type: Number, required: true },
    sec_end: { type: Number, required: true },
});

/**
 * See {@link TUserAvailabilityDay} documentation for type information.
 * Stored as children of {@link User}.
 */
const UserAvailabilityDay = new mongoose.Schema<TUserAvailabilityDay>({
    day: { type: Number, required: true },
    availability: { type: [UserAvailabilityTime], required: true },
});

/**
 * User Availability Day Schema through joi
 */
const UserAvailabilityDaySchema = Joi.object<TUserAvailabilityDay>({
    day: Joi.number().required(),
    availability: Joi.array().items(
        Joi.object({
            sec_start: Joi.number().required(),
            sec_end: Joi.number().required()
        })
    ).required()
});


/**
 * See {@link TUserAvailability} documentation for type information.
 * Stored as children of {@link User}.
 */
const UserAvailability = new mongoose.Schema<TUserAvailability>({
    schedule: { type: String, required: true },
    days: { type: [UserAvailabilityDay], required: true },
    min_shift_count: { type: Number, required: false },
    max_shift_count: { type: Number, required: false },
});

/**
 * User Availability Day Schema through joi
 */
const UserAvailabilitySchema = Joi.object<TUserAvailability>({
    schedule: Joi.string().required(),
    days: Joi.array()
        .items(
            UserAvailabilityDaySchema
        )
        .required(),
    min_shift_count: Joi.number().optional(),
    max_shift_count: Joi.number().optional()
});


/**
 * See {@link TUser} documentation for type information.
 */
export const User = new mongoose.Schema<TUser>(
    {
        uuid: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        college_id: { type: String, required: false },
        active_roles: { type: [UserRoleLog], required: true },
        past_roles: { type: [UserRoleLog], required: true },
        active_certificates: { type: [Certificate], required: false },
        past_certificates: { type: [Certificate], required: false },
        files: { type: [String], required: false },
        work_schedules: { type: [UserAvailability], required: false },
        passkey: { type: String, required: false },
    },
    { collection: "users" },
);

/**
 * User Schema through joi
 */
export const UserSchema = Joi.object<TUser>({
    uuid: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    college_id: Joi.string()
    // maybe consider validating this, here is where ids could be validated!
        .allow('')
        .optional(),
    active_roles: Joi.array()
        .items(
            UserRoleLogSchema
        )
        .required(),
    past_roles: Joi.array()
        .items(
            UserRoleLogSchema
        )
        .required(),
    active_certificates: Joi.array()
        .items(
            CertificateSchema
        )
        .optional(),
    past_certificates: Joi.array()
        .items(
            CertificateSchema
        )
        .optional(),
    files: Joi.array()
        .items(
            Joi.string()
        )
        .optional(),
    work_schedules: Joi.array()
        .items(
            UserAvailabilitySchema
        )
        .optional(),
    passkey: Joi.string().allow('').allow(null).optional()
});

// USE MIN TO DO PATCHES AND PUTS 