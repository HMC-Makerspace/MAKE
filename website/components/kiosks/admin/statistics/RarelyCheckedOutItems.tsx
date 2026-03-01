import { useMemo } from "react";
import { TCheckout } from "common/checkout";
import { TInventoryItem } from "common/inventory";

export default function NeverCheckedOutItems({
    checkouts,
    inventory,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
}) {
    const rarelyCheckedOut = useMemo(() => {
        // for each inventory item, count how many times it appears across all checkouts
        return inventory.filter((item) => {
            // reduce loops through every checkout and accumulates a running total
            const count = checkouts.reduce((total, checkout) => {
                // count how many times this item appears in this specific checkout
                return (
                    total +
                    checkout.items.filter((ci) => ci.item_uuid === item.uuid)
                        .length
                );
            }, 0); // 0 is the starting value of total

            // only keep items checked out fewer than 3 times
            return count < 3;
        });
    }, [checkouts, inventory]);

    if (rarelyCheckedOut.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Rarely Checked Out</h2>
                <p className="text-sm text-default-500">
                    All items have been checked out 3 or more times.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Rarely Checked Out</h2>
            <p className="text-sm text-default-500 mb-3">
                {rarelyCheckedOut.length} item
                {rarelyCheckedOut.length !== 1 ? "s" : ""} checked out fewer
                than 3 times
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
