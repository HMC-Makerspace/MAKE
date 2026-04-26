import { useMemo, useState } from "react";
import { TCheckout } from "common/checkout";
import { TInventoryItem } from "common/inventory";
import { NumberInput, Spinner } from "@heroui/react";
import ItemInfo from "../inventory/ItemInfo";
import { TCertification } from "common/certification";
import { TArea } from "common/area";
import { useScroll } from "../../../UseScroll";

export default function RarelyCheckedOutItems({
    checkouts,
    inventory,
    areas,
    certs,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
    areas: TArea[];
    certs: TCertification[];
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

    const { visibleContent, hasMoreContent, loaderRef, scrollerRef } =
        useScroll(rarelyCheckedOut ?? [], 20, 20);

    return (
        <main className="bg-default-100 p-6 rounded-lg" ref={scrollerRef}>
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold mb-4">Rarely Checked Out</h2>
                <NumberInput
                    label={"# Times:"}
                    labelPlacement="outside-left"
                    value={threshold}
                    onValueChange={setThreshold}
                    variant="bordered"
                    className="w-fit px-3 py-1 rounded-md text-sm"
                />
            </div>

            <p className="text-sm text-default-500 mb-3">
                There are {rarelyCheckedOut.length} item
                {rarelyCheckedOut.length !== 1 ? "s" : ""} that have been
                checked out fewer than {threshold} time
                {threshold !== 1 ? "s" : ""}.
            </p>
            <div className="flex flex-col gap-2 max-h-80 overflow-auto">
                {visibleContent.map((item) => (
                    <div key={item.uuid} className="px-4 rounded-md text-sm">
                        <ItemInfo
                            item_data={item}
                            areas={areas}
                            certs={certs}
                            className="w-full justify-start"
                        />
                    </div>
                ))}
                {hasMoreContent && <Spinner ref={loaderRef} color="primary" />}
            </div>
        </main>
    );
}
