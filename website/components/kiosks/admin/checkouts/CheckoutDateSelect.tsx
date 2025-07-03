import {
    useMutation,
    UseMutationResult,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
    TCheckout,
    TCheckoutItem,
    TCheckoutItemUnavailability,
} from "common/checkout";
import { timestampToZonedDateTime } from "../../../../utils";
import { Button, DateInput, DateRangePicker, RangeValue } from "@heroui/react";
import {
    ZonedDateTime,
    today,
    getLocalTimeZone,
} from "@internationalized/date";
import { TConfig } from "common/config";
import { TInventoryItem } from "common/inventory";
import { UserUUID } from "common/user";
import { UnixTimestamp } from "common/global";

const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export default function CheckoutDateSelect({
    range,
    setRange,
    unavailability,
    isDisabled,
    cart,
    config,
    inventory,
    onPress,
    isLoading,
}: {
    range: RangeValue<ZonedDateTime> | null;
    setRange: (value: RangeValue<ZonedDateTime> | null) => void;
    unavailability: TCheckoutItemUnavailability[];
    isDisabled: boolean;
    cart: TCheckoutItem[];
    config: TConfig;
    inventory: TInventoryItem[];
    onPress: () => void;
    isLoading: boolean;
}) {
    const unavailablePairs = unavailability.map((u) => [
        timestampToZonedDateTime(u.start_time, config.schedule.timezone),
        timestampToZonedDateTime(u.end_time, config.schedule.timezone),
    ]);

    const day = days[config.schedule.first_display_day || 0];

    const invalidIndex = unavailablePairs.findIndex(
        (interval) =>
            range &&
            range.end.compare(interval[0]) >= 0 &&
            range.start.compare(interval[1]) <= 0,
    );

    const isInvalid = invalidIndex !== -1;

    const invalidName = isInvalid
        ? inventory.find(
              (i) => i.uuid === unavailability[invalidIndex].item_uuid,
          )?.name || "An item"
        : "";

    const errorMessage = isInvalid ? `${invalidName} is unavailable` : "";

    console.log("Pairs", unavailablePairs);

    return (
        <div className="flex flex-col 2xl:flex-row gap-4">
            <div className="flex flex-row gap-2 justify-between">
                <DateRangePicker<ZonedDateTime>
                    hideTimeZone
                    isDateUnavailable={(date) => {
                        return unavailablePairs.some(
                            (interval) =>
                                interval[0].compare(date) <= 0 &&
                                interval[1].compare(date) >= 0,
                        );
                    }}
                    isDisabled={isDisabled}
                    value={range}
                    onChange={setRange}
                    aria-label="Checkout Time"
                    color="primary"
                    minValue={today(getLocalTimeZone())}
                    firstDayOfWeek={day}
                    isInvalid={isInvalid}
                    errorMessage={errorMessage}
                    validationBehavior="native"
                    // TODO: Fix error message formatting
                    classNames={{
                        // label: "text-md",
                        base: "w-fit",
                        inputWrapper: "max-w-fit",
                        innerWrapper: "gap-0",
                        segment: "hidden",
                        separator: "hidden",
                        selectorIcon: "size-6",
                        calendarContent: "h-[275px]",
                    }}
                    // TODO: Consider adding quick 3 day button?
                    // CalendarBottomContent={
                    //     <div className="w-full p-2">

                    //     </div>
                    // }
                    calendarProps={{
                        content: "h-[300px]",
                    }}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <DateInput<ZonedDateTime>
                        aria-label="Checkout Start Date"
                        isReadOnly
                        isDisabled={isDisabled}
                        value={range?.start}
                        granularity="day"
                        hideTimeZone
                        className="w-fit"
                    />
                    <DateInput<ZonedDateTime>
                        aria-label="Checkout End Date"
                        isReadOnly
                        isDisabled={isDisabled}
                        value={range?.end}
                        granularity="day"
                        hideTimeZone
                        className="w-fit"
                    />
                </div>
            </div>

            <Button
                color="primary"
                variant="shadow"
                className="w-full"
                // TODO: Enable for admins
                isDisabled={isInvalid || isDisabled || cart.length === 0}
                onPress={onPress}
                isLoading={isLoading}
            >
                Checkout
            </Button>
        </div>
    );
}
