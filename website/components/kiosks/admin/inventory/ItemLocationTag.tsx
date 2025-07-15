import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TInventoryItemLocation, ItemQuantity } from "common/inventory";
import { TArea } from "common/area";
import { StarIcon } from "@heroicons/react/24/outline";
import React from "react";
import { getForegroundColor } from "../../../../utils";

export default function ItemLocationTag({
    area_uuid,
    container,
    specific,
    quantity,
    size = "sm",
}: {
    area_uuid: string;
    container?: string;
    specific?: string;
    quantity: ItemQuantity;
    size?: "sm" | "md";
}) {
    const { data, isSuccess, isError } = useQuery<TArea>({
        queryKey: ["area", area_uuid],
        refetchOnWindowFocus: false
    });
    // Default to gray if not yet successful
    const color = "gray";//role?.color ?? (isSuccess ? data.color : "gray");
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isSuccess
    const title =
        (data?.name ?? (isSuccess ? data.title : isError ? "Error" : "Loading")) + container + specific + quantity;
    const foregroundColor = getForegroundColor(color);
    return (
        <Card
            className="p-1.5 flex flex-row gap-1 w-fit px-2.5"
            style={{ backgroundColor: color }}
            isBlurred={!isSuccess}
        >
            {data?.default ? (
                <StarIcon
                    className={`size-4 mt-[1.5px] -ml-0.5`}
                    strokeWidth={2.5}
                    color={foregroundColor}
                />
            ) : null}
            <h1
                className="text-sm font-semibold text-nowrap"
                style={{
                    color: foregroundColor,
                }}
            >
                {title}
            </h1>
        </Card>
    );
}
