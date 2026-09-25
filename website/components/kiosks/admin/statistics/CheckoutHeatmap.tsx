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

export default function CheckoutHeatmap({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        const hourCounts: { [key: number]: number } = {};
        for (let i = 0; i < 24; i++) {
            hourCounts[i] = 0;
        }

        checkouts.forEach((checkout) => {
            const hour = new Date(checkout.timestamp_out * 1000).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        return Object.entries(hourCounts)
            .map(([hour, count]) => ({
                hour: `${hour.toString().padStart(2, "0")}:00`,
                count,
            }))
            .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }, [checkouts]);

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
                    margin={{ top: 20, right: 30, left: 5, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis
                        dataKey="hour"
                        angle={0}
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
                    <Bar dataKey="count" fill="hsl(var(--heroui-primary))" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
