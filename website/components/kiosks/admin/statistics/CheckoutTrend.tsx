import { useMemo } from "react";
import { DateFormatter } from "@internationalized/date";
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
import { TConfig } from "common/config";
import { timestampToZonedDateTime } from "../../../../../website/utils";

export default function CheckoutTrend({
    checkouts,
    config,
}: {
    checkouts: TCheckout[];
    config?: TConfig;
}) {
    const data = useMemo(() => {
        const dayCounts: Record<string, { date: string; count: number }> = {};

        const dateFormatter =
            config?.schedule.locale &&
            new DateFormatter(config.schedule.locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });

        checkouts.forEach((checkout) => {
            const zonedDate = timestampToZonedDateTime(
                checkout.timestamp_out,
                config?.schedule.timezone,
            );

            const dayKey = `${zonedDate.year}-${String(zonedDate.month).padStart(2, "0")}-${String(zonedDate.day).padStart(2, "0")}`;

            if (!dayCounts[dayKey]) {
                dayCounts[dayKey] = {
                    date: dateFormatter
                        ? dateFormatter.format(zonedDate.toDate())
                        : `${zonedDate.month}/${zonedDate.day}/${zonedDate.year}`,
                    count: 0,
                };
            }

            dayCounts[dayKey].count += 1;
        });

        return Object.entries(dayCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, value]) => value);
    }, [checkouts, config?.schedule.locale, config?.schedule.timezone]);

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
                        stroke="hsl(var(--heroui-primary))"
                        dot={false}
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
