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
    Tooltip,
    useDisclosure,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { TUser, TUserRole, UserUUID } from "common/user";
import {
    CERTIFICATION_VISIBILITY,
    CertificationUUID,
    TCertification,
} from "../../../common/certification";
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
import CertificationsTable from "../../components/kiosks/admin/certifications/CTable";
import { CheckBadgeIcon, PercentBadgeIcon } from "@heroicons/react/24/solid";
import UsersTable from "../../components/kiosks/admin/users/UsersTable";
import GrantCertPopup from "../../components/kiosks/admin/checkouts/GrantCertPopup";
import AssignIDPopup from "../../components/kiosks/admin/checkouts/AssignIDPopup";
import { TPublicScheduleData } from "common/schedule";

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

export default function CheckoutsKiosk() {
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
            staleTime: 30 * 60 * 1000, // 30 minutes in milliseconds
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

    const [collegeID, setCollegeID] = useState("");
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

    const [validation, setValidation] = useState<TCheckoutValidation>({
        status: CHECKOUT_VALIDATION.VALID,
    });

    const addItemToCart = React.useCallback(
        (item?: TInventoryItem) => {
            // This callback format fixes a dependency array bug
            setCart((prevCart) => {
                if (!item) return prevCart;
                const newCart = [...prevCart];
                const existing_item = newCart.findIndex(
                    (c) => c.item_uuid === item.uuid,
                );
                if (existing_item !== -1) {
                    // Item already added to cart
                    // Increase quantity only if < item.quantity
                    // or item is relative quantity
                    if (
                        newCart[existing_item].quantity < item.quantity ||
                        item.quantity < 0
                    ) {
                        newCart[existing_item].quantity++;
                    }
                } else {
                    // Item not yet in cart, add to quantity
                    newCart.push({
                        item_uuid: item.uuid,
                        quantity: 1,
                        role: item.role,
                        linked_uuid: item.linked_uuid,
                    });
                }
                validationMutation.mutate({ cart: newCart });
                return newCart;
            });
        },
        [cart, setCart, validationMutation],
    );

    const removeItemFromCart = React.useCallback(
        (item_uuid: InventoryItemUUID, all?: boolean) => {
            // This callback format fixes a dependency array bug
            setCart((prevCart) => {
                const newCart = [...prevCart];
                if (!item_uuid) return prevCart;
                const existing_item = newCart.findIndex(
                    (c) => c.item_uuid === item_uuid,
                );
                if (existing_item === -1) {
                    // Item not in cart, nothing to change
                } else if (newCart[existing_item].quantity === 1 || all) {
                    // Remove item entirely
                    newCart.splice(existing_item, 1);
                } else {
                    newCart[existing_item].quantity--;
                }
                validationMutation.mutate({ cart: newCart });
                return newCart;
            });
        },
        [cart, setCart, validationMutation],
    );

    const [grantCert, setGrantCert] = useState<TCertification>();
    const [granting, setGranting] = useState<boolean>(true);
    const {
        isOpen: grantPopup,
        onOpenChange: changeGrantPopup,
        onOpen: openGrantPopup,
        onClose: closeGrantPopup,
    } = useDisclosure();

    const [missingIDUser, setMissingIDUser] = useState<TUser>();

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
                    collegeID={collegeID}
                    setCollegeID={setCollegeID}
                    setValidation={(v) => {
                        setValidation(v);
                        if (v.status === CHECKOUT_VALIDATION.VALID) {
                            setCart([]);
                        }
                        setUnavailability([]);
                    }}
                    removeItemFromCart={removeItemFromCart}
                />
                <div className="flex flex-col h-full w-full p-3 bg-default-50 rounded-xl overflow-auto">
                    <Tabs
                        color="primary"
                        size="lg"
                        radius="full"
                        classNames={{
                            panel: "overflow-auto h-full",
                        }}
                    >
                        <Tab key={"inventory"} title={"Inventory"}>
                            <InventoryTable
                                inventory={inventory ?? []}
                                roles={roles}
                                certifications={certs}
                                areas={areas}
                                restocks={[]}
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
                                showsKitContents={true}
                                extraColumns={[{ name: "Cart", id: "cart" }]}
                                defaultColumns={[
                                    "role",
                                    "name",
                                    "quantity_ratio",
                                    "locations",
                                    "required_certifications",
                                    "available_to",
                                    "visible_to",
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
                                                    removeItemFromCart(i.uuid)
                                                }
                                            />
                                        </div>
                                    ),
                                }}
                            />
                        </Tab>
                        <Tab key={"checkouts"} title={"Checkouts"}>
                            <CheckoutTable
                                key={user?.uuid}
                                checkouts={checkouts}
                                inventory={inventory ?? []}
                                users={users}
                                config={config}
                                activeSchedule={activeSchedule}
                                areas={areas}
                                certs={certs}
                                selectedKeys={new Set()}
                                isLoading={
                                    inventoryLoading ||
                                    checkoutsLoading ||
                                    usersLoading ||
                                    areasLoading ||
                                    certsLoading
                                }
                            />
                        </Tab>
                        <Tab key={"users"} title={"Users"}>
                            <UsersTable
                                users={users}
                                roles={roles}
                                certs={certs}
                                selectedKeys={new Set([user?.uuid ?? ""])}
                                onSelectionChange={(selection) => {
                                    if (selection === "all") return;
                                    const selectedUsers = Array.from(
                                        selection,
                                    ) as string[];
                                    const selectedUser = users.find(
                                        (u) => u.uuid === selectedUsers[0],
                                    );
                                    if (
                                        selectedUser &&
                                        selectedUser.college_id === "" &&
                                        collegeID &&
                                        !user
                                    ) {
                                        // Show assign college_id popup
                                        setMissingIDUser(selectedUser);
                                    } else if (
                                        selectedUser &&
                                        selectedUser.college_id
                                    ) {
                                        setCollegeID(selectedUser.college_id);
                                    }
                                }}
                                isLoading={usersLoading}
                                onCreate={undefined}
                                fullHeader={false}
                            />
                        </Tab>
                        <Tab key={"certifications"} title={"Certifications"}>
                            <CertificationsTable
                                key={user?.active_certificates
                                    ?.map((c) => c.certification_uuid)
                                    .join(",")} // Update any time user's certs change
                                certs={certs}
                                roles={roles}
                                selectedKeys={new Set()}
                                onSelectionChange={() => {}}
                                isLoading={certsLoading}
                                canEdit={false}
                                defaultColumns={[
                                    "name",
                                    "max_level",
                                    "seconds_valid_for",
                                    "prerequisites",
                                    "visible_to",
                                    "grant_revoke",
                                ]}
                                extraColumns={[
                                    {
                                        name: "Grant/Revoke",
                                        id: "grant_revoke",
                                    },
                                ]}
                                visibilities={[
                                    CERTIFICATION_VISIBILITY.PUBLIC,
                                    CERTIFICATION_VISIBILITY.PRIVATE,
                                ]}
                                customColumnComponents={{
                                    grant_revoke: (cert) => {
                                        const hasCert =
                                            (!!user &&
                                                user.active_certificates?.some(
                                                    (c) =>
                                                        c.certification_uuid ===
                                                        cert.uuid,
                                                )) ??
                                            false;
                                        const certHasPrereqs =
                                            cert.required_certifications !==
                                                undefined &&
                                            cert.required_certifications
                                                .length > 0;
                                        const userHasPrereqs =
                                            user &&
                                            user.active_certificates &&
                                            cert.required_certifications &&
                                            cert.required_certifications.every(
                                                (prereq) =>
                                                    user.active_certificates?.some(
                                                        (cert) =>
                                                            cert.certification_uuid ===
                                                                prereq.certification_uuid &&
                                                            cert.level >=
                                                                prereq.required_level,
                                                    ),
                                            );
                                        return (
                                            <Tooltip
                                                content={
                                                    !user
                                                        ? "Enter a user ID to grant certs"
                                                        : !!user &&
                                                            certHasPrereqs &&
                                                            !userHasPrereqs
                                                          ? "User is missing prerequisites"
                                                          : ""
                                                }
                                                color="secondary"
                                                isDisabled={
                                                    !!user &&
                                                    !(
                                                        certHasPrereqs &&
                                                        !userHasPrereqs
                                                    )
                                                }
                                            >
                                                <Button
                                                    startContent={
                                                        hasCert ? (
                                                            <PercentBadgeIcon className="size-6" />
                                                        ) : (
                                                            <CheckBadgeIcon className="size-6" />
                                                        )
                                                    }
                                                    color={
                                                        hasCert
                                                            ? "danger"
                                                            : "secondary"
                                                    }
                                                    variant="flat"
                                                    onPress={() => {
                                                        if (
                                                            !user ||
                                                            (certHasPrereqs &&
                                                                !userHasPrereqs)
                                                        ) {
                                                            return;
                                                        }
                                                        setGranting(!hasCert);
                                                        setGrantCert(cert);
                                                        openGrantPopup();
                                                    }}
                                                    className={
                                                        !user ||
                                                        (certHasPrereqs &&
                                                            !userHasPrereqs)
                                                            ? "!opacity-disabled"
                                                            : ""
                                                    }
                                                >
                                                    {hasCert
                                                        ? "Revoke"
                                                        : "Grant"}
                                                </Button>
                                            </Tooltip>
                                        );
                                    },
                                }}
                            />
                        </Tab>
                    </Tabs>
                </div>
            </div>
            <GrantCertPopup
                cert={grantCert}
                setCert={setGrantCert}
                user={user}
                granting={granting}
                setGranting={setGranting}
                isOpen={grantPopup}
                onOpenChange={changeGrantPopup}
            />
            <AssignIDPopup
                missingIDUser={missingIDUser}
                setMissingIDUser={setMissingIDUser}
                college_id={collegeID}
            />
        </AdminLayout>
    );
}
