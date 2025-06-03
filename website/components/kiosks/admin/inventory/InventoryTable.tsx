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
} from "@heroicons/react/24/outline";
import { ITEM_ROLE, TInventoryItem } from "../../../../../common/inventory";
import MAKETable from "../../../Table";
import Fuse from "fuse.js";
import React from "react";

const baseColumns = [
    { name: "UUID", id: "uuid" },
    { name: "Name", id: "name" },
    { name: "Long Name", id: "long_name" },
    { name: "Role", id: "role" },
    { name: "Access Type", id: "access_type" },
    { name: "Quantity", id: "quantity" },
    { name: "Available", id: "available" },
    { name: "Locations", id: "locations" },
    { name: "Reorder URL", id: "reorder_url" },
    { name: "Serial Number", id: "serial_number" },
    { name: "Required Certs", id: "required_certifications" },
    { name: "Authorized Roles", id: "authorized_roles" },
];

export default function InventoryTable({
    items,
    selectedKeys,
    onSelectionChange,
    isLoading,
    columns = baseColumns,
    defaultColumns = ["name", "role", "access_type", "quantity"],
    customColumnComponents,
}: {
    items: TInventoryItem[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
    columns: { name: string; id: string }[];
    defaultColumns?: string[];
    customColumnComponents: {
        [column_id: string]: (item: TInventoryItem) => React.ReactNode;
    };
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
        return new Fuse(items, {
            keys: ["name", "long_name", "keywords"],
            threshold: 0.3,
        });
    }, [items]);

    // The list of items after filtering and sorting
    const filteredItems = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return items;
        }
    }, [items, fuse, search]);

    const numItems = items.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onOpen = () => {};

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
                    <div className="flex gap-3">
                        <Dropdown isDisabled={isLoading}>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button
                                    endContent={
                                        <ChevronDownIcon className="size-6 text-small" />
                                    }
                                    variant="flat"
                                >
                                    Filter Columns
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
                                {columns
                                    .filter((column) =>
                                        defaultColumns.includes(column.id),
                                    )
                                    .map((column) => (
                                        <DropdownItem
                                            key={column.id}
                                            className="capitalize"
                                        >
                                            {column.name}
                                        </DropdownItem>
                                    ))}
                            </DropdownMenu>
                        </Dropdown>

                        <Button
                            color="primary"
                            isDisabled={isLoading}
                            startContent={<PlusIcon className="size-6" />}
                            onPress={onOpen}
                        >
                            Create
                        </Button>
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
                multiSelect={false}
                customColumnComponents={{
                    // put stuff here
                    role: (i) => {
                        if (i.role === ITEM_ROLE.TOOL) {
                            return <WrenchScrewdriverIcon className="size-6" />;
                        } else if (i.role === ITEM_ROLE.MATERIAL) {
                            return <CubeIcon className="size-6" />;
                        } else if (i.role === ITEM_ROLE.KIT) {
                            // Make into a button?
                            return <BriefcaseIcon className="size-6" />;
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