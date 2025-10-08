import {
    TInventoryItem,
    ITEM_ROLE,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import {
    addToast,
    Button,
    Form,
    Input,
    RangeValue,
    Selection,
    useDisclosure,
} from "@heroui/react";
import React, { useState } from "react";
import { TCertification } from "common/certification";
import { TUser, TUserRole, UserUUID } from "common/user";
import clsx from "clsx";
import {
    CHECKOUT_VALIDATION,
    TCheckout,
    TCheckoutItem,
    TCheckoutItemUnavailability,
    TCheckoutValidation,
} from "../../../../../common/checkout";
import CheckoutUser from "./CheckoutUser";
import CheckoutDateSelect from "./CheckoutDateSelect";
import { TConfig } from "common/config";
import { now, ZonedDateTime } from "@internationalized/date";
import { TSchedule } from "common/schedule";
import {
    timestampToTime,
    timeToTimestamp,
    zonedDateTimeToTimestamp,
} from "../../../../utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UnixTimestamp } from "common/global";
import PopupAlert from "../../../PopupAlert";
import {
    InformationCircleIcon,
    ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

async function createCheckout({
    user_uuid,
    cart,
    timestamp_out,
    timestamp_due,
}: {
    user_uuid: UserUUID;
    cart: TCheckoutItem[];
    timestamp_out: UnixTimestamp;
    timestamp_due: UnixTimestamp;
}): Promise<{
    validation: TCheckoutValidation;
    checkout?: TCheckout;
}> {
    const checkout_obj: TCheckout = {
        uuid: crypto.randomUUID(),
        items: cart,
        checked_out_by: user_uuid,
        timestamp_out: timestamp_out,
        timestamp_due: timestamp_due,
    };
    const validation = (
        await axios.post<TCheckoutValidation>("/api/v3/checkout/validate", {
            checkout_obj: checkout_obj,
        })
    ).data;
    // Only create the checkout if it is valid
    if (validation.status === CHECKOUT_VALIDATION.VALID) {
        const checkout = (
            await axios.post<TCheckout>("/api/v3/checkout/", {
                checkout_obj: checkout_obj,
            })
        ).data;
        return {
            validation: validation,
            checkout: checkout,
        };
    } else {
        return {
            validation: validation,
        };
    }
}

export default function CheckoutSidebar({
    cart,
    setCart,
    unavailability,
    checkouts,
    inventory,
    certs,
    roles,
    config,
    activeSchedule,
    collegeID,
    setCollegeID,
    setValidation,
}: {
    cart: TCheckoutItem[];
    setCart: (items: TCheckoutItem[]) => void;
    unavailability: TCheckoutItemUnavailability[];
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
    certs: TCertification[];
    roles: TUserRole[];
    config: TConfig;
    activeSchedule: TSchedule;
    collegeID: string;
    setCollegeID: (id: string) => void;
    setValidation: (v: TCheckoutValidation) => void;
}) {
    const {
        data: user,
        isLoading,
        isError,
    } = useQuery<TUser>({
        queryKey: ["user", "by", "id", collegeID],
        refetchOnWindowFocus: false,
        enabled: !!collegeID,
        retry: false,
    });

    const [range, setRange] = useState<RangeValue<ZonedDateTime> | null>(null);

    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: createCheckout,
        onSuccess: (data) => {
            setValidation(data.validation);
            if (
                data.validation.status === CHECKOUT_VALIDATION.VALID &&
                data.checkout
            ) {
                queryClient.setQueryData(
                    ["checkout", data.checkout.uuid],
                    data.checkout,
                );
                queryClient.setQueryData(["checkout"], (old: TCheckout[]) => [
                    ...old,
                    data.checkout,
                ]);
                queryClient.refetchQueries({ queryKey: ["inventory"] });
                setRange(null);
                setCollegeID("");
            }
        },
        onError: (error) => alert(error),
    });

    const [mobileCart, setMobileCart] = useState(false);

    return (
        <div
            className={clsx(
                "flex flex-col rounded-xl bg-default-50 p-4",
                "h-2/5 lg:h-full overflow-auto",
                // "w-full lg:w-2/3 xl:w-1/2 2xl:w-1/3",
                "w-full lg:w-[27%] flex-none gap-4",
            )}
        >
            <div
                className={clsx(
                    "grow-0 sm:h-[50%] flex flex-col gap-4 w-full",
                    mobileCart && "hidden sm:flex",
                )}
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        const newID = data.get("college_id") as string;
                        setCollegeID(newID || "");
                        if (newID) {
                            const endTime = timestampToTime(
                                activeSchedule.daily_close_time,
                            );
                            const currentDate = now(config.schedule.timezone);
                            const endDate = currentDate.set({
                                hour: endTime.hour,
                                minute: endTime.minute,
                                second: endTime.second,
                                millisecond: endTime.millisecond,
                            });

                            const defaultRange = {
                                start: currentDate,
                                end:
                                    endDate.compare(currentDate) <= 0
                                        ? endDate.add({ days: 1 })
                                        : endDate,
                            };
                            setRange(defaultRange);
                        }
                    }}
                    className="flex flex-row gap-2 h-fit box-border items-center"
                >
                    <Input
                        key={collegeID}
                        type="text"
                        name="college_id"
                        size="lg"
                        color="primary"
                        placeholder="Enter college ID..."
                        defaultValue={collegeID}
                        autoFocus
                        aria-label="Enter College ID"
                        variant="bordered"
                        onClear={() => setCollegeID("")}
                        className="-mb-2"
                        classNames={{
                            input: "placeholder:text-default-400",
                            inputWrapper: clsx(
                                "border-primary-300 transition-colors-opacity",
                                "data-[hover=true]:border-primary-200",
                                "group-data-[focus=true]:border-primary-400",
                            ),
                        }}
                    />
                    <Button
                        isIconOnly
                        endContent={<ShoppingCartIcon className="size-5" />}
                        className="sm:hidden self-center mt-2 mr-2"
                        color="primary"
                        variant="ghost"
                        size="sm"
                        onPress={() => setMobileCart(!mobileCart)}
                    />
                </Form>
                <CheckoutUser
                    college_id={collegeID}
                    certs={certs}
                    roles={roles}
                />
            </div>
            <div
                className={clsx(
                    "flex flex-col gap-4 h-full",
                    !mobileCart && "hidden sm:flex",
                )}
            >
                <div
                    className={clsx(
                        "flex flex-col h-full w-full bg-default-100",
                        "rounded-xl p-2 overflow-auto",
                    )}
                >
                    <div className="flex flex-row">
                        <div className="flex-1 w-full"></div>
                        <div className="flex-1 text-xl font-semibold text-center w-full pb-2">
                            Cart
                        </div>
                        <div className="flex-1 w-full flex justify-end">
                            <Button
                                isIconOnly
                                endContent={
                                    <ShoppingCartIcon className="size-5" />
                                }
                                className="sm:hidden "
                                size="sm"
                                color="primary"
                                variant="ghost"
                                onPress={() => setMobileCart(!mobileCart)}
                            />
                        </div>
                    </div>

                    <div
                        className={clsx(
                            "bg-default-200 rounded-lg w-full h-full overflow-y-auto",
                            "p-2 flex flex-col gap-2",
                        )}
                    >
                        {cart.map((item) => (
                            <div
                                key={item.item_uuid}
                                className={clsx(
                                    "bg-default-300 text-default-700 p-2 pl-3 text-lg",
                                    "flex flex-row justify-between rounded-md",
                                    "items-center",
                                )}
                            >
                                {inventory.find(
                                    (i) => i.uuid === item.item_uuid,
                                )?.name || "Unknown Item"}
                                <div className="bg-default-100 text-default-700 rounded-sm py-2 px-3 aspect-square text-center">
                                    {item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <CheckoutDateSelect
                    range={range}
                    setRange={setRange}
                    unavailability={unavailability}
                    isDisabled={!collegeID}
                    cart={cart}
                    config={config}
                    inventory={inventory}
                    onPress={() => {
                        if (!user?.uuid || !range) {
                            return;
                        } else {
                            createMutation.mutate({
                                user_uuid: user.uuid,
                                cart: cart,
                                timestamp_out: zonedDateTimeToTimestamp(
                                    range.start,
                                ),
                                timestamp_due: zonedDateTimeToTimestamp(
                                    range.end,
                                ),
                            });
                        }
                    }}
                    isLoading={createMutation.isPending}
                />
            </div>
        </div>
    );
}
