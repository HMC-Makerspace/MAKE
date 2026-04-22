import { useMemo, useState } from "react";
import { TCheckout } from "common/checkout";
import { TInventoryItem } from "common/inventory";
import { Input } from "@heroui/react";

export default function RarelyCheckedOutItems({
    checkouts,
    inventory,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
}) {
    const [threshold, setThreshold] = useState(3);

    const itemCheckoutCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        checkouts.forEach((checkout) => {
            checkout.items.forEach((ci) => {
                counts[ci.item_uuid] = (counts[ci.item_uuid] || 0) + 1;
            });
        });

        return counts;
    }, [checkouts]);

    const rarelyCheckedOut = useMemo(() => {
        return inventory.filter((item) => {
            const count = itemCheckoutCounts[item.uuid] || 0;
            return count < threshold;
        });
    }, [checkouts, inventory, threshold]);

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold mb-4">Rarely Checked Out</h2>
                <Input
                    type="number"
                    value={String(threshold)}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-20 bg-default-200 px-3 py-1 rounded-md text-sm"
                />
            </div>

            <p className="text-sm text-default-500 mb-3">
                {rarelyCheckedOut.length} item
                {rarelyCheckedOut.length !== 1 ? "s" : ""} checked out fewer
                than {threshold} times.
            </p>
            <div className="flex flex-col gap-2">
                {rarelyCheckedOut.map((item) => (
                    <div
                        key={item.uuid}
                        className="bg-default-200 px-4 py-2 rounded-md text-sm"
                    >
                        {item.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
