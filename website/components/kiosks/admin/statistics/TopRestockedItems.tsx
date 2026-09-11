import { useMemo, useState } from "react";
import { TInventoryItem } from "common/inventory";
import { NumberInput, Spinner } from "@heroui/react";
import {
    TRestockRequest,
    RESTOCK_REQUEST_STATUS,
} from "../../../../../common/restock";
import { useScroll } from "../../../UseScroll";

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
        [inventory],
    );

    const sortedData = useMemo(() => {
        const restockCounts: Record<string, number> = {};

        restocks
            .filter(
                (r) => r.current_status === RESTOCK_REQUEST_STATUS.RESTOCKED,
            )
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

    const { visibleContent, hasMoreContent, loaderRef, scrollerRef } =
        useScroll(data ?? [], 20, 20);

    return (
        <main className="bg-default-100 p-6 rounded-lg" ref={scrollerRef}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground-900">
                    Top Restocked Items
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-default-700">Top</span>
                    <NumberInput
                        aria-label="Number of top restocked items"
                        min={1}
                        value={topN}
                        onValueChange={setTopN}
                        variant="bordered"
                        size="sm"
                        className="w-20"
                        classNames={{
                            inputWrapper: "h-8 min-h-0",
                            input: "text-sm",
                        }}
                    />
                </div>
            </div>

            {data.length === 0 ? (
                <p className="text-sm text-default-500">
                    No restock data available.
                </p>
            ) : (
                <>
                    <p className="text-sm text-default-500 mb-3">
                        Showing the top {data.length} restocked item
                        {data.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-col gap-2 max-h-80 overflow-auto">
                        {visibleContent.map((item, index) => (
                            <div
                                key={index}
                                className="h-10 min-h-10 rounded-md bg-default-200 px-4 py-2 text-sm text-default-700 flex items-center justify-between"
                            >
                                <span>{item.name}</span>
                                <span className="text-default-700">
                                    {item.count} restock
                                    {item.count !== 1 ? "s" : ""}
                                </span>
                            </div>
                        ))}
                        {hasMoreContent && (
                            <Spinner ref={loaderRef} color="primary" />
                        )}
                    </div>
                </>
            )}
        </main>
    );
}
