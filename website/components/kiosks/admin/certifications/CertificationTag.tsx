import { As, Card, Link } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import CVisibilityIcon from "./CVisibilityIcon";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

/**
 * A simple hex to RGB converter
 * @param hex the hex color to convert
 * @returns A list of RGB values
 */
function hexToRgb(hex: string): [number, number, number] {
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
function getForegroundColor(hex: string): string {
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

// A certification tag similar (but with less rounded edges) to user role tags (see UserRole)
export default function CertificationTag({
    cert_uuid,
    certifications,
    showVisibility = false,
    level = undefined,
    href = undefined,
}: {
    cert_uuid: string;
    certifications?: TCertification[];
    showVisibility?: boolean;
    level?: number;
    href?: string;
}) {
    const { data, isLoading, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
        enabled: !certifications,
    });

    const cert = certifications
        ? certifications.find((c) => c.uuid === cert_uuid)
        : data;

    // Default to gray if not yet successful
    const color = cert ? cert.color : "gray";
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isLoading
    const title = cert ? cert.name : isError ? "Error" : "Loading";
    const foregroundColor = getForegroundColor(color);

    return (
        <Card
            className={clsx(
                "p-1.5 flex flex-row gap-1 w-fit px-2.5 rounded-sm",
                "content-center items-center min-w-fit",
            )}
            style={{ backgroundColor: color }}
            isBlurred={!isLoading}
            as={href ? Link : undefined}
            href={href}
        >
            {showVisibility ? (
                <CVisibilityIcon
                    visibility={cert?.visibility}
                    color={foregroundColor}
                    className="size-5 -ml-0.5"
                />
            ) : (
                <BookmarkIcon
                    color={foregroundColor}
                    strokeWidth={2}
                    className="size-5 -ml-0.5"
                />
            )}
            <h1
                className="text-sm font-semibold text-nowrap"
                style={{
                    color: foregroundColor,
                }}
            >
                {title}
            </h1>
            {level !== undefined && level !== 0 && (
                <div
                    className="text-sm font-semibold"
                    style={{
                        color: foregroundColor,
                    }}
                >
                    {level}
                </div>
            )}
        </Card>
    );
}
