import {
    Time,
    ZonedDateTime,
    parseZonedDateTime,
    now,
} from "@internationalized/date";
import { TUser, TUserRole } from "common/user";

/**
 * A file to contain useful utility functions for the website.
 * Items in this file should be general and not specific to any one component,
 * and should be able to be used in at least 3 places.
 */

export function updateSearchParams(
    searchParams: URLSearchParams,
    params: Record<string, string | string[]>,
) {
    const entries = Object.entries(params);
    entries.forEach(([key, value]) => {
        // If we are removing the key, delete it
        if (!value) {
            searchParams.delete(key);
            // If we are adding an array, append each value
        } else if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
        } else {
            searchParams.set(key, value);
        }
    });
    return searchParams;
}

/** Convert an UNIX timestamp into a Locale String  */
export function convertTimestampToDate(timestamp?: number): string {
    if (!timestamp) {
        return "N/A";
    }
    return new Date(timestamp * 1000).toLocaleString();
}

export function timestampToZonedDateTime(
    timestamp: number,
    timeZone: string = "America/Los_Angeles",
): ZonedDateTime {
    const date = new Date(timestamp * 1000);
    return parseZonedDateTime(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}[${timeZone}]`,
    );
}

/** Convert an internationalized Time object to a UNIX second timestamp */
export function timeToTimestamp(time: Time) {
    return time.hour * 60 * 60 + time.minute * 60 + time.second;
}

/** Convert a UNIX second timestamp to an internationalized Time object */
export function timestampToTime(timestamp: number) {
    return new Time(
        Math.floor(timestamp / 3600),
        Math.floor((timestamp / 60) % 60),
        timestamp % 3600,
    );
}

export function getUserRoleHierarchy(user: TUser, roles: TUserRole[]) {
    return (
        user.active_roles
            .map((role_log) => {
                return {
                    role: roles.find((r) => r.uuid == role_log.role_uuid),
                    timestamp: role_log.timestamp_gained,
                };
            })
            // Sort by role hierarchy (if available) or otherwise timestamp in increasing order (oldest first)
            .sort((a, b) => {
                if (!a.role || !b.role) {
                    return a.timestamp - b.timestamp;
                } else {
                    const a_level = a.role.display_hierarchy ?? 0;
                    const b_level = b.role.display_hierarchy ?? 0;
                    // Larger hierarchical levels, but smaller (older) timestamps, appear first
                    return b_level - a_level || a.timestamp - b.timestamp;
                }
            })
            .map((tr) => tr.role)
            .filter((r) => !!r)
    );
}
