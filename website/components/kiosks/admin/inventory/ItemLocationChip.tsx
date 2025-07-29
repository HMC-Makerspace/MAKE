import clsx from "clsx";
import { TArea } from "common/area";
import { TInventoryItemLocation } from "common/inventory";

export default function ItemLocationChip({
    location,
    areas,
}: {
    location: TInventoryItemLocation;
    areas: TArea[];
}) {
    const base = clsx(
        "text-default-foreground py-1 sm:py-2 px-2 sm:px-3",
        "whitespace-nowrap text-center",
    );
    return (
        <div className="grid grid-cols-1 sm:flex sm:flex-row">
            <div
                className={clsx(
                    base,
                    "bg-default-50 rounded-t-xl",
                    "sm:rounded-l-full",
                    !location.container &&
                        !location.specific &&
                        "rounded-b-xl sm:rounded-b-none sm:rounded-r-full",
                )}
            >
                {areas.find((a) => a.uuid === location.area)?.name ??
                    "Unknown Area"}
            </div>
            {location.container && (
                <div
                    className={clsx(
                        base,
                        "bg-default-200",
                        !location.specific &&
                            "rounded-b-xl sm:rounded-b-none sm:rounded-r-full",
                    )}
                >
                    {location.container}
                </div>
            )}
            {location.specific && (
                <div
                    className={clsx(
                        base,
                        "bg-default-300 rounded-b-xl",
                        "sm:rounded-b-none sm:rounded-r-full",
                    )}
                >
                    {location.specific}
                </div>
            )}
        </div>
    );
}
