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

export default function LeastCheckedOutItems({
    checkouts,
    inventory,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
}) {
    const [bottomN, setBottomN] = useState(10);

    const leastData = useMemo(() => {
        const itemCounts = new Map(inventory.map((item) => [item.uuid, 0]));

        checkouts.forEach((checkout) => {
            checkout.items.forEach((checkoutItem) => {
                itemCounts.set(
                    checkoutItem.item_uuid,
                    (itemCounts.get(checkoutItem.item_uuid) || 0) +
                        checkoutItem.quantity,
                );
            });
        });

        return inventory
            .map((item) => ({
                name: item.name,
                count: itemCounts.get(item.uuid) || 0,
            }))
            .sort((a, b) => a.count - b.count)
            .slice(0, bottomN);
    }, [bottomN, checkouts, inventory]);

    if (inventory.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold text-foreground-900 mb-4">
                    Least Checked Out Items
                </h2>
                <p className="text-sm text-default-500">
                    No inventory data available.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground-900">
                    Least Checked Out Items
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-default-700">Bottom</span>
                    <NumberInput
                        aria-label="Number of least checked-out items"
                        min={1}
                        max={20}
                        value={bottomN}
                        onValueChange={(value) =>
                            setBottomN(Math.min(20, Math.max(1, value)))
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
                Showing the bottom {bottomN} least checked-out items.
            </p>
            <ResponsiveContainer
                width="100%"
                height={Math.max(450, leastData.length * 32 + 40)}
            >
                <BarChart
                    data={leastData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: -30, bottom: 20 }}
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
                        fill="hsl(var(--heroui-warning-300))"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
