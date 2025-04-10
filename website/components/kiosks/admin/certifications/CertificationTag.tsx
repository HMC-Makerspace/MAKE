import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import CVisibilityIcon from "./CVisibilityIcon";

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
export default function CertificationTag({ cert_uuid, showVisibility=false }: { cert_uuid: string, showVisibility?: boolean }) {
    const { data, isSuccess, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
    });

    // Default to gray if not yet successful
    const color = isSuccess ? data.color : "gray";
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isSuccess
    const title = isSuccess ? data.name : isError ? "Error" : "Loading";
    const foregroundColor = getForegroundColor(color);

    return (
        <Card
            className="p-1.5 flex flex-row gap-1 w-fit px-2.5 rounded-sm"
            style={{ backgroundColor: color }}
            isBlurred={!isSuccess}
        >
            
            <h1
                className="text-sm font-semibold text-nowrap"
                style={{
                    color: foregroundColor,
                }}
            >
                {title}
            </h1>

            {showVisibility && (<div className="ml-1">
                <CVisibilityIcon
                    visibility={data?.visibility}
                    color={foregroundColor}
                    className="size-4 mt-[1.5px] -ml-0.5"
                />
            </div>)}
        </Card>
    );
}
