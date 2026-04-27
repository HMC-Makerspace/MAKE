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
import { SHIFT_DAY, SHIFT_DAYS } from "../../../../../common/shift";

export default function CheckoutsByDay({
    checkouts,
}: {
    checkouts: TCheckout[];
}) {
    const data = useMemo(() => {
        const dayCounts: { [key in SHIFT_DAY]: number } = {
            [SHIFT_DAY.SUNDAY]: 0,
            [SHIFT_DAY.MONDAY]: 0,
            [SHIFT_DAY.TUESDAY]: 0,
            [SHIFT_DAY.WEDNESDAY]: 0,
            [SHIFT_DAY.THURSDAY]: 0,
            [SHIFT_DAY.FRIDAY]: 0,
            [SHIFT_DAY.SATURDAY]: 0,
        };

        checkouts.forEach((checkout) => {
            const day: SHIFT_DAY = new Date(
                checkout.timestamp_out * 1000,
            ).getDay();
            dayCounts[day] += 1;
        });

        return SHIFT_DAYS.map((entry) => ({
            day: entry.name,
            count: dayCounts[entry.day],
        }));
    }, [checkouts]);

    //if there's no data yet, show a message instead of an empty chart
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
        <div className="flex flex-col bg-default-100 p-6 rounded-lg justify-between">
            <h2 className="text-xl font-bold mb-4">Checkouts by Day of Week</h2>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 5, bottom: 20 }}
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
                    <Bar
                        dataKey="count"
                        fill="hsl(var(--heroui-secondary-400))"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
