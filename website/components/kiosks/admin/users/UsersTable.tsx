import { Input, Selection, Button, Spinner } from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { TUser, TUserRole } from "common/user";
import MAKETable, { ColumnSelect } from "../../../Table";
import MAKEUserRole from "../../../user/UserRole";
import Fuse from "fuse.js";
import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import CertificationTag from "../certifications/CertificationTag";
import { TCertification } from "common/certification";
import { useQuery } from "@tanstack/react-query";

const baseColumns = [
    // { name: "UUID", id: "uuid" }, // No need to show
    { name: "ID", id: "college_id" },
    { name: "Name", id: "name" },
    { name: "Email", id: "email" },
    { name: "Roles", id: "active_roles" },
    { name: "Past Roles", id: "past_roles" },
    { name: "Certificates", id: "active_certificates" },
    { name: "Past Certificates", id: "past_certificates" },
    // Skip files and availability, not useful right now
];

const defaultUserColumns: string[] = [
    "college_id",
    "name",
    "email",
    "active_roles",
    "active_certificates",
];

export default function UsersTable({
    users,
    roles,
    certs,
    selectedKeys,
    onSelectionChange,
    isLoading,
    onCreate,
    fullHeader = true,
    extraColumns = [],
    defaultColumns = defaultUserColumns,
    doubleClickAction = () => {},
    customColumnComponents = {},
    emptyContent = undefined,
}: {
    users: TUser[];
    roles: TUserRole[];
    certs: TCertification[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
    onCreate?: (state: boolean) => void;
    fullHeader?: boolean;
    extraColumns?: { name: string; id: string }[];
    defaultColumns?: string[];
    doubleClickAction?: (uuid: React.Key) => void;
    customColumnComponents?: {
        [column_id: string]: (item: TUser) => React.ReactNode;
    };
    emptyContent?: React.ReactNode;
}) {
    const { data: updatedUsers, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnMount: false,
    });
    const columns = [...baseColumns, ...extraColumns];

    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");
    // Consider filtering by roles and certs, need to add custom getFn to Fuse

    // A fuse instance for filtering the content, memoized to prevent
    // unnecessary reinitialization on every render but updated when the
    // content changes
    const fuse = React.useMemo(() => {
        return new Fuse(updatedUsers || users, {
            keys: ["name", "college_id", "email"],
            threshold: 0.3,
        });
    }, [updatedUsers, users]);

    // The list of items after filtering and sorting
    const filteredUsers = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return users;
        }
    }, [users, fuse, search]);

    const numUsers = (updatedUsers || users).length;
    const numFilteredUsers = filteredUsers.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
        // Consider scroll to top
    }, []);

    const [multiSelect, setMultiSelect] = React.useState(false);

    const batchEdit = (batchEdit: boolean) => {
        if (batchEdit) {
            // Enter batch edit mode
            setMultiSelect(true);
        } else {
            // Exit batch edit mode
            setMultiSelect(false);
            // Clear the selection if it exists
            onSelectionChange(new Set());
        }
    };

    const modifiedSelectionChange = (selectedKeys: Selection) => {
        // If the selection changes, we won't be creating a new user
        if (onCreate) onCreate(false);
        if (selectedKeys === "all") {
            onSelectionChange(new Set(filteredUsers.map((user) => user.uuid)));
        } else {
            onSelectionChange(selectedKeys);
        }
    };

    const createUser = () => {
        onSelectionChange(new Set());
        if (onCreate) onCreate(true);
    };

    const findRole = React.useCallback(
        (role_uuid: string) => roles.find((role) => role.uuid === role_uuid),
        [roles],
    );

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div id="user-table-top-content" className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className={clsx(
                            "w-full text-for",
                            fullHeader ? "sm:max-w-[44%]" : "",
                        )}
                        placeholder="Search..."
                        startContent={<SearchIcon className="size-6" />}
                        value={search}
                        onClear={() => onSearchClear()}
                        onValueChange={onInputChange}
                        isDisabled={isLoading}
                        classNames={{
                            input: "placeholder:text-foreground-200",
                        }}
                    />
                    {fullHeader && (
                        <div className="flex gap-3">
                            <ColumnSelect
                                columns={columns}
                                visibleColumns={visibleColumns}
                                setVisibleColumns={setVisibleColumns}
                                isLoading={isLoading}
                            />
                            {/* TODO: Make a filter by dropdown that has sub-selection part for role, cert, etc. */}
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
                                    // TODO: Make batch editing work
                                    isDisabled
                                    // isDisabled={isLoading}
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
                                onPress={createUser}
                            >
                                Create
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numUsers} users
                    </span>
                </div>
            </div>
            <MAKETable
                key={filteredUsers.length} // Re-render the table when the filtered users change
                content={filteredUsers}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={modifiedSelectionChange}
                multiSelect={multiSelect}
                doubleClickAction={doubleClickAction}
                emptyContent={emptyContent}
                customColumnComponents={{
                    active_roles: (user: TUser) => (
                        <div className="flex flex-row flex-wrap gap-2">
                            {user.active_roles.map((log) => (
                                <MAKEUserRole
                                    role_uuid={log.role_uuid}
                                    role={findRole(log.role_uuid)}
                                    key={log.role_uuid}
                                    size="md"
                                />
                            ))}
                        </div>
                    ),
                    past_roles: (user: TUser) => (
                        <div className="flex flex-row flex-wrap gap-2">
                            {user.past_roles.map((log) => (
                                <MAKEUserRole
                                    role_uuid={log.role_uuid}
                                    role={findRole(log.role_uuid)}
                                    key={log.role_uuid}
                                    size="md"
                                />
                            ))}
                        </div>
                    ),
                    active_certificates: (user: TUser) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {user.active_certificates?.map((c) => (
                                <CertificationTag
                                    key={c.certification_uuid}
                                    cert_uuid={c.certification_uuid}
                                    certifications={certs}
                                    level={c.level}
                                />
                            ))}
                        </div>
                    ),
                    past_certificates: (user: TUser) => (
                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
                            {user.past_certificates?.map((c) => (
                                <CertificationTag
                                    key={c.certification_uuid}
                                    cert_uuid={c.certification_uuid}
                                    certifications={certs}
                                    level={c.level}
                                />
                            ))}
                        </div>
                    ),
                    ...customColumnComponents,
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
                        selectedKeys.size === numFilteredUsers
                            ? "All items selected"
                            : `${selectedKeys.size} of ${numFilteredUsers} selected`}
                    </span>
                </div>
            )}
        </div>
    );
}
