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
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { TUser } from "common/user";
import MAKETable from "../../../Table";
import MAKEUserRole from "../../../user/UserRole";
import Fuse from "fuse.js";
import React from "react";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "ID", id: "college_id" },
    { name: "Name", id: "name", sortable: true },
    { name: "Email", id: "email", sortable: true },
    { name: "Roles", id: "active_roles" },
    { name: "Past Roles", id: "past_roles" },
    { name: "Certificates", id: "active_certificates" },
    { name: "Past Certificates", id: "past_certificates" },
    // Skip files and availability, not useful right now
];

const defaultColumns = [
    "name",
    "college_id",
    "email",
    // "active_roles",
    // "active_certificates",
];

export default function UsersTable({
    users,
    selectedKeys,
    onSelectionChange,
    isLoading,
}: {
    users: TUser[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
}) {
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );

    // The current input value for the search filter
    const [filterString, setFilterString] = React.useState("");
    // The column and order to sort by
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "college_id",
        direction: "ascending",
    });

    // Consider filtering by roles and certs, need to add custom getFn to Fuse

    // A fuse instance for filtering the content, memoized to prevent
    // unnecessary reinitialization on every render but updated when the
    // content changes
    const fuse = React.useMemo(() => {
        return new Fuse(users, {
            keys: ["name", "college_id", "email"],
            threshold: 0.3,
        });
    }, [users]);

    // The list of items after filtering and sorting
    const content = React.useMemo(() => {
        let filteredContent = users;

        if (filterString) {
            filteredContent = fuse
                .search(filterString)
                .map((result) => result.item);
        }

        return filteredContent.sort((a, b) => {
            // Sort the items based on the sort descriptor
            const column = sortDescriptor.column as keyof TUser;
            const first = a[column];
            const second = b[column];
            let cmp = 0;
            // Account for undefined values
            if (!first) {
                cmp = -1;
            } else if (!second) {
                cmp = 1;
            } else {
                cmp = first < second ? -1 : first > second ? 1 : 0;
            }

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [users, fuse, filterString, sortDescriptor]);

    const onSearchChange = React.useCallback((value: string) => {
        if (value) {
            setFilterString(value);
            // Consider scroll to top
        } else {
            setFilterString("");
        }
    }, []);

    const onSearchClear = React.useCallback(() => {
        setFilterString("");
        // Consider scroll to top
    }, []);

    const onOpen = () => null;
    const multiSelect = true;

    return (
        <div className="flex flex-col max-h-full overflow-auto">
            <div id="user-table-top-content" className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%] text-for"
                        placeholder="Search..."
                        startContent={<SearchIcon className="size-6" />}
                        value={filterString}
                        onClear={() => onSearchClear()}
                        onValueChange={onSearchChange}
                        classNames={{
                            input: "placeholder:text-foreground-200",
                        }}
                    />
                    <div className="flex gap-3">
                        <Dropdown>
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
                            color="warning"
                            startContent={
                                <PencilSquareIcon className="size-6" />
                            }
                            onPress={onOpen}
                        >
                            Batch Edit
                        </Button>

                        <Button
                            color="primary"
                            startContent={<PlusIcon className="size-6" />}
                            onPress={onOpen}
                        >
                            Create
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {content.length} users
                    </span>
                </div>
            </div>
            <MAKETable
                content={content}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                multiSelect={true}
                customColumnComponents={{
                    active_roles: (user: TUser) => (
                        <div className="flex flex-col gap-2">
                            {user.active_roles.map((log) => (
                                <MAKEUserRole
                                    role_uuid={log.role_uuid}
                                    key={log.role_uuid}
                                />
                            ))}
                        </div>
                    ),
                    active_certificates: (user: TUser) => (
                        <span>
                            {user.active_certificates
                                ?.map((cert) => cert.certification_uuid)
                                .join(", ")}
                        </span>
                    ),
                }}
                isLoading={isLoading}
                loadingContent={
                    <div className="flex w-full justify-center">
                        <Spinner color="white" />
                    </div>
                }
            />
            {multiSelect && (
                <div className="py-2 px-2 flex justify-between items-center">
                    <span className="w-[30%] text-small text-default-400">
                        {selectedKeys === "all"
                            ? "All items selected"
                            : `${selectedKeys.size} of ${content.length} selected`}
                    </span>
                </div>
            )}
        </div>
    );
}
