import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Selection,
    SortDescriptor,
    Spinner,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Fuse from "fuse.js";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";

export default function MAKETable<Type extends { uuid: string }>({
    content,
    columns,
    visibleColumns,
    multiSelect = false,
    selectedKeys,
    onSelectionChange = undefined,
    sortDescriptor,
    onSortChange = undefined,
    customColumnComponents = undefined,
    isLoading,
    loadingContent = "Loading...",
}: {
    content: Type[];
    columns: {
        name: string;
        id: string;
        sortable?: boolean;
        hidden?: boolean;
    }[];
    visibleColumns: Selection;
    selectedKeys: Selection;
    onSelectionChange?: (selectedKeys: Selection) => void;
    sortDescriptor: SortDescriptor;
    onSortChange?: (sortDescriptor: SortDescriptor) => void;
    multiSelect: boolean;
    customColumnComponents?: {
        [key in keyof Type]?: (item: Type) => React.ReactNode;
    };
    isLoading: boolean;
    loadingContent?: React.ReactNode;
}) {
    // The actual column header objects, filtered based on the visible columns
    const headerColumns = React.useMemo(() => {
        return columns.filter(
            (column) =>
                !column.hidden &&
                (visibleColumns === "all" || visibleColumns.has(column.id)),
        );
    }, [columns, visibleColumns]);

    //  The function to render each value in the table
    const renderCell = React.useCallback((item: Type, columnKey: React.Key) => {
        const key = columnKey as keyof Type;
        const cellValue = item[key];
        // If there exists a custom component function for this component, use it
        const customComponent = customColumnComponents?.[key];
        if (customComponent) {
            return customComponent(item);
        } else {
            // Otherwise, just return the cell value
            return cellValue as string;
        }
    }, []);

    return (
        <Table
            isHeaderSticky
            aria-label="Example table with custom cells, pagination and sorting"
            selectionMode={multiSelect ? "multiple" : "single"}
            sortDescriptor={sortDescriptor}
            onSelectionChange={onSelectionChange}
            onSortChange={onSortChange}
            classNames={{
                base: "max-h-full overflow-auto",
            }}
        >
            <TableHeader columns={headerColumns}>
                {(column) => (
                    <TableColumn
                        key={column.id as string}
                        align="start"
                        allowsSorting={column.sortable}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody
                emptyContent={"No users found"}
                items={content}
                isLoading={isLoading}
                loadingContent={loadingContent}
            >
                {(item) => (
                    <TableRow key={item.uuid}>
                        {(columnKey) => (
                            <TableCell>{renderCell(item, columnKey)}</TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
