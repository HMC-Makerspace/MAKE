import {
    Input,
    Selection,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Tooltip,
    addToast,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    EnvelopeIcon,
    ArrowTurnDownLeftIcon,
    ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import {
    ITEM_ACCESS_DESCRIPTORS,
    ITEM_RELATIVE_QUANTITY,
    ITEM_ROLE,
    TInventoryItem,
} from "../../../../../common/inventory";
import MAKETable from "../../../Table";
import Fuse, { FuseGetFunction } from "fuse.js";
import React from "react";
import { TUser, TUserRole } from "common/user";
import { TCertification } from "common/certification";
import clsx from "clsx";
import CertificationTag from "../certifications/CertificationTag";
import UserRole from "../../../user/UserRole";
import { TArea } from "common/area";
import { TCheckout } from "common/checkout";
import { TConfig } from "common/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UUID } from "common/global";
import axios from "axios";

const baseColumns = [
    // { name: "UUID", id: "uuid" },
    { name: "Checked Out", id: "timestamp_out" },
    { name: "Due", id: "timestamp_due" },
    { name: "Checked In", id: "timestamp_in" },
    { name: "User", id: "checked_out_by" },
    { name: "Items", id: "items" },
    { name: "Reminders Sent", id: "notifications_sent" },
    // { name: "Extend", id: "extend"}, // TODO: consider extensions
    { name: "Return", id: "return" },
];

async function returnCheckout({ checkout_uuid }: { checkout_uuid: UUID }) {
    return (
        await axios.patch<TCheckout>(`/api/v3/checkout/${checkout_uuid}/return`)
    ).data;
}

async function undoReturnCheckout({ checkout_uuid }: { checkout_uuid: UUID }) {
    return (
        await axios.patch<TCheckout>(`/api/v3/checkout/${checkout_uuid}/turn`)
    ).data;
}

export default function CheckoutTable({
    checkouts,
    inventory,
    users: usersParam,
    config,
    selectedKeys,
    multiSelect = true,
    isLoading,
    extraColumns = [],
    defaultColumns = [
        "timestamp_out",
        "timestamp_due",
        "timestamp_in",
        "checked_out_by",
        "items",
        "notifications_sent",
        "return",
    ],
    customColumnComponents,
}: {
    checkouts: TCheckout[];
    inventory: TInventoryItem[];
    users?: TUser[];
    config: TConfig;
    selectedKeys: Selection;
    multiSelect?: boolean;
    isLoading: boolean;
    extraColumns?: { name: string; id: string }[];
    defaultColumns?: string[];
    customColumnComponents?: {
        [column_id: string]: (item: TCheckout) => React.ReactNode;
    };
}) {
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
        enabled: !usersParam,
    });
    const queryClient = useQueryClient();
    const returnMutation = useMutation({
        mutationFn: returnCheckout,
        onSuccess: (data) => {
            queryClient.setQueryData(["checkout", data.uuid], data);
            queryClient.setQueryData(["checkout"], (old: TCheckout[]) =>
                old.map((c) => (c.uuid === data.uuid ? data : c)),
            );
            // Update item availability
            queryClient.refetchQueries({ queryKey: ["inventory"] });
            addToast({
                title: `Successfully returned checkout`,
                timeout: 3000,
                color: "success",
                severity: "success",
            });

        },
    });
    const undoMutation = useMutation({
        mutationFn: undoReturnCheckout,
        onSuccess: (data) => {
            queryClient.setQueryData(["checkout", data.uuid], data);
            queryClient.setQueryData(["checkout"], (old: TCheckout[]) =>
                old.map((c) => (c.uuid === data.uuid ? data : c)),
            );
            // Update item availability
            queryClient.refetchQueries({ queryKey: ["inventory"] });
            addToast({
                title: `Undid checkout return`,
                timeout: 3000,
                color: "warning",
                severity: "warning",
            });
        },
    });
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");

    const columns = baseColumns.concat(extraColumns);

    // A fuse instance for filtering the content, memoized to prevent
    // unnecessary reinitialization on every render but updated when the
    // content changes
    const fuse = React.useMemo(() => {
        return new Fuse(checkouts, {
            keys: ["checked_out_by", "items"],
            getFn: (obj, path) => {
                if (isLoading) {
                    return obj.uuid;
                }
                if (path === "checked_out_by") {
                    // Get user name
                    return (
                        users?.find((u) => u.uuid === obj.checked_out_by)
                            ?.name || "Unknown User"
                    );
                } else if (path === "items") {
                    // Get all item names, long names, and keywords
                    const item_uuids = obj.items.map((i) => i.item_uuid);
                    const items = inventory.filter((i) =>
                        item_uuids.includes(i.uuid),
                    );
                    return items
                        .map((i) => i.name)
                        .concat(
                            items.map((i) => i.long_name || ""),
                            items.map((i) => i.keywords?.join(", ") || ""),
                        );
                } else {
                    return obj.uuid;
                }
            },
            threshold: 0.3,
        });
    }, [checkouts, users, inventory]);

    // The list of items after filtering and sorting
    const filteredCheckouts = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return checkouts;
        }
    }, [checkouts, fuse, search]);

    const sortedFilteredCheckouts = React.useMemo(() => {
        return filteredCheckouts.toSorted((a, b) => {
            // If either item is checked in, put it after
            if (a.timestamp_in && !b.timestamp_in) {
                return 1;
            } else if (b.timestamp_in && !a.timestamp_in) {
                return -1;
            } else if (!a.timestamp_in && !b.timestamp_in) {
                // If neither are checked in, sort by soonest checkout first
                return (
                    a.timestamp_out - b.timestamp_out ||
                    a.timestamp_due - b.timestamp_due
                );
            } else if (a.timestamp_in && b.timestamp_in) {
                // If both are checked in, sort by most recently checked in
                return (
                    b.timestamp_in - a.timestamp_in ||
                    b.timestamp_out - a.timestamp_out
                );
            }
            return 0;
        });
    }, [filteredCheckouts]);

    const numCheckouts = checkouts.length;
    const numActiveCheckouts = checkouts.filter((c) => !c.timestamp_in).length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const renderTimestamp = (
        timestamp: "timestamp_out" | "timestamp_due" | "timestamp_in",
    ) => {
        return (checkout: TCheckout) => (
            <h2 className="text-center whitespace-break-spaces">
                {checkout[timestamp]
                    ? new Date(checkout[timestamp] * 1000).toLocaleString(
                          undefined,
                          {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                          },
                      )
                    : ""}
            </h2>
        );
    };

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div
                id="inventory-table-top-content"
                className="flex flex-col gap-4"
            >
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%] text-for"
                        placeholder="Search..."
                        startContent={<SearchIcon className="size-6" />}
                        value={search}
                        onClear={() => setSearch("")}
                        onValueChange={onInputChange}
                        isDisabled={isLoading}
                        classNames={{
                            input: "placeholder:text-foreground-200",
                        }}
                    />
                    {/* TODO: add a tab selector to change from active/future/past checkouts */}
                    <div className="gap-3 flex">
                        <div className="hidden sm:block">
                            <Dropdown isDisabled={isLoading}>
                                <DropdownTrigger>
                                    <Button
                                        endContent={
                                            <ChevronDownIcon className="size-6 text-small" />
                                        }
                                        variant="flat"
                                        tabIndex={-1}
                                    >
                                        Columns
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    disallowEmptySelection
                                    aria-label="Table Columns"
                                    closeOnSelect={false}
                                    selectedKeys={visibleColumns}
                                    selectionMode="multiple"
                                    onSelectionChange={setVisibleColumns}
                                >
                                    {columns.map((column) => (
                                        <DropdownItem
                                            key={column.id}
                                            className="capitalize"
                                        >
                                            {column.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numActiveCheckouts} active of {numCheckouts}{" "}
                        checkouts
                    </span>
                </div>
            </div>
            <MAKETable
                content={sortedFilteredCheckouts}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                multiSelect={multiSelect}
                showSelectionCheckboxes={false}
                customColumnComponents={{
                    timestamp_out: renderTimestamp("timestamp_out"),
                    timestamp_due: renderTimestamp("timestamp_due"),
                    timestamp_in: renderTimestamp("timestamp_in"),
                    // put stuff here
                    checked_out_by: (c) => {
                        const user = users?.find(
                            (u) => u.uuid === c.checked_out_by,
                        );
                        return user?.name || "Unknown User";
                    },
                    items: (c) => (
                        <div className="flex flex-row gap-1.5 flex-wrap">
                            {c.items.map((i) => (
                                <div
                                    key={i.item_uuid}
                                    className={clsx(
                                        "flex flex-row w-fit whitespace-nowrap",
                                        "rounded-lg bg-default-200 p-2 gap-2",
                                        "items-center",
                                    )}
                                >
                                    <div className="text-md">{i.quantity}</div>
                                    <div className="text-xs text-center pt-[1px]">
                                        {"✕"}
                                    </div>
                                    <div className="text-md">
                                        {inventory.find(
                                            (item) => item.uuid === i.item_uuid,
                                        )?.name || "Unknown Item"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ),
                    notifications_sent: (c) => (
                        <div className="items-center justify-center  w-full flex gap-2">
                            {c.notifications_sent && (
                                <EnvelopeIcon className="size-5" />
                            )}
                            {c.notifications_sent}
                        </div>
                    ),
                    return: (c) => {
                        if (c.timestamp_in) {
                            // Undos are enabled for 2 minutes
                            const undoDisabled =
                                Date.now() / 1000 >= c.timestamp_in + 2 * 60;
                            return (
                                <Tooltip
                                    content={
                                        undoDisabled
                                            ? "Returns can only be undone within 2 minutes of check in."
                                            : "Undo return"
                                    }
                                    className="max-w-56"
                                >
                                    <Button
                                        isIconOnly
                                        startContent={
                                            <ArrowUturnRightIcon className="size-5" />
                                        }
                                        // Only allow checkout undos for 2 minutes
                                        // isDisabled={!undoEnabled}
                                        color="primary"
                                        variant="shadow"
                                        disableAnimation={undoDisabled}
                                        className={clsx(
                                            undoDisabled && "opacity-disabled",
                                            undoDisabled &&
                                                "data-[hover=true]:opacity-disabled",
                                            undoDisabled && "cursor-default",
                                        )}
                                        onPress={() => {
                                            // Undo checkout if within allotted time
                                            if (!undoDisabled) {
                                                undoMutation.mutate({
                                                    checkout_uuid: c.uuid,
                                                });
                                            }
                                        }}
                                    />
                                </Tooltip>
                            );
                        } else {
                            return (
                                <Button
                                    isIconOnly
                                    startContent={
                                        <ArrowTurnDownLeftIcon className="size-5" />
                                    }
                                    color="secondary"
                                    variant="shadow"
                                    onPress={() =>
                                        returnMutation.mutate({
                                            checkout_uuid: c.uuid,
                                        })
                                    }
                                />
                            );
                        }
                    },
                    ...customColumnComponents,
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
        </div>
    );
}
