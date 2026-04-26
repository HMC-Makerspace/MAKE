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
import { Input } from "@heroui/react";

export default function TopCheckedOutItems({
    checkouts,
    inventory,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
}) {
    const [topN, setTopN] = useState(10);

    const inventoryMap = useMemo(
        () => new Map(inventory.map((item) => [item.uuid, item])),
        [inventory],
    );

    const sortedData = useMemo(() => {
        const itemCounts: { [key: string]: number } = {};

        checkouts.forEach((checkout) => {
            checkout.items.forEach((checkoutItem) => {
                itemCounts[checkoutItem.item_uuid] =
                    (itemCounts[checkoutItem.item_uuid] || 0) +
                    checkoutItem.quantity;
            });
        });

        return Object.entries(itemCounts)
            .map(([uuid, count]) => ({
                name: inventoryMap.get(uuid)?.name || "Unknown Item",
                count,
            }))
            .sort((a, b) => b.count - a.count);
    }, [checkouts, inventoryMap]);

    const data = sortedData.slice(0, topN);

    if (sortedData.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">
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
                <h2 className="text-xl font-bold">Top Checked Out Items</h2>
                <Input
                    type="number"
                    min={1}
                    value={String(topN)}
                    onValueChange={(val) => setTopN(Number(val))}
                    size="sm"
                    className="w-20"
                    classNames={{
                        inputWrapper: "bg-default-200 h-8 min-h-0",
                        input: "text-sm",
                    }}
                />
            </div>
            <p className="text-sm text-default-500 mb-3">
                Top {topN} most checked out items.
            </p>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="name"
                        angle={-10}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis />
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Count",
                        ]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--heroui-primary))" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}