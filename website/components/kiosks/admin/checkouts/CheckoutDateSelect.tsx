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
import { timestampToTime, timestampToZonedDateTime } from "../../../../utils";
import {
    Button,
    ButtonGroup,
    DateInput,
    DateRangePicker,
    RangeValue,
} from "@heroui/react";
import {
    ZonedDateTime,
    today,
    getLocalTimeZone,
    now,
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
    dailyCloseTime,
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
    dailyCloseTime: UnixTimestamp;
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

    const setDayRange = (days: number) => {
        const endTime = timestampToTime(dailyCloseTime);
        const currentDate = now(config.schedule.timezone);
        const endDate = currentDate.add({ days: days }).set({
            hour: endTime.hour,
            minute: endTime.minute,
            second: endTime.second,
            millisecond: endTime.millisecond,
        });
        setRange({
            start: currentDate,
            end: endDate,
        });
    };

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
                        // base: "w-fit",
                        inputWrapper: " bg-default-200",
                        // segment: "hidden",
                        // separator: "hidden",
                        selectorIcon: "size-6",
                        selectorButton: "order-first mr-0",
                        calendarContent: "h-[300px]",
                        timeInput: "pb-2 flex",
                        bottomContent: "gap-0",
                        input: "[&>*:nth-child(n+6)]:hidden",
                    }}
                    CalendarBottomContent={
                        <div className="px-5">
                            <ButtonGroup size="sm" fullWidth>
                                <Button
                                    variant="faded"
                                    className="font-medium"
                                    onPress={() => setDayRange(1)}
                                >
                                    1 Day
                                </Button>
                                <Button
                                    variant="faded"
                                    className="font-medium"
                                    onPress={() => setDayRange(3)}
                                >
                                    3 Days
                                </Button>
                            </ButtonGroup>
                        </div>
                    }
                    calendarProps={{
                        content: "h-[300px]",
                    }}
                />
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
