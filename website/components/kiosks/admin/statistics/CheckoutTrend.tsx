import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TCheckout } from "common/checkout";

export default function CheckoutTrend({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        //creates a dictionary dayCounts that takes the date and the number of checkouts
        //that corresponds to that day
        const dayCounts: { [key: string]: number } = {};
        //does an array function "for loop" through each item in checkouts and gets the:
        checkouts.forEach((checkout) => {
            //date and date str in the corresponding forms
            const date = new Date(checkout.timestamp_out * 1000);
            const dateStr = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            //then we do the check we've been doing where if the
            //dateStr is already in it, add 1, if not, start at 0 and add 1
            dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
        });

        //returns a sorted array out of daycount
        return (
            Object.entries(dayCounts)
                //.map takes in the form [date, count] and turns it into the form {date, count}
                .map(([date, count]) => ({ date, count }))
                .sort(
                    (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime(),
                )
        );
        //we then sort it by going from earliest date to latest
    }, [checkouts]);

    //just in case there is no data at all, display this
    if (data.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg col-span-1">
                <h2 className="text-xl font-bold mb-4">Checkout Trend</h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    //all this stuff is display stuff
    return (
        <div className="bg-default-100 p-6 rounded-lg col-span-1">
            <h2 className="text-xl font-bold mb-4">Checkout Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="date"
                        angle={-10}
                        textAnchor="end"
                        interval="preserveStartEnd"
                        tick={{ fontSize: 11 }}
                        height={60}
                    />
                    <YAxis
                        allowDecimals={false}
                        tickFormatter={(value) => Math.floor(value).toString()}
                    />

                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Daily Checkouts",
                        ]}
                    />

                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#4A7C59"
                        dot={false}
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
