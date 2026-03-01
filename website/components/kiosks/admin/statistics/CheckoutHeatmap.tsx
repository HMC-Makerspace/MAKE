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

// defined outside the component so it doesn't keep getting recreated on each new redner
const BAR_COLOR = "#6B9AC4";

export default function CheckoutHeatmap({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        // initialize all 24 hours to 0 so every hour always appears on the chart
        const hourCounts: { [key: number]: number } = {};
        for (let i = 0; i < 24; i++) {
            hourCounts[i] = 0;
        }

        // for each checkout, extract the hour from the unix timestamp and tally it
        // timestamp_out is in seconds, so multiply by 1000 to get milliseconds for JS Date
        checkouts.forEach((checkout) => {
            const hour = new Date(checkout.timestamp_out * 1000).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        // convert the tally object into an array recharts can use
        // padStart(2, "0") formats hours like "09:00" instead of "9:00"
        return Object.entries(hourCounts)
            .map(([hour, count]) => ({
                hour: `${hour.toString().padStart(2, "0")}:00`,
                count,
            }))
            .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }, [checkouts]);

    // if there's no data yet, show a message instead of an empty chart
    if (data.length === 0) {
        return (
            <div className="bg-default-100 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Checkouts by Hour</h2>
                <p className="text-sm text-default-500">
                    No checkout data available.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-default-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Checkouts by Hour</h2>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="hour"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 11 }}
                        height={60}
                    />
                    <YAxis />
                    <Tooltip
                        formatter={(value: any) => [
                            `${value} checkouts`,
                            "Checkouts by Hour",
                        ]}
                    />
                    {/* fill is set directly on Bar — no need for individual Cell components */}
                    <Bar dataKey="count" fill={BAR_COLOR} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
