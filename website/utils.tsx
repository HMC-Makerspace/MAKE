import { Time } from "@internationalized/date";

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

//converting timestamp to date
export function convertTimestampToDate(timestamp?: number): string {
    if (!timestamp) {
        return "N/A";
    }
    return new Date(timestamp * 1000).toLocaleString();
}

/** Convert an UNIX timestamp into a Locale String  */
export function convertTimestampToDate(timestamp?: number): string {
    if (!timestamp) {
        return "N/A";
    }
    return new Date(timestamp * 1000).toLocaleString();
}
