//again we useMemo so that component don't rerun all the time and only when its
//dependencies have changed
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
//common is the blueprint for data types and so this is defining the format of data
//i want to receive for its respective categories
import { TInventoryItem } from "common/inventory";
import { TCheckout } from "common/checkout";

export default function TopCheckedOutItems({
    checkouts,
    inventory,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
}) {
    //builds a lookup table for inventory
    //inventory is an array type, which is slow to search through repeatedly.
    //A Map lets me instantly look up any item by its uuid like a dictionary.
    //the format is: Map { "uuid-abc" => { uuid, name, ... }, "uuid-xyz" => { ... } }
    //useMemo means this only rebuilds if the inventory depedency array changes.
    const [topN, setTopN] = useState(10);

    const inventoryMap = useMemo(
        () => new Map(inventory.map((item) => [item.uuid, item])),
        [inventory],
    );

    //Count how many times each item was checked out
    const sortedData = useMemo(() => {
        //itemCounts is a plain object used to keep track of item, and number of checkouts
        //format: { "uuid-abc": 5, "uuid-xyz": 12, ... }
        //the key is the item's uuid, the value is the total quantity checked out.
        const itemCounts: { [key: string]: number } = {};

        // loop through every checkout record
        checkouts.forEach((checkout) => {
            // each checkout can contain multiple items (2 goggles + 1 drill)
            checkout.items.forEach((checkoutItem) => {
                //if we've seen this item before, add to its tally
                //if we haven't seen it yet, || 0 starts it at 0 before adding
                itemCounts[checkoutItem.item_uuid] =
                    (itemCounts[checkoutItem.item_uuid] || 0) +
                    checkoutItem.quantity;
            });
        });

        return (
            Object.entries(itemCounts)
                //turns { "uuid-abc": 5 } into [["uuid-abc", 5], ...]
                //so we can use .map() on it like an array
                .map(([uuid, count]) => ({
                    //look up the regular name from inventoryMap using the uuid
                    //?. means "only access .name if the item exists"
                    //if the item isn't in inventory for some reason, fall back to "Unknown Item"
                    name: inventoryMap.get(uuid)?.name || "Unknown Item",
                    count,
                }))
                // sort highest count first
                .sort((a, b) => b.count - a.count)
        );

        //reruns this calculation only if checkouts or inventoryMap changes
        //this is the dependency argument of the useMemo
    }, [checkouts, inventoryMap]);

    const data = sortedData.slice(0, topN);
    // if there's no data yet, show a message instead of an empty chart
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

    //the display component of the graph itself
    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Top Checked Out Items</h2>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 120 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="name" // use the "name" field from each data object
                        angle={-10} // tilt labels slightly so they don't overlap
                        textAnchor="end"
                        interval={0} // show every label, never skip any
                        tick={{ fontSize: 11 }}
                    />
                    <YAxis /> {/* auto-scales to the highest count value */}
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
