import {
    Input,
    Selection,
    SortDescriptor,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Tooltip,
    useDisclosure,
} from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import {
    ITEM_ACCESS_DESCRIPTORS,
    ITEM_ACCESS_TYPE,
    ITEM_RELATIVE_QUANTITY,
    ITEM_ROLE,
    TInventoryItem,
} from "../../../../../common/inventory";
import MAKETable from "../../../Table";
import Fuse from "fuse.js";
import React from "react";
import { TUser, TUserRole } from "common/user";
import { TCertification, TRequiredCertificate } from "common/certification";
import { TRestockRequest } from "../../../../../common/restock";
import { API_SCOPE } from "../../../../../common/global.ts";
import { mergeRequiredCerts, verifyScopes } from "../../../../utils.tsx";
import clsx from "clsx";
import CertificationTag from "../certifications/CertificationTag";
import UserRole from "../../../user/UserRole";
import { TArea } from "common/area";
import ItemLocationChip from "./ItemLocationChip";
import ItemRoleIcon from "./ItemRoleIcon";
import RestockRequestModal from "../restock/RestockRequestModal";
import { GlobeAmericasIcon } from "@heroicons/react/24/solid";

const baseColumns = [
    // { name: "UUID", id: "uuid" },
    { name: "Type", id: "role" },
    { name: "Name", id: "name" },
    { name: "Long Name", id: "long_name" },
    { name: "Access Type", id: "access_type" },
    // { name: "Quantity", id: "quantity" },
    // { name: "Available", id: "available" },
    { name: "Quantity", id: "quantity_ratio" },
    { name: "Locations", id: "locations" },
    { name: "Required Certs", id: "required_certifications" },
    { name: "Accessor Roles", id: "available_to" },
    { name: "Viewer Roles", id: "visible_to" },
    { name: "Kit Contents", id: "kit_contents" },
    { name: "Keywords", id: "keywords" },
    { name: "Serial Number", id: "serial_number" },
    { name: "Reorder URL", id: "reorder_url" },
];

export default function InventoryTable({
    requestingUser,
    scopes = [],
    inventory,
    roles,
    certifications,
    areas,
    restocks,
    selectedKeys,
    onSelectionChange,
    doubleClickAction,
    multiSelect = true,
    isLoading,
    extraColumns = [],
    defaultColumns = [
        "role",
        "name",
        // "access_type",
        "quantity_ratio",
        "locations",
        "required_certifications",
        "available_to",
        "visible_to",
    ],
    customColumnComponents,
    showsKitContents = false,
    editable = false,
    emptyContent,
    onCreate = undefined,
}: {
    requestingUser?: TUser;
    scopes?: API_SCOPE[];
    inventory: TInventoryItem[];
    roles: TUserRole[];
    certifications: TCertification[];
    areas: TArea[];
    restocks?: TRestockRequest[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    doubleClickAction?: (key: React.Key) => void;
    multiSelect?: boolean;
    isLoading: boolean;
    extraColumns?: { name: string; id: string }[];
    defaultColumns?: string[];
    customColumnComponents?: {
        [column_id: string]: (item: TInventoryItem) => React.ReactNode;
    };
    showsKitContents?: boolean;
    emptyContent?: string;
    editable?: React.ReactNode;
    onCreate?: (state: boolean) => void;
}) {
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    // Location filtering dropdown menu
    const [searchableLocations, setSearchableLocations] =
        React.useState<Selection>(new Set());
    const [search, setSearch] = React.useState<string>("");

    const columns = baseColumns.concat(extraColumns);

    // A fuse instance for filtering the content, memoized to prevent
    // unnecessary reinitialization on every render but updated when the
    // content changes
    const fuse = React.useMemo(() => {
        return new Fuse(inventory, {
            keys: [
                "name",
                "long_name",
                "keywords",
                "role",
                "locations.container",
                "locations.specific",
            ],
            threshold: 0.3,
        });
    }, [inventory]);

    // The list of items after filtering and sorting
    const filteredItems = React.useMemo(() => {
        let tempInventory: TInventoryItem[];
        if (search) {
            tempInventory = fuse.search(search).map((result) => result.item);
        } else {
            tempInventory = inventory;
        }
        // All items are shown if either all or no locations are selected
        if (searchableLocations === "all") {
            return tempInventory;
        } else if (searchableLocations.size === 0) {
            return tempInventory;
        } else {
            // Iterates through searchableLocations array to find math with item location uuid
            return tempInventory.filter((item) =>
                item.locations.some((location) =>
                    searchableLocations.has(location.area),
                ),
            );
        }
    }, [inventory, fuse, search, searchableLocations]);

    const numItems = inventory.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const modifiedSelectionChange = (selectedKeys: Selection) => {
        // If the selection changes, we won't be creating a new user
        if (onCreate) onCreate(false);
        if (selectedKeys === "all") {
            onSelectionChange(new Set(filteredItems.map((i) => i.uuid)));
        } else {
            onSelectionChange(selectedKeys);
        }
    };

    const createItem = () => {
        onSelectionChange(new Set());
        if (onCreate) onCreate(true);
    };
    const DEFAULT_ITEM: TInventoryItem = {
        uuid: "",
        name: "",
        role: ITEM_ROLE.TOOL,
        quantity: 0,
        available: 0,
        access_type: ITEM_ACCESS_TYPE.USE_IN_SPACE,
        locations: [],
    };

    const selectedItem =
        selectedKeys == "all"
            ? DEFAULT_ITEM
            : (inventory.filter((item) => selectedKeys.has(item.uuid))[0] ??
              DEFAULT_ITEM);

    // Modal state for restock request form
    const {
        isOpen: restockIsOpen,
        onOpen: restockOnOpen,
        onOpenChange: restockOnOpenChange,
    } = useDisclosure();

    const restockButtonAccess =
        scopes &&
        scopes.length !== 0 &&
        verifyScopes(scopes, [
            API_SCOPE.GET_ALL_RESTOCKS,
            API_SCOPE.CREATE_RESTOCK,
        ]);

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
                    <div className="gap-3 flex">
                        <div className="hidden sm:flex gap-3">
                            <Dropdown isDisabled={isLoading}>
                                <DropdownTrigger>
                                    <Button
                                        endContent={
                                            <GlobeAmericasIcon className="size-6 text-small" />
                                        }
                                        variant="flat"
                                        tabIndex={-1}
                                    >
                                        Locations
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Locations"
                                    closeOnSelect={false}
                                    selectionMode="multiple"
                                    selectedKeys={searchableLocations}
                                    onSelectionChange={setSearchableLocations}
                                >
                                    {areas.map((area) => (
                                        <DropdownItem
                                            key={area.uuid}
                                            className="capitalize"
                                        >
                                            {area.name}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
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

                        {restockButtonAccess && (
                            <Button
                                startContent={<PlusIcon className="size-6" />}
                                isDisabled={selectedItem.name === ""}
                                onPress={() => {
                                    restockOnOpen();
                                }}
                            >
                                Restock
                            </Button>
                        )}

                        {editable && (
                            <Button
                                color="primary"
                                isDisabled={isLoading}
                                startContent={<PlusIcon className="size-6" />}
                                onPress={createItem}
                            >
                                Create
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        {filteredItems.length === numItems
                            ? `Total ${numItems} items`
                            : `Showing ${filteredItems.length} of ${numItems} items`}
                    </span>
                </div>
            </div>
            <MAKETable
                content={showsKitContents ? filteredItems : filteredItems.filter(item => !item.parent_kit)}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={modifiedSelectionChange}
                doubleClickAction={doubleClickAction}
                multiSelect={multiSelect}
                showSelectionCheckboxes={false}
                emptyContent={emptyContent}
                customColumnComponents={{
                    // put stuff here
                    role: (i) => (
                        <Tooltip
                            content={i.role}
                            placement="left"
                            color="primary"
                            classNames={{
                                content: "capitalize",
                            }}
                        >
                            <div>
                                <ItemRoleIcon role={i.role} />
                            </div>
                        </Tooltip>
                    ),
                    quantity_ratio: (i) => {
                        if (i.quantity === ITEM_RELATIVE_QUANTITY.HIGH) {
                            return (
                                <div
                                    className={clsx(
                                        "bg-success-200 text-md text-success-foreground",
                                        "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                        "sm:min-w-16",
                                    )}
                                >
                                    High
                                </div>
                            );
                        } else if (i.quantity === ITEM_RELATIVE_QUANTITY.LOW) {
                            return (
                                <div
                                    className={clsx(
                                        "bg-danger-300 text-md text-danger-foreground",
                                        "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                        "sm:min-w-16",
                                    )}
                                >
                                    Low
                                </div>
                            );
                        } else {
                            return (
                                <div
                                    className={clsx(
                                        "bg-default-200 text-md text-default-foreground",
                                        "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                        "sm:min-w-16",
                                    )}
                                >
                                    {i.available}
                                    {" / "}
                                    {i.quantity}
                                </div>
                            );
                        }
                    },
                    locations: (i) => (
                        <div className="flex flex-col gap-2 min-w-max">
                            {i.parent_kit ? (() => {
                                let parent_kit = inventory.find(k => k.uuid == i.parent_kit);

                                return (
                                    parent_kit?.locations.map((location, index) => (
                                        <ItemLocationChip
                                            key={`${i.uuid}-location-${index}`}
                                            location={{
                                                area: location.area,
                                                specific: `In ${parent_kit?.name}`,
                                                container: ""
                                            }}
                                            areas={areas}
                                        />
                                    ))
                                );
                            })() : (
                                i.locations.map((location, index) => (
                                    <ItemLocationChip
                                        key={`${location.area}-${index}`}
                                        location={location}
                                        areas={areas}
                                    />
                                ))
                            )}
                        </div>
                    ),
                    required_certifications: (i) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {mergeRequiredCerts(i.required_certifications,
                                inventory.find(k => k.uuid == i.parent_kit)?.required_certifications
                            )?.map((c) => (
                                <CertificationTag
                                    key={c.certification_uuid}
                                    cert_uuid={c.certification_uuid}
                                    certifications={certifications}
                                    level={c.required_level}
                                />
                            ))}
                        </div>
                    ),
                    available_to: (i) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {i.available_to?.map((role) => (
                                <UserRole
                                    key={role}
                                    role_uuid={role}
                                    role={roles.find((r) => r.uuid === role)}
                                />
                            ))}
                        </div>
                    ),
                    visible_to: (i) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {i.visible_to?.map((role) => (
                                <UserRole
                                    key={role}
                                    role_uuid={role}
                                    role={roles.find((r) => r.uuid === role)}
                                />
                            ))}
                        </div>
                    ),
                    kit_contents: (i) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {i.kit_contents?.map((content) => (
                                <div key={i.uuid + "-item-" + content}>
                                    {inventory.find(a => a.uuid == content)?.name}
                                </div>
                            ))}
                        </div>
                    ),
                    access_type: (i) => (
                        <div className="text-default-700 bg-default-200 p-2 rounded-md">
                            {ITEM_ACCESS_DESCRIPTORS[i.access_type].label}
                        </div>
                    ),
                    keywords: (i) => i.keywords?.join(", "),
                    ...customColumnComponents,
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />

            {restocks && (
                <RestockRequestModal
                    requestingUser={requestingUser}
                    restocks={restocks}
                    restockSelected={selectedItem}
                    editIsOpen={restockIsOpen}
                    editOnOpenChange={restockOnOpenChange}
                />
            )}
        </div>
    );
}
