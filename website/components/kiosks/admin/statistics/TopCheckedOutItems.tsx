import { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TInventoryItem } from "common/inventory";
import { TCheckout } from "common/checkout";
import { NumberInput } from "@heroui/react";
import { TMachine } from "common/machine";
import { TArea } from "common/area";

export default function TopCheckedOutItems({
    checkouts,
    inventory,
    machines,
    areas,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
    machines: TMachine[];
    areas: TArea[];
}) {
    const [topN, setTopN] = useState(10);

    const inventoryMap = useMemo(
        () => new Map(inventory.map((item) => [item.uuid, item])),
        [inventory],
    );
    const machineMap = useMemo(
        () => new Map(machines.map((machine) => [machine.uuid, machine])),
        [machines],
    );
    const areaMap = useMemo(
        () => new Map(areas.map((area) => [area.uuid, area])),
        [areas],
    );

    const sortedData = useMemo(() => {
        const itemCounts: { [key: string]: number } = {};

        checkouts.forEach((checkout) => {
            checkout.items.forEach((checkoutItem) => {
                const uuid =
                    inventoryMap.get(checkoutItem.item_uuid)?.linked_uuid ||
                    checkoutItem.item_uuid;
                itemCounts[uuid] =
                    (itemCounts[uuid] || 0) + checkoutItem.quantity;
            });
        });

        return Object.entries(itemCounts)
            .map(([uuid, count]) => ({
                name:
                    inventoryMap.get(uuid)?.name ||
                    machineMap.get(uuid)?.name ||
                    areaMap.get(uuid)?.name ||
                    "Unknown Item",
                count,
            }))
            .sort((a, b) => b.count - a.count);
    }, [areaMap, checkouts, inventoryMap, machineMap]);

    const data = sortedData.slice(0, topN);

    if (sortedData.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-foreground-900 mb-4">
                    Top Checked Out Items
                </h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground-900">
                    Top Checked Out Items
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-default-700">Top</span>
                    <NumberInput
                        aria-label="Number of top checked-out items"
                        min={1}
                        max={20}
                        value={topN}
                        onValueChange={(value) =>
                            setTopN(Math.min(20, Math.max(1, value)))
                        }
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
            <p className="text-sm text-default-500 mb-3">
                Showing the top {topN} checked-out items.
            </p>
            <ResponsiveContainer
                width="100%"
                height={Math.max(450, data.length * 32 + 40)}
            >
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: -30, bottom: 20 }}
                    layout="vertical"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={140}
                        interval={0}
                        tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Count",
                        ]}
                    />
                    <Bar
                        dataKey="count"
                        fill="hsl(var(--heroui-success-200))"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
