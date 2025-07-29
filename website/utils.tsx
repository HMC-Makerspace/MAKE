import {
    CalendarDateTime,
    fromAbsolute,
    parseDateTime,
    Time,
    ZonedDateTime,
    parseZonedDateTime,
} from "@internationalized/date";
import { API_SCOPE, UnixTimestamp } from "../common/global";
import { TUser, TUserRole } from "common/user";
import { TConfig } from "common/config";
import { TShift, SHIFT_EVENT_TYPE, TShiftEvent } from "../common/shift";

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

export function zonedDateTimeToTimestamp(zonedDateTime: ZonedDateTime) {
    return zonedDateTime.toDate().getTime() / 1000;
}

export function getUserRoleHierarchy(user: TUser, roles: TUserRole[]) {
    return (
        user.active_roles
            .map((role_log) => {
                return {
                    role: roles.find((r) => r.uuid === role_log.role_uuid),
                    timestamp: role_log.timestamp_gained,
                };
            })
            .filter((tr) => !!tr.role)
            // Sort by role hierarchy (if available) or otherwise timestamp in increasing order (oldest first)
            .sort((a, b) => {
                const a_level = a.role!.display_hierarchy;
                const b_level = b.role!.display_hierarchy;
                if (a_level === undefined) {
                    return 1; // show b first, since a has no hierarchy level
                } else if (b_level === undefined) {
                    return -1; // show a first, since b has no hierarchy level
                }
                // Smaller hierarchical levels and smaller (older) timestamps, appear first
                return a_level - b_level || a.timestamp - b.timestamp;
            })
            .map((tr) => tr.role)
            .filter((r) => !!r)
    );
}

/**
 * Verify that a user is allowed to perform some restricted action.
 * @param user_scopes The user's scopes, from calling /api/v3/user/self/scopes
 * @param allowed_scopes The list of scopes allowed, or boolean expressions.
 * @returns Wether the user is allowed to perform the given action.
 */
export function verifyScopes(
    user_scopes: API_SCOPE[],
    allowed_scopes: (API_SCOPE | false)[],
) {
    const true_scopes = allowed_scopes.filter((scope) => scope !== false);
    // Check that the user's scopes list includes any required scope,
    // or that the user has the ADMIN scope
    return (
        user_scopes.includes(API_SCOPE.ADMIN) ||
        true_scopes.some((scope) => user_scopes.includes(scope))
    );
}

export function getActiveEvents(shift: TShift, config: TConfig): TShiftEvent[] {
    // Cutoff of dropped shifts is one shift after the start of the drop
    const cutoff_timestamp = Date.now() / 1000 - config.schedule.increment_sec;
    const last_events = new Map<UnixTimestamp, TShiftEvent>();
    // Shift events are in timestamp order, where the most recent event
    // is at the end of the shift.history list
    for (const event of shift.history) {
        if (
            event.type === SHIFT_EVENT_TYPE.DROP ||
            event.type === SHIFT_EVENT_TYPE.PICKUP
        ) {
            last_events.set(event.shift_date, event);
        }
    }
    return last_events
        .entries()
        .filter(
            ([date, event]) =>
                // where the relevant shift hasn't happened yet
                date + shift.sec_start >= cutoff_timestamp,
        )
        .map(([date, event]) => event)
        .toArray();
    // const pickup_dates = pickups
    //     .entries()
    //     .filter(
    //         ([date, pickupCount]) =>
    //             // Find shifts that been picked up
    //             pickupCount > 0 &&
    //             // where the relevant shift hasn't happened yet
    //             date + shift.sec_start >= cutoff_timestamp,
    //     )
    //     .map(([date, _]) => date)
    //     .toArray();

    // return shift.history.filter(
    //     (event) =>
    //         (event.initiator === shift.assignee &&
    //             event.type === SHIFT_EVENT_TYPE.DROP &&
    //             drop_dates.includes(event.shift_date)) ||
    //         (event.type === SHIFT_EVENT_TYPE.PICKUP &&
    //             pickup_dates.includes(event.shift_date)),
    // );
}

/**
 * A simple hex to RGB converter
 * @param hex the hex color to convert
 * @returns A list of RGB values
 */
export function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return [r, g, b];
}

/**
 * A simple function to determine the best foreground color based on the given
 * background color, using a sRGB luma perceived brightness calculation.
 * Based on https://css-tricks.com/switch-font-color-for-different-backgrounds-with-css/
 * @param hex the hex background color to determine the foreground color for
 * @returns The best foreground color (either black or white) as a hex string
 */
export function getForegroundColor(hex: string): string {
    const [r, g, b] = hexToRgb(hex);
    // Luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255 */
    const lumaRed = r * 0.2126;
    const lumaGreen = g * 0.7152;
    const lumaBlue = b * 0.0722;
    const luma = (lumaRed + lumaGreen + lumaBlue) / 255;

    // Color threshold
    if (luma < 0.5) {
        return "#ffffff";
    } else {
        return "#000000";
    }
}