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
    Select,
    SelectedItemProps,
    SelectedItems,
    SelectItem,
    SelectSection,
    ListboxSection,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    PlusIcon,
    CheckIcon,
    StarIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { TUserRole, UserRoleUUID } from "common/user";
import MAKETable, { ColumnSelect } from "../../../Table";
import MAKEUserRole from "../../../user/UserRole";
import Fuse from "fuse.js";
import React from "react";
import {
    API_SCOPE,
    API_SCOPE_DESCRIPTOR,
    API_SCOPE_SECTIONS,
} from "../../../../../common/global";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import PopupAlert from "../../../PopupAlert";
import APIScope from "../../../APIScope";

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
                    return old.map((r) => (r.uuid === role.uuid ? result : r));
                }
            });
            onSuccess(
                `Successfully ${isNew ? "created" : "updated"} role "${result.title}"`,
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

            // Roles cannot have all scopes
            if (scopes === "all") return;

            const new_role: TUserRole = {
                uuid: role.uuid,
                title: title,
                description: description,
                color: color,
                scopes: Array.from(scopes as Set<API_SCOPE>),
                default: isDefault,
            };

            console.log(new_role);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_role, isNew: isNew });
        },
        [hasEdits, role.uuid, title, description, color, scopes, isDefault],
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

    const {
        isOpen: isDeleting,
        onOpen: onDelete,
        onOpenChange: onDeleteChange,
    } = useDisclosure();

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <Form
                                onSubmit={onSubmit}
                                className="flex flex-col gap-4 p-4"
                            >
                                <div className="text-lg font-semibold">{`${isNew ? "Create" : "Edit"} Role`}</div>
                                <div className="flex flex-row w-full gap-2 items-center">
                                    <Input
                                        type="text"
                                        label="UUID"
                                        name="uuid"
                                        placeholder={role.uuid}
                                        // UUID is not editable
                                        isDisabled
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
                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={onDelete}
                                        isIconOnly
                                    >
                                        <TrashIcon className="size-6" />
                                    </Button>
                                </div>
                                <div className="flex flex-row w-full gap-2 items-center">
                                    <Input
                                        type="text"
                                        label="Title"
                                        name="title"
                                        placeholder="Role Title"
                                        isRequired
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
                                        className="w-[40px] flex justify-center"
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
                                    placeholder="A description of the role"
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
                                <div
                                    id="role-color-picker"
                                    className="grid grid-flow-col gap-2 items-center w-full"
                                >
                                    <Input
                                        type="text"
                                        label="Color"
                                        name="color"
                                        placeholder="Role Color"
                                        isRequired
                                        // Hex colors are always 7 characters long
                                        minLength={7}
                                        maxLength={7}
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
                                                style={{
                                                    backgroundColor: color,
                                                }}
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
                                <Select<API_SCOPE_DESCRIPTOR>
                                    name="scopes"
                                    selectedKeys={scopes}
                                    onSelectionChange={wrapEdit(setScopes)}
                                    selectionMode="multiple"
                                    isMultiline
                                    placeholder="Select scopes"
                                    size="lg"
                                    variant="faded"
                                    color="primary"
                                    label="Scopes"
                                    labelPlacement="inside"
                                    classNames={{
                                        value: "text-default-500",
                                    }}
                                    itemHeight={45}
                                    renderValue={(selectedKeys) => {
                                        if (selectedKeys.length === 0) {
                                            // If no scopes are selected, show the placeholder
                                            return "";
                                        } else {
                                            return (
                                                // Otherwise, show the selected scopes in a flexbox
                                                <div className="flex flex-wrap gap-1 p-2">
                                                    {selectedKeys.map(
                                                        (scope) => {
                                                            return scope.key &&
                                                                scope.textValue ? (
                                                                <APIScope
                                                                    key={
                                                                        scope.key
                                                                    }
                                                                    descriptor={{
                                                                        scope: scope.key as API_SCOPE,
                                                                        label: scope.textValue,
                                                                        description:
                                                                            "",
                                                                    }}
                                                                    size="sm"
                                                                />
                                                            ) : null;
                                                        },
                                                    )}
                                                </div>
                                            );
                                        }
                                    }}
                                >
                                    {API_SCOPE_SECTIONS.map((section) => (
                                        <SelectSection
                                            key={section.title}
                                            title={section.title}
                                        >
                                            {section.scopes.map(
                                                (scope_descriptor) => (
                                                    <SelectItem
                                                        key={
                                                            scope_descriptor.scope
                                                        }
                                                        textValue={
                                                            scope_descriptor.label
                                                        }
                                                        value={
                                                            scope_descriptor.scope
                                                        }
                                                        className="h-[45px]"
                                                    >
                                                        <APIScope
                                                            descriptor={
                                                                scope_descriptor
                                                            }
                                                            size="md"
                                                        />
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectSection>
                                    ))}
                                </Select>
                                <div
                                    id="role-bottom-buttons"
                                    className="flex flex-row justify-between w-full"
                                >
                                    <Button
                                        variant="shadow"
                                        type="submit"
                                        color="primary"
                                        className="w-full sm:w-1/4"
                                        isDisabled={!isValid}
                                        isLoading={mutation.isPending}
                                    >
                                        {isNew ? "Create" : "Save"}
                                    </Button>
                                    <Button
                                        variant="flat"
                                        color="secondary"
                                        className="w-1/4"
                                        onPress={onClose}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </Form>
                            <DeleteRoleModal
                                key={role.uuid}
                                role={role}
                                isOpen={isDeleting}
                                onOpenChange={onDeleteChange}
                                onSuccess={(message) => {
                                    onSuccess(message);
                                    onClose();
                                }}
                                onError={(message) => {
                                    onError(message);
                                    onClose();
                                }}
                            />
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

function DeleteRoleModal({
    role,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    role: TUserRole;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            return axios.delete(`/api/v3/user/role/${role.uuid}`);
        },
        onSuccess: (obj) => {
            onSuccess(`Successfully deleted role "${role.title}"`);
            // Remove the role from the query cache
            queryClient.setQueryData(["user", "role"], (old: TUserRole[]) => {
                return old.filter((r) => r.uuid !== role.uuid);
            });
            queryClient.removeQueries({
                queryKey: ["user", "role", role.uuid],
            });
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Run the mutation
            mutation.mutate();
        },
        [mutation],
    );

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">Delete Role</div>
                        <div className="flex flex-col gap-2">
                            <p>
                                Are you sure you want to delete the role{" "}
                                <span className="font-semibold">
                                    {role.title}
                                </span>
                                ?
                            </p>
                            <p className="text-sm text-default-400">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div
                            id="role-bottom-buttons"
                            className="flex flex-row justify-between w-full"
                        >
                            <Button
                                variant="shadow"
                                type="submit"
                                color="danger"
                                className="w-full sm:w-1/4"
                                isLoading={mutation.isPending}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="flat"
                                color="secondary"
                                className="w-1/4"
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

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
    }, []);

    const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
        new Set<UserRoleUUID>(),
    );

    const [editRole, setEditRole] = React.useState<TUserRole | undefined>(
        undefined,
    );

    const [isNew, setIsNew] = React.useState<boolean>(false);

    const {
        isOpen: isEditing,
        onOpen: onEdit,
        onOpenChange: onEditChange,
    } = useDisclosure();

    const [popupMessage, setPopupMessage] = React.useState<string | undefined>(
        undefined,
    );
    const [popupType, setPopupType] = React.useState<
        "success" | "warning" | "danger"
    >("success");

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
                        <ColumnSelect
                            columns={columns.filter((c) =>
                                defaultColumns.includes(c.id),
                            )}
                            visibleColumns={visibleColumns}
                            setVisibleColumns={setVisibleColumns}
                            isLoading={isLoading}
                        />
                        {canEdit && (
                            <Button
                                color="primary"
                                isDisabled={isLoading}
                                startContent={<PlusIcon className="size-6" />}
                                onPress={() => {
                                    setIsNew(true);
                                    setEditRole({
                                        uuid: crypto.randomUUID(),
                                        title: "",
                                        description: "",
                                        color: "#000000",
                                        scopes: [],
                                        default: false,
                                    });
                                }}
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
                        <MAKEUserRole role_uuid={role.uuid} role={role} />
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
                        onEdit();
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
                    isOpen={isEditing}
                    onOpenChange={onEditChange}
                    onSuccess={(message) => {
                        setPopupMessage(message);
                        setPopupType("success");
                    }}
                    onError={(message) => {
                        setPopupMessage(message);
                        setPopupType("danger");
                    }}
                />
            )}
            <PopupAlert
                isOpen={!!popupMessage}
                onOpenChange={() => setPopupMessage(undefined)}
                color={popupType}
                description={popupMessage}
            />
        </div>
    );
}
