import {
    InventoryItemUUID,
    ITEM_ACCESS_TYPE,
    ITEM_ROLE,
    TInventoryItem,
} from "../../../common/inventory";
import {
    Button,
    Selection,
    Spinner,
    Tab,
    Tabs,
    useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { TUser, TUserRole } from "common/user";
import { TCertification } from "common/certification";
import { TArea } from "common/area";
import {
    CHECKOUT_VALIDATION,
    TCheckout,
    TCheckoutItem,
    TCheckoutItemUnavailability,
    TCheckoutValidation,
} from "../../../common/checkout";
import {
    InformationCircleIcon,
    MinusIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "../../layouts/AdminLayout";
import InventoryTable from "../../components/kiosks/admin/inventory/InventoryTable";
import CheckoutTable from "../../components/kiosks/admin/checkouts/CheckoutTable";
import CheckoutSidebar from "../../components/kiosks/admin/checkouts/CheckoutSidebar";
import clsx from "clsx";
import axios from "axios";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import PopupAlert from "../../components/PopupAlert";

async function getCartUnavailability({ cart }: { cart: TCheckoutItem[] }) {
    return (
        await axios.post<TCheckoutItemUnavailability[]>(
            "/api/v3/checkout/unavailability",
            {
                checkout_items: cart,
            },
        )
    ).data;
}

export default function CheckoutsPage() {
    // Get all data
    const { data: checkouts, isLoading: checkoutsLoading } = useQuery<
        TCheckout[]
    >({
        queryKey: ["checkout"],
        refetchOnWindowFocus: false,
    });
    const { data: inventory, isLoading: inventoryLoading } = useQuery<
        TInventoryItem[]
    >({
        queryKey: ["inventory"],
        refetchOnWindowFocus: false,
    });
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
        },
    );
    const { data: areas, isLoading: areasLoading } = useQuery<TArea[]>({
        queryKey: ["area"],
        refetchOnWindowFocus: false,
    });
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });
    const { data: activeSchedule, isLoading: scheduleLoading } =
        useQuery<TSchedule>({
            queryKey: ["schedule", "active"],
            refetchOnWindowFocus: false,
        });

    const [selectedItems, setSelectedItems] = useState<Selection>(new Set());

    const [unavailability, setUnavailability] = useState<
        TCheckoutItemUnavailability[]
    >([]);

    const validationMutation = useMutation({
        mutationFn: getCartUnavailability,
        onSuccess: (data) => {
            setUnavailability(data);
        },
        onError: (data) => {
            alert("Error!"), console.log("error data", data);
        },
    });

    const [cart, setCart] = useState<TCheckoutItem[]>([]);

    const addItemToCart = React.useCallback(
        (item?: TInventoryItem) => {
            if (!item) return;
            const existing_item = cart.findIndex(
                (c) => c.item_uuid === item.uuid,
            );
            if (existing_item !== -1) {
                // Item already added to cart
                // Increase quantity only if < item.quantity
                // or item is relative quantity
                if (
                    cart[existing_item].quantity < item.quantity ||
                    item.quantity < 0
                ) {
                    cart[existing_item].quantity++;
                }
            } else {
                // Item not yet in cart, add to quantity
                cart.push({
                    item_uuid: item.uuid,
                    quantity: 1,
                    role: item.role,
                    linked_uuid: item.linked_uuid,
                });
            }
            setCart([...cart]);
            validationMutation.mutate({ cart: cart });
        },
        [cart, setCart, validationMutation],
    );

    const removeItemFromCart = React.useCallback(
        (item: TInventoryItem) => {
            if (!item) return;
            const existing_item = cart.findIndex(
                (c) => c.item_uuid === item.uuid,
            );
            if (existing_item === -1) {
                // Item not in cart, nothing to change
            } else if (cart[existing_item].quantity === 1) {
                // Remove item entirely
                cart.splice(existing_item, 1);
            } else {
                cart[existing_item].quantity--;
            }
            setCart([...cart]);
            validationMutation.mutate({ cart: cart });
        },
        [cart, setCart, validationMutation],
    );

    const [validation, setValidation] = useState<TCheckoutValidation>({
        status: CHECKOUT_VALIDATION.VALID,
    });

    const {
        isOpen: validationPopup,
        onOpenChange: changeValidationPopup,
        onOpen: openValidationPopup,
        onClose: closeValidationPopup,
    } = useDisclosure();

    if (
        !checkouts ||
        !inventory ||
        !users ||
        !roles ||
        !certs ||
        !areas ||
        !config ||
        !activeSchedule ||
        checkoutsLoading ||
        inventoryLoading ||
        usersLoading ||
        rolesLoading ||
        certsLoading ||
        areasLoading ||
        configLoading ||
        scheduleLoading
    ) {
        return (
            <div className="w-full h-screen flex justify-center py-auto">
                <Spinner />
            </div>
        );
    }

    let validationError = "Checkout submitted";
    if (validation.status === CHECKOUT_VALIDATION.NO_USER) {
        validationError = "No user selected";
    } else if (validation.status === CHECKOUT_VALIDATION.NO_ITEMS) {
        validationError = "No items in cart";
    } else if (validation.status === CHECKOUT_VALIDATION.MISSING_CERT) {
        validationError = "User missing required certification";
        const cert = certs.find((c) => c.uuid === validation.error_uuid);
        if (validation.error_uuid && cert) {
            validationError += `\n'${cert.name}'`;
        }
        const item = inventory.find((i) => i.uuid === validation.item_uuid);
        if (validation.item_uuid && item) {
            validationError += ` for item '${item.name}'`;
        }
    } else if (validation.status === CHECKOUT_VALIDATION.MISSING_ROLE) {
        validationError = "User has no authorized roles";
        const item = inventory.find((i) => i.uuid === validation.item_uuid);
        if (validation.item_uuid && item) {
            validationError += ` for item '${item.name}'`;
        }
    } else if (validation.status === CHECKOUT_VALIDATION.UNAVAILABLE) {
        validationError = "Item";
        const item = inventory.find((i) => i.uuid === validation.item_uuid);
        if (validation.item_uuid && item) {
            validationError += ` '${item.name}'`;
        }
        validationError += " is unavailable";
    }

    return (
        <AdminLayout pageHref={"/admin/checkouts"} className="max-w-full px-4">
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-4 p-1">
                <CheckoutSidebar
                    cart={cart}
                    setCart={setCart}
                    unavailability={unavailability}
                    checkouts={checkouts}
                    inventory={inventory}
                    certs={certs}
                    roles={roles}
                    config={config}
                    activeSchedule={activeSchedule}
                    setValidation={(v) => {
                        setValidation(v);
                        openValidationPopup();
                        if (v.status === CHECKOUT_VALIDATION.VALID) {
                            setCart([]);
                        }
                        setUnavailability([]);
                    }}
                />
                <div className="h-full w-full p-3 bg-default-50 rounded-xl overflow-auto">
                    <Tabs
                        color="primary"
                        size="lg"
                        radius="full"
                        // classNames={{
                        //     base: "w-full bg-default-100 rounded-lg",
                        //     tabList: "mx-auto",
                        // }}
                    >
                        <Tab key={"inventory"} title={"Inventory"}>
                            <InventoryTable
                                inventory={inventory ?? []}
                                roles={roles}
                                certifications={certs}
                                areas={areas}
                                selectedKeys={
                                    new Set(cart.map((i) => i.item_uuid))
                                }
                                onSelectionChange={() => {}} // not used
                                // doubleClickAction={(uuid) => {
                                //     addItemToCart(
                                //         inventory.find((i) => i.uuid === uuid),
                                //     );
                                // }}
                                multiSelect={true}
                                isLoading={inventoryLoading}
                                extraColumns={[{ name: "Cart", id: "cart" }]}
                                defaultColumns={[
                                    "role",
                                    "name",
                                    "quantity_ratio",
                                    "locations",
                                    "required_certifications",
                                    "authorized_roles",
                                    "cart",
                                ]}
                                customColumnComponents={{
                                    cart: (i) => (
                                        <div
                                            className={clsx(
                                                "flex flex-row gap-1 bg-default-300",
                                                "rounded-md p-1 w-fit",
                                            )}
                                        >
                                            <Button
                                                size="sm"
                                                isIconOnly
                                                color="success"
                                                className="rounded-sm"
                                                startContent={
                                                    <PlusIcon className="size-5" />
                                                }
                                                onPress={() => addItemToCart(i)}
                                            />
                                            <Button
                                                size="sm"
                                                isIconOnly
                                                color="danger"
                                                className="rounded-sm"
                                                startContent={
                                                    <MinusIcon className="size-5" />
                                                }
                                                onPress={() =>
                                                    removeItemFromCart(i)
                                                }
                                            />
                                        </div>
                                    ),
                                }}
                            />
                        </Tab>
                        <Tab key={"checkouts"} title={"Checkouts"}>
                            <CheckoutTable
                                checkouts={checkouts}
                                inventory={inventory ?? []}
                                users={users}
                                config={config}
                                selectedKeys={new Set()}
                                isLoading={inventoryLoading}
                            />
                        </Tab>
                    </Tabs>
                </div>
            </div>
            <PopupAlert
                isOpen={validationPopup}
                onOpenChange={changeValidationPopup}
                color={
                    validation.status === CHECKOUT_VALIDATION.VALID
                        ? "success"
                        : "danger"
                }
                description={validationError}
                className="sm:w-1/3"
                timeout={5000}
            />
        </AdminLayout>
    );
}
