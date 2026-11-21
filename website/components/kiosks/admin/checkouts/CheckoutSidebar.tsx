import {
    TInventoryItem,
    InventoryItemUUID,
} from "../../../../../common/inventory";
import {
    addToast,
    Button,
    Form,
    Input,
    RangeValue,
    useDisclosure,
} from "@heroui/react";
import { useCallback, useState } from "react";
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
import { now, ZonedDateTime } from "@internationalized/date";
import { TSchedule } from "common/schedule";
import {
    timestampToTime,
    zonedDateTimeToTimestamp,
    useMediaQuery,
} from "../../../../utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UnixTimestamp } from "common/global";
import { ShoppingCartIcon, TrashIcon } from "@heroicons/react/24/outline";
import { validateCollegeID } from "../../../../../common/verify";
import CheckoutDisclaimerModal from "./CheckoutDisclaimerModal";
import { UserChip } from "../../../user/UserChip";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";
import { useConfig } from "../../../../queries/useConfig";

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
    inventory,
    certs,
    roles,
    activeSchedule,
    collegeID,
    setCollegeID,
    setValidation,
    removeItemFromCart,
}: {
    cart: TCheckoutItem[];
    setCart: (items: TCheckoutItem[]) => void;
    unavailability: TCheckoutItemUnavailability[];
    inventory: TInventoryItem[];
    certs: TCertification[];
    roles: TUserRole[];
    activeSchedule: TSchedule;
    collegeID: string;
    setCollegeID: (id: string) => void;
    setValidation: (v: TCheckoutValidation) => void;
    removeItemFromCart: (item_uuid: InventoryItemUUID, all?: boolean) => void;
}) {
    const config = useConfig();
    const { data: user, refetch: refetchUser } = useQuery<TUser>({
        queryKey: ["user", "by", "id", collegeID],
        refetchOnWindowFocus: false,
        enabled: !!collegeID,
        retry: false,
    });
    const initialTime = timestampToTime(activeSchedule.daily_close_time);
    const [range, setRange] = useState<RangeValue<ZonedDateTime> | null>({
        start: now(config.schedule.timezone),
        end: now(config.schedule.timezone).set({
            hour: initialTime.hour,
            minute: initialTime.minute,
            second: initialTime.second,
            millisecond: initialTime.millisecond,
        }),
    });

    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: createCheckout,
        onSuccess: (data) => {
            let validation = data.validation;

            let validationError = "Checkout submitted";
            if (validation.status === CHECKOUT_VALIDATION.NO_USER) {
                validationError = "No user selected";
            } else if (validation.status === CHECKOUT_VALIDATION.NO_ITEMS) {
                validationError = "No items in cart";
            } else if (validation.status === CHECKOUT_VALIDATION.MISSING_CERT) {
                validationError = "User missing required certification";
                const cert = certs.find(
                    (c) => c.uuid === validation.error_uuid,
                );
                if (validation.error_uuid && cert) {
                    validationError += `\n'${cert.name}'`;
                }
                const item = inventory.find(
                    (i) => i.uuid === validation.item_uuid,
                );
                if (validation.item_uuid && item) {
                    validationError += ` for item '${item.name}'`;
                }
            } else if (validation.status === CHECKOUT_VALIDATION.MISSING_ROLE) {
                validationError = "User has no authorized roles";
                const item = inventory.find(
                    (i) => i.uuid === validation.item_uuid,
                );
                if (validation.item_uuid && item) {
                    validationError += ` for item '${item.name}'`;
                }
            } else if (validation.status === CHECKOUT_VALIDATION.UNAVAILABLE) {
                validationError = "Item";
                const item = inventory.find(
                    (i) => i.uuid === validation.item_uuid,
                );
                if (validation.item_uuid && item) {
                    validationError += ` '${item.name}'`;
                }
                validationError += " is unavailable";
            }

            addToast({
                title: `${validationError}`,
                color:
                    validation.status === CHECKOUT_VALIDATION.VALID
                        ? "success"
                        : "danger",
            });

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
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const submitCheckout = useCallback(() => {
        if (!user?.uuid || !range) {
            return;
        } else {
            createMutation.mutate({
                user_uuid: user.uuid,
                cart: cart,
                timestamp_out: zonedDateTimeToTimestamp(range.start),
                timestamp_due: zonedDateTimeToTimestamp(range.end),
            });
        }
    }, [user, range, createMutation]);

    const cart_uuids = cart.map((i) => i.item_uuid);
    // Find all items with checkout disclaimers in the cart
    const itemsWithDisclaimers = inventory
        .filter((i) => cart_uuids.includes(i.uuid))
        .filter((i) => i.checkout_disclaimer);

    const {
        isOpen: checkoutDisclaimerOpen,
        onOpen: checkoutDisclaimerOnOpen,
        onOpenChange: checkoutDisclaimerOpenChange,
    } = useDisclosure();

    const isMobile = useMediaQuery("(max-width: 640px)");

    return (
        <div
            className={clsx(
                "flex flex-col rounded-xl bg-default-50 p-1 sm:p-4",
                "h-fit sm:h-2/5 lg:h-full overflow-auto",
                // "w-full lg:w-2/3 xl:w-1/2 2xl:w-1/3",
                "w-full lg:w-[27%] flex-none gap-1 sm:gap-4",
            )}
        >
            <div
                className={clsx(
                    "grow-0 flex flex-col gap-4 w-full",
                )}
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        const id = (data.get("college_id") as string) || "";
                        const validatedID = validateCollegeID(id);
                        setCollegeID(validatedID);
                        if (validatedID) {
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
                            refetchUser();
                        }
                    }}
                    className="flex flex-row gap-2 h-fit box-border items-center"
                >
                    <Input
                        key={collegeID}
                        type="text"
                        name="college_id"
                        size={`${isMobile ? "sm" : "lg"}`}
                        color="primary"
                        placeholder="Enter College ID..."
                        defaultValue={collegeID}
                        autoFocus
                        aria-label="Enter College ID"
                        variant="bordered"
                        onClear={() => setCollegeID("")}
                        className="flex-1 min-w-0"
                        classNames={{
                            input: "placeholder:text-default-400",
                            inputWrapper: clsx(
                                "border-primary-300 transition-colors-opacity",
                                "data-[hover=true]:border-primary-200",
                                "group-data-[focus=true]:border-primary-400",
                            ),
                        }}
                    />
                    <div className="sm:hidden shrink-0 w-40 h-10 bg-default-300 rounded-md flex items-center justify-center overflow-hidden">
                        {user && user.uuid ? (
                            <UserChip
                                user_uuid={user.uuid}
                                size="sm"
                                className="min-w-0 w-full justify-center"
                            />
                        ) : (
                            <p className="text-sm">No user selected</p>
                        )}
                    </div>
                </Form>

                <div className="hidden sm:flex">
                    <CheckoutUser
                        college_id={collegeID}
                        certs={certs}
                        roles={roles}
                    />
                </div>
            </div>
            <div
                className="hidden sm:flex flex-col gap-4 h-full"
            >
                <div
                    className={clsx(
                        "flex flex-col h-full w-full bg-default-100",
                        "rounded-xl p-2 overflow-auto",
                    )}
                >
                    <div className="flex flex-row">
                        <div className="flex-1 text-xl font-semibold text-center w-full pb-2">
                            Cart
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
                                <Button
                                    isIconOnly
                                    size="lg"
                                    radius="sm"
                                    color="danger"
                                    variant="flat"
                                    onPress={() =>
                                        removeItemFromCart(item.item_uuid, true)
                                    }
                                    className="hover:bg-danger/20 bg-default-100"
                                >
                                    <TrashIcon
                                        className={clsx(
                                            "group-hover:opacity-100 opacity-0",
                                            "transition-opacity size-5",
                                        )}
                                    />
                                    <div
                                        className={clsx(
                                            "absolute group-hover:opacity-0",
                                            "transition-opacity text-default-700",
                                        )}
                                    >
                                        {item.quantity}
                                    </div>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                <CheckoutDateSelect
                    range={range}
                    setRange={setRange}
                    unavailability={unavailability}
                    isDisabled={!collegeID}
                    dailyCloseTime={activeSchedule.daily_close_time}
                    cart={cart}
                    inventory={inventory}
                    // If any items have a disclaimer, open the disclaimer popup before checkout
                    onPress={() => {
                        itemsWithDisclaimers.length > 0
                            ? checkoutDisclaimerOnOpen()
                            : submitCheckout();
                    }}
                    isLoading={createMutation.isPending}
                />
                <CheckoutDisclaimerModal
                    type="checkout"
                    items={itemsWithDisclaimers}
                    onSubmit={submitCheckout}
                    isOpen={checkoutDisclaimerOpen}
                    onOpenChange={checkoutDisclaimerOpenChange}
                />
            </div>
            <div className="flex flex-col h-full sm:hidden">
                <Popover placement="bottom">
                    <PopoverTrigger>
                        <Button
                            startContent={
                                <ShoppingBagIcon className="size-5" />
                            }
                            className="flex-1 text-l font-semibold text-center w-full p-2 justify-items-center px-3 bg-default-300"
                        >
                            Cart
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full">
                        <div
                            className={clsx(
                                "bg-default-200 rounded-lg w-80 min-h-32 overflow-y-auto",
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
                                    <Button
                                        isIconOnly
                                        size="lg"
                                        radius="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() =>
                                            removeItemFromCart(
                                                item.item_uuid,
                                                true,
                                            )
                                        }
                                        className="hover:bg-danger/20 bg-default-100"
                                    >
                                        <TrashIcon
                                            className={clsx(
                                                "group-hover:opacity-100 opacity-0",
                                                "transition-opacity size-5",
                                            )}
                                        />
                                        <div
                                            className={clsx(
                                                "absolute group-hover:opacity-0",
                                                "transition-opacity text-default-700",
                                            )}
                                        >
                                            {item.quantity}
                                        </div>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className='w-full py-2'>
                            <CheckoutDateSelect
                            range={range}
                            setRange={setRange}
                            unavailability={unavailability}
                            isDisabled={!collegeID}
                            dailyCloseTime={activeSchedule.daily_close_time}
                            cart={cart}
                            config={config}
                            inventory={inventory}
                            // If any items have a disclaimer, open the disclaimer popup before checkout
                            onPress={() => {
                                itemsWithDisclaimers.length > 0
                                    ? checkoutDisclaimerOnOpen()
                                    : submitCheckout();
                            }}
                            isLoading={createMutation.isPending}
                            
                        />
                        <CheckoutDisclaimerModal
                            type="checkout"
                            items={itemsWithDisclaimers}
                            onSubmit={submitCheckout}
                            isOpen={checkoutDisclaimerOpen}
                            onOpenChange={checkoutDisclaimerOpenChange}
                        />
                        </div>
                        
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
