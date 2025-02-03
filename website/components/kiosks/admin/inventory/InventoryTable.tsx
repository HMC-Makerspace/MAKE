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
} from "@heroicons/react/24/outline";
import { TInventoryItem } from "../../../../../common/inventory";
import MAKETable from "../../../Table";
import Fuse from "fuse.js";
import React from "react";

const columns = [
    { name: "Name", id: "name", sortable: true},
    { name: "Location", id: "location", sortable: true},
    { name: "Required Certifications", id: "required_certifications"},
    { name: "Quantity", id: "quantity", sortable: true},
];

const defaultColumns = [
    "name",
    "location",
    "required_certifications",
    "quantity",
];

export default function InventoryTable({
    items,
    selectedKeys,
    onSelectionChange,
    isLoading,
}: {
    items: TInventoryItem[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
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
            keys: ["name", "location", "quantity"],
            threshold: 0.3,
        });
    }, [items]);

    // The list of items after filtering and sorting
    const filteredItems = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item)
        } else {
            return items;
        }
    }, [items, fuse, search]);

    const numItems = items.length;
    const numFilteredItems = filteredItems.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
    }, [])

    const onOpen = () => null;

    const [multiSelect, setMultiSelect] = React.useState(false);

    const batchEdit = (batchEdit: boolean) => {
        if (batchEdit) {
            // Batch Editing Mode
            setMultiSelect(true);
        } else {
            // Exit Batch Editing Mode
            setMultiSelect(false);
            // Clear any selected items
            onSelectionChange(new Set());
        }
    };

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div id="inventory-table-top-content" className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%] text-for"
                        placeholder="Search..."
                        startContent={<SearchIcon className="size 6" />}
                        value={search}
                        onClear={() => onSearchClear()}
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
                        {multiSelect ? (
                            <Button
                                color="danger"
                                isDisabled={isLoading}
                                startContent={
                                    <PencilSquareIcon className="size-6" />
                                }
                                onPress={() => batchEdit(false)}
                            >
                                End Batch Edit
                            </Button>
                        ) : (
                            <Button
                                color="warning"
                                isDisabled={isLoading}
                                startContent={
                                    <PencilSquareIcon className="size-6" />
                                }
                                onPress={() => batchEdit(true)}
                            >
                                Batch Edit
                            </Button>
                        )}

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
                        Total {numItems} users
                    </span>
                </div>
            </div>
            <MAKETable
                content={filteredItems}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                multiSelect={multiSelect}
                customColumnComponents={{
                    // put stuff here
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
            {multiSelect && (
                <div className="py-2 px-2 flex justify-between items-center">
                    <span className="w-[30%] text-small text-default-400">
                        {selectedKeys === "all" ||
                        selectedKeys.size === numFilteredItems
                            ? "All items selected"
                            : `${selectedKeys.size} of ${numFilteredItems} selected`}
                    </span>
                </div>
            )}
        </div>
    );
}