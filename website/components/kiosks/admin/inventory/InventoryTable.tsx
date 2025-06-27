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
} from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
    WrenchScrewdriverIcon,
    CubeIcon,
    BriefcaseIcon,
    MapPinIcon,
    RadioIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import {
    ITEM_ACCESS_DESCRIPTORS,
    ITEM_RELATIVE_QUANTITY,
    ITEM_ROLE,
    TInventoryItem,
} from "../../../../../common/inventory";
import MAKETable from "../../../Table";
import Fuse from "fuse.js";
import React from "react";
import { TUserRole } from "common/user";
import { TCertification } from "common/certification";
import clsx from "clsx";
import CertificationTag from "../certifications/CertificationTag";
import UserRole from "../../../user/UserRole";
import { TArea } from "common/area";
import ItemLocationChip from "./ItemLocationChip";
import ItemRoleIcon from "./ItemRoleIcon";

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
    { name: "Authorized Roles", id: "authorized_roles" },
    { name: "Keywords", id: "keywords" },
    { name: "Serial Number", id: "serial_number" },
    { name: "Reorder URL", id: "reorder_url" },
];

export default function InventoryTable({
    inventory,
    roles,
    certifications,
    areas,
    selectedKeys,
    onSelectionChange,
    isLoading,
    columns = baseColumns,
    defaultColumns = [
        "role",
        "name",
        // "access_type",
        "quantity_ratio",
        "locations",
        "required_certifications",
        "authorized_roles",
    ],
    customColumnComponents,
    editable = false,
    onCreate = undefined,
}: {
    inventory: TInventoryItem[];
    roles: TUserRole[];
    certifications: TCertification[];
    areas: TArea[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
    columns?: { name: string; id: string }[];
    defaultColumns?: string[];
    customColumnComponents?: {
        [column_id: string]: (item: TInventoryItem) => React.ReactNode;
    };
    editable?: boolean;
    onCreate?: () => void;
}) {
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");

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
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return inventory;
        }
    }, [inventory, fuse, search]);

    const numItems = inventory.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

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
                        <div className="hidden sm:block">
                            <Dropdown isDisabled={isLoading}>
                                <DropdownTrigger>
                                    <Button
                                        endContent={
                                            <ChevronDownIcon className="size-6 text-small" />
                                        }
                                        variant="flat"
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

                        {editable && (
                            <Button
                                color="primary"
                                isDisabled={isLoading}
                                startContent={<PlusIcon className="size-6" />}
                                onPress={onCreate}
                            >
                                Create
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numItems} items
                    </span>
                </div>
            </div>
            <MAKETable
                content={filteredItems}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                multiSelect={true}
                showSelectionCheckboxes={false}
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
                            <ItemRoleIcon role={i.role} />
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
                            {i.locations.map((location, index) => (
                                <ItemLocationChip
                                    key={`${location.area}-${index}`}
                                    location={location}
                                    areas={areas}
                                />
                            ))}
                        </div>
                    ),
                    required_certifications: (i) => (
                        <div className="flex flex-row gap-2 overflow-auto max-w-1/2">
                            {i.required_certifications?.map((c) => (
                                <CertificationTag
                                    key={c.certification_uuid}
                                    cert_uuid={c.certification_uuid}
                                    certifications={certifications}
                                    level={c.required_level}
                                />
                            ))}
                        </div>
                    ),
                    authorized_roles: (i) => (
                        <div className="flex flex-row gap-2 overflow-auto max-w-20">
                            {i.authorized_roles?.map((role) => (
                                <UserRole
                                    key={role}
                                    role_uuid={role}
                                    role={roles.find((r) => r.uuid === role)}
                                />
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
        </div>
    );
}