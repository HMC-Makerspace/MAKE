import { TInventoryItem } from "common/inventory";
import { TUser, TUserRole } from "common/user";
import { TCheckout } from "common/checkout";
import {
    RESTOCK_REQUEST_STATUS,
    TRestockRequest,
} from "../../../../../common/restock";
import UsersByDomain from "./UsersByDomain";
import CheckoutsByRole from "./CheckoutsByRole";
import TopCheckedOutItems from "./TopCheckedOutItems";
import LeastCheckedOutItems from "./LeastCheckedOutItems";
import CheckoutTrend from "./CheckoutTrend";
import CheckoutHeatmap from "./CheckoutHeatmap";
import CheckoutsByDay from "./CheckoutsByDay";
import RarelyCheckedOutItems from "./RarelyCheckedOutItems";
import TopRestockedItems from "./TopRestockedItems";
import { TCertification } from "common/certification";
import { TArea } from "common/area";
import { TMachine } from "common/machine";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { DateRangePicker } from "@heroui/react";
import type { RangeValue } from "@heroui/react";
import { useMemo, useState } from "react";

//this page receives all the data from StatisticsKiosk as props
//and its job is to lay out all the chart components on the page.
//it doesn't fetch anything for itself since kiosk already does that
//it generates the charts
export default function StatisticsDisplay({
    inventory,
    users,
    checkouts,
    roles,
    restocks,
    areas,
    certs,
    machines,
}: {
    //these are the prop types which tells TypeScript exactly what
    //type of data this component expects to receive
    inventory: TInventoryItem[];
    users: TUser[];
    checkouts: TCheckout[];
    roles: TUserRole[];
    restocks: TRestockRequest[];
    areas: TArea[];
    certs: TCertification[];
    machines: TMachine[];
}) {
    const [dateRange, setDateRange] = useState<RangeValue<CalendarDate>>(() => {
        const end = today(getLocalTimeZone());
        return { start: end.subtract({ years: 1 }), end };
    });

    const { filteredUsers, filteredCheckouts, filteredRestocks } =
        useMemo(() => {
            const start = new Date(
                dateRange.start.year,
                dateRange.start.month - 1,
                dateRange.start.day,
            ).getTime();
            const end = new Date(
                dateRange.end.year,
                dateRange.end.month - 1,
                dateRange.end.day + 1,
            ).getTime();
            const isInRange = (timestamp: number) =>
                timestamp * 1000 >= start && timestamp * 1000 < end;

            return {
                filteredUsers: users.filter(
                    (user) =>
                        user.last_login !== undefined &&
                        isInRange(user.last_login),
                ),
                filteredCheckouts: checkouts.filter((checkout) =>
                    isInRange(checkout.timestamp_out),
                ),
                filteredRestocks: restocks.filter(
                    (restock) =>
                        restock.current_status ===
                            RESTOCK_REQUEST_STATUS.RESTOCKED &&
                        restock.status_logs.some((log) =>
                            isInRange(log.timestamp),
                        ),
                ),
            };
        }, [checkouts, dateRange, restocks, users]);

    const handleDateRangeChange = (range: RangeValue<CalendarDate> | null) => {
        if (range) {
            setDateRange(range);
        }
    };

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-6 pb-0">
                <div />
                <h1 className="text-3xl font-bold text-foreground-900 mb-2">
                    Statistics
                </h1>
                <DateRangePicker<CalendarDate>
                    label="Statistics Date Range"
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    maxValue={today(getLocalTimeZone())}
                    hideTimeZone
                    variant="faded"
                    color="primary"
                    className="w-full max-w-md justify-self-end"
                    classNames={{
                        segment:
                            "text-xs sm:text-small text-default-700 data-[editable=true]:text-default-700 data-[editable=true]:data-[placeholder=true]:text-default-500 data-[editable=true]:data-[placeholder=true]:italic focus:text-default-700 data-[editable=true]:focus:text-default-700",
                    }}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                <div className="col-span-1 lg:col-span-2">
                    <UsersByDomain users={filteredUsers} />
                    {/* <CheckoutsByRole
                        users={users}
                        roles={roles}
                        checkouts={checkouts}
                    /> */}
                </div>

                <TopCheckedOutItems
                    checkouts={filteredCheckouts}
                    inventory={inventory}
                    machines={machines}
                    areas={areas}
                />
                <LeastCheckedOutItems
                    checkouts={filteredCheckouts}
                    inventory={inventory}
                    machines={machines}
                    areas={areas}
                />
                <CheckoutsByDay checkouts={filteredCheckouts} />

                <RarelyCheckedOutItems
                    checkouts={checkouts}
                    inventory={inventory}
                    areas={areas}
                    certs={certs}
                />

                <TopRestockedItems
                    restocks={filteredRestocks}
                    inventory={inventory}
                />
                <div className="col-span-1 lg:col-span-2">
                    <CheckoutHeatmap checkouts={filteredCheckouts} />
                </div>
                <div className="col-span-1 lg:col-span-2">
                    <CheckoutTrend checkouts={filteredCheckouts} />
                </div>
            </div>
        </div>
    );
}
