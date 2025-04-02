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
}: {
    content: Type[];
    columns: {
        name: string;
        id: string;
        sortable?: boolean;
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
    loadingContent?: (ref?: React.Ref<HTMLElement>) => React.ReactNode;
    emptyContent?: React.ReactNode;
}) {
    // The current number of items in content that are loaded in the DOM and
    // are visible to the user
    const [visibleContentLength, setVisibleContentLength] = React.useState(
        initialVisibleContentLength,
    );

    // A function to load more content by updating the visible content length
    const loadMoreContent = React.useCallback(() => {
        console.log(
            "setting content length",
            visibleContentLength + incrementVisibleContentLength,
        );
        setVisibleContentLength(
            visibleContentLength + incrementVisibleContentLength,
        );
    }, [visibleContentLength]);

    // Whether there is more content left
    const hasMoreContent = React.useMemo(
        () => visibleContentLength < content.length,
        [visibleContentLength, content.length],
    );

    // The list of currently visible content, sliced using visibleContentLength
    const visibleContent = React.useMemo(
        () => content.slice(0, visibleContentLength),
        [content, visibleContentLength],
    );

    // When content changes, reset visible content length and selected keys
    React.useMemo(() => {
        if (!isLoading) {
            setVisibleContentLength(initialVisibleContentLength);
            onSelectionChange(new Set());
        }
    }, [content]);

    // Create an infinite scroll ref to load more content as the user scrolls
    const [loaderRef, scrollerRef] = useInfiniteScroll({
        hasMore: hasMoreContent,
        onLoadMore: loadMoreContent,
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
    }, []);

    return (
        <Table
            isHeaderSticky
            aria-label="A table for content"
            selectionMode={multiSelect ? "multiple" : "single"}
            selectedKeys={selectedKeys}
            onSelectionChange={onSelectionChange}
            baseRef={scrollerRef}
            classNames={{
                base: "max-h-full overflow-auto",
            }}
            bottomContent={hasMoreContent ? loadingContent(loaderRef) : null}
            selectionBehavior={multiSelect ? "toggle" : "replace"}
            onRowAction={doubleClickAction}
        >
            <TableHeader columns={headerColumns}>
                {(column) => (
                    <TableColumn
                        key={column.id as string}
                        align="start"
                        // allowsSorting={column.sortable}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody
                emptyContent={emptyContent}
                items={visibleContent}
                isLoading={isLoading}
                loadingContent={loadingContent()}
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
                {initialColumns.map((column) => (
                    <DropdownItem key={column.id} className="capitalize">
                        {column.name}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
}
