import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { TCheckout } from "common/checkout";

// defined outside the component so it never gets re-created on re-renders
const BAR_COLOR = "#A78BFA";

// maps .getDay() index (0–6) to a readable name
// .getDay() returns 0 for Sunday, 1 for Monday, etc.
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CheckoutsByDay({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        // initialize all 7 days to 0 so every day always appears on the chart
        const dayCounts: { [key: number]: number } = {};
        for (let i = 0; i < 7; i++) {
            dayCounts[i] = 0;
        }

        // for each checkout, get the day of the week from the unix timestamp
        // timestamp_out is in seconds, multiply by 1000 for JS Date milliseconds
        checkouts.forEach((checkout) => {
            const day = new Date(checkout.timestamp_out * 1000).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });

        // convert tally into chart-ready array, keeping Sun–Sat order
        return Object.entries(dayCounts)
            .map(([day, count]) => ({
                day: DAY_NAMES[parseInt(day)],
                count,
            }))
            .sort(
                (a, b) => DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day),
            );
    }, [checkouts]);

    // if there's no data yet, show a message instead of an empty chart
    if (data.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">
                    Checkouts by Day of Week
                </h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Checkouts by Day of Week</h2>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Count",
                        ]}
                    />
                    <Bar dataKey="count" fill={BAR_COLOR} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
