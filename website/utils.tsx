import { Time, ZonedDateTime, parseZonedDateTime, now } from "@internationalized/date";
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

export function timestampToZonedDateTime(timestamp: number, timeZone: string = 'America/Los_Angeles'): ZonedDateTime {
    const date = new Date(timestamp * 1000);
    return parseZonedDateTime(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}[${timeZone}]`
    );
}

/** Convert an internationalized Time object to a UNIX second timestamp */
export function timeToTimestamp(time: Time) {
    return time.hour * 60 * 60 + time.minute * 60 + time.second;
}
