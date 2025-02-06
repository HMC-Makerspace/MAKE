import {
    Input,
    Selection,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Checkbox,
    useDisclosure,
    Modal,
    Form,
    ModalContent,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    CheckIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import { TUserRole, UserRoleUUID } from "common/user";
import MAKETable from "../../../Table";
import MAKEUserRole from "../../../user/UserRole";
import Fuse from "fuse.js";
import React from "react";
import { API_SCOPE } from "common/global";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Title", id: "title" },
    { name: "Description", id: "description" },
    { name: "Color", id: "color" },
    { name: "Default", id: "default" },
];

const defaultColumns = ["title", "description", "color", "default"];

const createUpdateRole = async ({
    data,
    isNew,
}: {
    data: TUserRole;
    isNew: boolean;
}) => {
    if (isNew) {
        return (
            await axios.post<TUserRole>("/api/v3/user/role", { role_obj: data })
        ).data;
    } else {
        return (
            await axios.put<TUserRole>(`/api/v3/user/role`, { role_obj: data })
        ).data;
    }
};

function EditRoleModal({
    role,
    isNew,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    role: TUserRole;
    isNew: boolean;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUpdateRole,
        onSuccess: (result: TUserRole) => {
            queryClient.setQueryData(["user", "role", role.uuid], result);
            queryClient.setQueryData(["user", "role"], (old: TUserRole[]) => {
                if (isNew) {
                    return [...old, result];
                } else {
                    return old.map((role) =>
                        role.uuid === role.uuid ? result : role,
                    );
                }
            });
            onSuccess(
                `Successfully ${isNew ? "created" : "updated"} role ${result.title}`,
            );
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [title, setTitle] = React.useState<string>(role?.title ?? "");
    const [description, setDescription] = React.useState<string>(
        role?.description ?? "",
    );
    const [color, setColor] = React.useState<string>(role?.color ?? "");
    const [scopes, setScopes] = React.useState<Selection>(
        new Set<API_SCOPE>(role?.scopes ?? []),
    );
    const [isDefault, setIsDefault] = React.useState<boolean>(
        role?.default ?? false,
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Check if there are any edits to save
            if (!hasEdits) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            const new_role: TUserRole = {
                uuid: role.uuid,
                title: data.get("title") as string,
                description: data.get("description") as string,
                color: data.get("color") as string,
                scopes: data.getAll("scopes") as API_SCOPE[],
                default: data.get("default") === "true",
            };

            console.log(new_role);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_role, isNew: isNew });
        },
        [role.uuid, hasEdits],
    );

    React.useEffect(() => {
        if (!mutation.isPending) {
            onOpenChange(false);
        }
    }, [mutation.isPending]);

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    }, []);

    const isValid = React.useMemo(() => {
        return hasEdits && title.length > 0 && color.length > 0;
    }, [hasEdits, title, color]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">{`${isNew ? "Create" : "Edit"} Role`}</div>
                        <Input
                            type="text"
                            label="UUID"
                            name="uuid"
                            // If no user is selected, show a different placeholder
                            placeholder={role.uuid}
                            // UUID is not editable
                            isDisabled
                            // If the user exists, prefill the input with the user's uuid
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }}
                        />
                        <div className="flex flex-row w-full gap-2 items-center">
                            <Input
                                type="text"
                                label="Title"
                                name="title"
                                // If no user is selected, show a different placeholder
                                placeholder="Role Title"
                                isRequired
                                // If the user exists, prefill the input with the user's uuid
                                value={title}
                                onValueChange={wrapEdit(setTitle)}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                    ]),
                                }}
                            />

                            <motion.div
                                initial={{
                                    color: "hsl(var(--heroui-default-500))",
                                }}
                                animate={{
                                    color: isDefault
                                        ? "hsl(var(--heroui-primary-500))"
                                        : "hsl(var(--heroui-default-500))",
                                }}
                                whileHover={{
                                    color: isDefault
                                        ? "hsl(var(--heroui-primary-600))"
                                        : "hsl(var(--heroui-default-600))",
                                }}
                                onClick={() => {
                                    setIsDefault(!isDefault);
                                    setHasEdits(true);
                                }}
                            >
                                <Tooltip
                                    content={
                                        "Whether or not this role should be granted" +
                                        " to all newly created users by default"
                                    }
                                    className="w-56 p-2"
                                    delay={500}
                                    closeDelay={150}
                                >
                                    <StarIcon
                                        className="size-7 cursor-pointer"
                                        strokeWidth={2.5}
                                    />
                                </Tooltip>
                            </motion.div>
                        </div>
                        <Input
                            type="text"
                            label="Description"
                            name="description"
                            // If no user is selected, show a different placeholder
                            placeholder="A description of the role"
                            // If the user exists, prefill the input with the user's uuid
                            value={description}
                            onValueChange={wrapEdit(setDescription)}
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700 text-ellipsis",
                                ]),
                            }}
                        />
                        <div className="grid grid-flow-col gap-2 items-center w-full">
                            <Input
                                type="text"
                                label="Color"
                                name="color"
                                // If no user is selected, show a different placeholder
                                placeholder="Role Color"
                                isRequired
                                // If the user exists, prefill the input with the user's uuid
                                value={color}
                                onValueChange={wrapEdit(setColor)}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                        "uppercase",
                                    ]),
                                }}
                            />
                            <Popover
                                showArrow
                                offset={10}
                                placement="right"
                                shouldCloseOnBlur={false}
                                triggerScaleOnOpen={false}
                            >
                                <PopoverTrigger>
                                    <Button
                                        size="md"
                                        isIconOnly
                                        className="rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-2.5">
                                    <HexColorPicker
                                        color={color}
                                        onChange={wrapEdit(setColor)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-row justify-between w-full">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={mutation.isPending}
                            >
                                Submit
                            </Button>
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}

export default function RolesTable({
    roles: roles,
    isLoading,
    canEdit,
}: {
    roles: TUserRole[];
    isLoading: boolean;
    canEdit: boolean;
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
        return new Fuse(roles, {
            keys: ["title", "description", "scopes"],
            getFn: (role, path) => {
                // Convert scopes to strings
                if (path.includes("scopes")) {
                    return role.scopes.map((scope) => scope.toString());
                } else if (path.includes("description")) {
                    // Description might be undefined
                    return role.description ?? "";
                } else if (path.includes("title")) {
                    return role.title;
                } else {
                    return "";
                }
            },
            threshold: 0.3,
        });
    }, [roles]);

    // The list of items after filtering and sorting
    const filteredRoles = React.useMemo(() => {
        if (search) {
            return fuse.search(search).map((result) => result.item);
        } else {
            return roles;
        }
    }, [roles, fuse, search]);

    const numRoles = roles.length;
    const numFilteredRoles = filteredRoles.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
        // Consider scroll to top
    }, []);

    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
        new Set<UserRoleUUID>(),
    );

    const [editRole, setEditRole] = React.useState<TUserRole | undefined>(
        undefined,
    );

    const [isNew, setIsNew] = React.useState<boolean>(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div id="user-table-top-content" className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%] text-for"
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

                        {canEdit && (
                            <Button
                                color="primary"
                                isDisabled={isLoading}
                                startContent={<PlusIcon className="size-6" />}
                                onPress={() => alert("Create new role")}
                            >
                                Create
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numRoles} roles
                    </span>
                    {canEdit && (
                        <span className="text-default-400 text-small">
                            Double click to edit role
                        </span>
                    )}
                </div>
            </div>
            <MAKETable
                content={filteredRoles}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                multiSelect={false}
                customColumnComponents={{
                    title: (role: TUserRole) => (
                        <MAKEUserRole role_uuid={role.uuid} />
                    ),
                    default: (role: TUserRole) =>
                        role.default ? (
                            <CheckIcon className="size-6 text-foreground-500 justify-self-center" />
                        ) : null,
                    color: (role: TUserRole) => (
                        <div
                            className="w-8 h-8 rounded-full"
                            style={{ backgroundColor: role.color }}
                        />
                    ),
                }}
                doubleClickAction={(uuid) => {
                    if (canEdit) {
                        setEditRole(roles.find((role) => role.uuid === uuid));
                        console.log("Edit role", uuid);
                        onOpen();
                    }
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
            {editRole && (
                <EditRoleModal
                    key={editRole.uuid}
                    role={editRole}
                    isNew={isNew}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    onSuccess={() => alert("Success")}
                    onError={() => alert("Error")}
                />
            )}
        </div>
    );
}
