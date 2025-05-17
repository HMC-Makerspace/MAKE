import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Button, Card, Input } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";

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
export default function ItemCertTag({ cert_uuid, req_level, on_level_change }: { cert_uuid: string, req_level: number, on_level_change: (val: number) => void }) {
    const { data, isSuccess, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
    });

    // Default to gray if not yet successful
    const color = isSuccess ? data.color : "gray";
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isSuccess
    const title = isSuccess ? `${data.name}` : isError ? "Error" : "Loading";
    const foregroundColor = getForegroundColor(color);

    var a = req_level;

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
                {/* {a} */}
                {/* <Input
                    type="text"
                    className="text-sm font-semibold text-nowrap"
                style={{
                    // backgroundColor: color,
                    // color: foregroundColor,
                }}

                >
                
                </Input> */}

                
            </h1>

            <div className="flex flex-col">

                    <Button className="h-50 rounded-sm" isIconOnly
                    // onPress={()=>on_level_change(++a)}
                    >
                        
                        <ChevronUpIcon className="size-3" />
                    </Button>

                    <Button className="h-50 rounded-sm" isIconOnly
                    //onPress={()=>on_level_change(--a)}
                    >
                        
                        <ChevronDownIcon className="size-3" />
                    </Button>
                </div>

        </Card>
    );
}