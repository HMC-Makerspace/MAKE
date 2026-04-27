import { useMemo, useState } from "react";
import { TInventoryItem } from "common/inventory";
import { Input, NumberInput } from "@heroui/react";
import { TRestockRequest, RESTOCK_REQUEST_STATUS } from "../../../../../common/restock";

export default function TopRestockedItems({
    restocks,
    inventory,
}: {
    restocks: TRestockRequest[];
    inventory: TInventoryItem[];
}) {
    const [topN, setTopN] = useState(10);

    const inventoryMap = useMemo(
        () => new Map(inventory.map((item) => [item.uuid, item])),
        [inventory]
    );

    const sortedData = useMemo(() => {
        const restockCounts: Record<string, number> = {};

        restocks
            .filter((r) => r.current_status === RESTOCK_REQUEST_STATUS.RESTOCKED)
            .forEach((r) => {
                restockCounts[r.item_uuid] =
                    (restockCounts[r.item_uuid] || 0) + 1;
            });

        return Object.entries(restockCounts)
            .map(([uuid, count]) => ({
                name: inventoryMap.get(uuid)?.name || "Unknown Item",
                count,
            }))
            .sort((a, b) => b.count - a.count);
    }, [restocks, inventoryMap]);

    const data = sortedData.slice(0, topN);

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Restocked Items</h2>
                <NumberInput
                    min={1}
                    value={topN}
                    onValueChange={setTopN}
                    size="sm"
                    className="w-20"
                    classNames={{
                        inputWrapper: "bg-default-200 h-8 min-h-0",
                        input: "text-sm",
                    }}
                />
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-default-500">
                    No restock data available.
                </p>
            ) : (
                <>
                    <p className="text-sm text-default-500 mb-3">
                        Showing top {data.length} most restocked item
                        {data.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col gap-2">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="bg-default-200 px-4 py-2 rounded-md text-sm flex justify-between items-center"
                            >
                                <span>{item.name}</span>
                                <span className="text-default-500">
                                    {item.count} restock
                                    {item.count !== 1 ? "s" : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}