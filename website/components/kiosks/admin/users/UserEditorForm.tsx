import {
    Button,
    Divider,
    Form,
    Input,
    select,
    Select,
    SelectedItemProps,
    Selection,
    SelectItem,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { TUser, TUserRole, TUserRoleLog, UserRoleUUID } from "common/user";
import React from "react";
import UserRole from "../../../user/UserRole";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import axios from "axios";
import { query } from "express";

// Define the mutation function that will run when the form is submitted
const createUpdateUser = async ({
    data,
    isNew,
}: {
    data: TUser;
    isNew: boolean;
}) => {
    if (isNew) {
        return (await axios.post<TUser>("/api/v3/user", { user_obj: data }))
            .data;
    } else {
        return (await axios.put<TUser>(`/api/v3/user`, { user_obj: data }))
            .data;
    }
};

export default function UserEditorForm({
    user,
    isMultiple,
    isNew,
    onCancel,
}: {
    user: TUser;
    isMultiple: boolean;
    isNew: boolean;
    onCancel: () => void;
}) {
    const user_role_query = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    const isEmpty = !user.uuid;

    const [sendingChanges, setSendingChanges] = React.useState<boolean>(false);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUpdateUser,
        onSuccess: (result: TUser) => {
            queryClient.setQueryData(["user", user.uuid], result);
            queryClient.setQueryData(["user"], (old: TUser[]) =>
                old.map((u) => (u.uuid === user.uuid ? result : u)),
            );
        },
        onSettled: () => {
            setSendingChanges(false);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            console.log("submitting form");

            // If something is wrong, don't submit.
            if (isEmpty) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            const updated_role_ids = Array.from(
                data.getAll("roles"),
            ) as UserRoleUUID[];
            // Get role changes
            const old_role_ids = user.active_roles.map(
                (role) => role.role_uuid,
            );
            const new_role_ids = updated_role_ids.filter(
                (role) => !old_role_ids.includes(role),
            );
            const removed_role_ids = old_role_ids.filter(
                (role) => !updated_role_ids.includes(role),
            );

            // Build new role list
            let active_roles = user.active_roles;
            let past_roles = user.past_roles;

            // Find existing roles that were removed
            let removed_roles = user.active_roles.filter((role) =>
                removed_role_ids.includes(role.role_uuid),
            );

            if (removed_roles.length > 0) {
                // For each role, add a new log to the past_roles array
                removed_roles.forEach((role) => {
                    past_roles.push({
                        role_uuid: role.role_uuid,
                        timestamp_gained: role.timestamp_gained,
                        timestamp_revoked: Date.now() / 1000,
                    });
                });
                // Filter out the removed roles from the active_roles array
                active_roles = active_roles.filter(
                    (role) => !removed_role_ids.includes(role.role_uuid),
                );
            }

            // Add new roles to the active_roles array
            active_roles = active_roles.concat(
                new_role_ids.map((uuid) => ({
                    role_uuid: uuid,
                    timestamp_gained: Date.now() / 1000,
                })),
            );

            const new_user: TUser = {
                uuid: user.uuid,
                name: data.get("name") as string,
                email: data.get("email") as string,
                college_id: data.get("college_id") as string,
                active_roles: active_roles,
                past_roles: past_roles,
                active_certificates: user.active_certificates,
                past_certificates: user.past_certificates,
                files: user.files,
                availability: user.availability,
            };

            console.log(new_user);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            setSendingChanges(true);
            mutation.mutate({ data: new_user, isNew: isNew });
        },
        [user.uuid, isEmpty],
    );

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const [UUID, setUUID] = React.useState<string>(user.uuid);
    const [collegeID, setCollegeID] = React.useState<string>(user.college_id);
    const [name, setName] = React.useState<string>(user.name);
    const [email, setEmail] = React.useState<string>(user.email);

    const [roles, setRoles] = React.useState<Selection>(
        new Set(user.active_roles.map((role: TUserRoleLog) => role.role_uuid)),
    );

    const placeholder = (text: string) => (isEmpty ? `Select a user` : text);
    const multiDisabledPlaceholder = (text: string) =>
        isMultiple ? `Disabled for batch edit` : placeholder(text);

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    }, []);

    return (
        <Form
            onSubmit={onSubmit}
            className="grid grid-cols-2 gap-4 lg:flex lg:h-full"
        >
            <div className="flex flex-row gap-4 w-full h-fit">
                <Input
                    type="text"
                    label="UUID"
                    name="uuid"
                    // If no user is selected, show a different placeholder
                    placeholder={multiDisabledPlaceholder("UUID")}
                    // UUID is not editable
                    isDisabled
                    // If the user exists, prefill the input with the user's uuid
                    value={UUID}
                    onValueChange={wrapEdit(setUUID)}
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
                    // Create button to copy the UUID to the clipboard
                    size="md"
                    radius="lg"
                    className="my-auto"
                    isIconOnly
                    // Disable the button if there are multiple or no users selected
                    isDisabled={isEmpty || isMultiple}
                    onPress={() => {
                        // Copy the UUID to the clipboard
                        navigator.clipboard.writeText(UUID);
                    }}
                >
                    <ClipboardIcon className="size-6 text-primary-300" />
                </Button>
            </div>
            <Input
                type="text"
                label="College ID"
                name="college_id"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("ID #")}
                // Disable the input if there are multiple or no users are selected
                isDisabled={isEmpty || isMultiple}
                // ID must not be empty
                isRequired
                // If the user exists, prefill the input with the user's id
                value={collegeID}
                onValueChange={wrapEdit(setCollegeID)}
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
            <Input
                type="text"
                label="Name"
                name="name"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("Firstname Lastname")}
                // Disable the input if there are multiple or no users are selected
                isDisabled={isEmpty || isMultiple}
                // Name must not be empty
                isRequired
                // If the user exists, prefill the input with the user's name
                value={name}
                onValueChange={wrapEdit(setName)}
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
            <Input
                type="text"
                label="Email"
                name="email"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("user@college.edu")}
                // Disable the input if there are multiple or no users are selected
                isDisabled={isEmpty || isMultiple}
                // Email must not be empty
                isRequired
                // If the user exists, prefill the input with the user's email
                value={email}
                onValueChange={wrapEdit(setEmail)}
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
            <Divider className="h-[1px] bg-default-400 col-span-2" />
            <Select
                items={user_role_query.data ?? []}
                name="roles"
                // Disable the input if no users are selected
                isDisabled={isEmpty}
                selectedKeys={roles}
                onSelectionChange={wrapEdit(setRoles)}
                selectionMode="multiple"
                isMultiline
                placeholder="Select roles"
                size="lg"
                variant="faded"
                color="primary"
                label="Roles"
                labelPlacement="outside"
                classNames={{
                    base: "col-span-2",
                    label: "pl-2",
                    value: "text-default-500",
                }}
                renderValue={(selectedKeys) => {
                    if (selectedKeys.length === 0) {
                        return "";
                    } else {
                        return (
                            <div className="flex flex-wrap gap-1 p-2">
                                {selectedKeys.map(
                                    (
                                        selected_role: SelectedItemProps<TUserRole>,
                                    ) => (
                                        <UserRole
                                            key={selected_role.data?.uuid}
                                            role_uuid={
                                                selected_role.data?.uuid || ""
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        );
                    }
                }}
            >
                {(role) => (
                    <SelectItem
                        key={role.uuid}
                        value={role.uuid}
                        textValue={role.title}
                    >
                        <UserRole role_uuid={role.uuid} />
                    </SelectItem>
                )}
            </Select>
            <Divider className="h-[1px] bg-default-400 col-span-2" />
            <Button
                size="lg"
                className="w-full mt-auto col-span-2"
                isDisabled={isEmpty || !hasEdits}
                isLoading={sendingChanges}
                color={"primary"}
                variant="shadow"
                type="submit"
            >
                {isMultiple ? "Apply Batch Edit" : "Update User"}
            </Button>
        </Form>
    );
}
