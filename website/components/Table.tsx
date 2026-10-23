import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Selection,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    SortDescriptor,
} from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const initialVisibleContentLength = 20;
const incrementVisibleContentLength = 20;

export default function MAKETable<Type extends { uuid: string }>({
    content,
    columns,
    visibleColumns,
    multiSelect = false,
    selectedKeys = new Set(),
    onSelectionChange = () => null,
    customColumnComponents = undefined,
    doubleClickAction = () => null,
    isLoading,
    loadingContent = () => "Loading...",
    emptyContent = "No content",
    color = "primary",
    showSelectionCheckboxes = true, // Only applies if multiSelect is true
    disabledRows = [],
}: {
    content: Type[];
    columns: {
        name: string;
        id: string;
        sortable?: boolean;
        sortValue?: (item: Type) => string | number | null;
        hidden?: boolean;
    }[];
    visibleColumns: Selection;
    selectedKeys?: Selection;
    onSelectionChange?: (selectedKeys: Selection) => void;
    multiSelect: boolean;
    customColumnComponents?: {
        [column_id: string]: (item: Type) => React.ReactNode;
    };
    doubleClickAction?: (item_uuid: React.Key) => void;
    isLoading: boolean;
    loadingContent?: (
        ref?: React.Ref<HTMLElement>,
        loadMoreContent?: () => void,
    ) => React.ReactNode;
    emptyContent?: React.ReactNode;
    color?:
        | "default"
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "danger";
    showSelectionCheckboxes?: boolean;
    disabledRows?: string[]
}) {

    // The column the table is being sorted by
    const [sortDescriptor, setSortDescriptor] =
    React.useState<SortDescriptor>({
        column: "",
        direction: "ascending",
    });

    // The current number of items in content that are loaded in the DOM and
    // are visible to the user
    const [visibleContentLength, setVisibleContentLength] = React.useState(
        initialVisibleContentLength,
    );

    // A function to load more content by updating the visible content length
    const loadMoreContent = React.useCallback(() => {
        setVisibleContentLength(
            visibleContentLength + incrementVisibleContentLength,
        );
    }, [visibleContentLength]);

    // Whether there is more content left
    const hasMoreContent = React.useMemo(
        () => visibleContentLength < content.length,
        [visibleContentLength, content.length],
    );

    const sortedContent = React.useMemo(() => {
        if (!sortDescriptor.column) {
            return content;
        }

        const column = columns.find(
            (column) => column.id === sortDescriptor.column
        );

        if (!column) {
            return content;
        }

        return [...content].sort((a, b) => {
            const first = column.sortValue
                ? column.sortValue(a)
                : a[sortDescriptor.column as keyof Type];

            const second = column.sortValue
                ? column.sortValue(b)
                : b[sortDescriptor.column as keyof Type];

            // Handle N/A values first
            if (first == null && second == null) return 0;
            if (first == null) {
                return sortDescriptor.direction === "ascending" ? -1 : 1;
            }
            if (second == null) {
                return sortDescriptor.direction === "ascending" ? 1 : -1;
            }
            const cmp = String(first).localeCompare(String(second), undefined, {
                numeric: true,
                sensitivity: "base",
            });

            return sortDescriptor.direction === "ascending"
                ? cmp
                : -cmp;
        });
    }, [content, sortDescriptor]);

    // The list of currently visible content, sliced using visibleContentLength
    const visibleContent = React.useMemo(
        () => sortedContent.slice(0, visibleContentLength),
        [sortedContent, visibleContentLength],
    );

    // Create an infinite scroll ref to load more content as the user scrolls
    const [loaderRef, scrollerRef] = useInfiniteScroll({
        hasMore: hasMoreContent,
        onLoadMore: loadMoreContent,
        shouldUseLoader: true,
    });

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
        const keyString = columnKey as string;
        // If there exists a custom component function for this component, use it
        if (customColumnComponents && keyString in customColumnComponents) {
            return customColumnComponents[keyString](item);
        } else {
            // Otherwise, just return the cell value as a string
            return item[columnKey as keyof Type] as string;
        }
    }, [customColumnComponents]);

    return (
        <Table
            isHeaderSticky
            aria-label="A table for content"
            selectionMode={multiSelect ? "multiple" : "single"}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            showSelectionCheckboxes={showSelectionCheckboxes}
            baseRef={scrollerRef}
            classNames={{
                base: "max-h-full overflow-auto",
                tbody: "[&>tr[data-disabled='true']]:opacity-50"
            }}
            bottomContent={
                hasMoreContent
                    ? loadingContent(loaderRef, loadMoreContent)
                    : null
            }
            selectionBehavior={multiSelect ? "toggle" : "replace"}
            onRowAction={multiSelect ? undefined : doubleClickAction}
            color={color}
            disabledKeys={disabledRows}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
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
                emptyContent={emptyContent}
                items={visibleContent}
                isLoading={isLoading}
            >
                {(item) => (
                        <TableRow
                            key={item.uuid}
                        // className="data-[selected=true]:bg-default-400"
                        >
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export function ColumnSelect({
    columns: initialColumns,
    visibleColumns,
    setVisibleColumns,
    isLoading,
}: {
    columns: {
        name: string;
        id: string;
        sortable?: boolean;
        hidden?: boolean;
    }[];
    visibleColumns: Selection;
    setVisibleColumns: (newColumns: Selection) => void;
    isLoading: boolean;
}) {
    return (
        <Dropdown isDisabled={isLoading}>
            <DropdownTrigger className="hidden sm:flex">
                <Button
                    startContent={
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
                {initialColumns.map((column) => (
                    <DropdownItem key={column.id} className="capitalize">
                        {column.name}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}
