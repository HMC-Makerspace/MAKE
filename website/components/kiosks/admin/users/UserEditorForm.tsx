import {
    Alert,
    Button,
    Divider,
    Form,
    Input,
    select,
    Select,
    SelectedItemProps,
    Selection,
    SelectItem,
    Snippet,
    addToast
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { TUser, TUserRole, TUserRoleLog, UserRoleUUID } from "common/user";
import React from "react";
import UserRole from "../../../user/UserRole";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { TrashIcon } from "@heroicons/react/24/outline";

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

const deleteUser = async ({
    user_uuid
}: {
    user_uuid: string
}) => {
    return (await axios.delete(`/api/v3/user/${user_uuid}`)).data
}

export default function UserEditorForm({
    user,
    roles,
    isMultiple,
    isNew,
}: {
    user: TUser;
    roles: TUserRole[];
    isMultiple: boolean;
    isNew: boolean;
}) {
    const isEmpty = !user.uuid && !isNew;

    const [UUID, setUUID] = React.useState<string>(
        isNew ? crypto.randomUUID() : user.uuid,
    );

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUpdateUser,
        onSuccess: (result: TUser) => {
            queryClient.setQueryData(["user", UUID], result);
            queryClient.setQueryData(["user"], (old: TUser[]) => {
                if (isNew) {
                    return [...old, result];
                } else {
                    return old.map((u) => (u.uuid === UUID ? result : u));
                }
            });

            addToast({
                title: `Successfully ${isNew ? "created" : "updated"} user${isMultiple ? "s" : ""}`,
                color: "success",
            });

            setHasEdits(false);
            console.log(result);
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["user"], (old: TUser[]) =>
                old.filter((u) => u.uuid !== variables.user_uuid),
            );
            addToast({
                title: `Successfully deleted user`,
                color: "success",
            });
            setHasEdits(false);
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
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
                uuid: UUID,
                name: data.get("name") as string,
                email: data.get("email") as string,
                college_id: data.get("college_id") as string,
                active_roles: active_roles,
                past_roles: past_roles,
                active_certificates: user.active_certificates,
                past_certificates: user.past_certificates,
                files: user.files,
                work_schedules: user.work_schedules,
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_user, isNew: isNew });
        },
        [user, UUID, isEmpty],
    );

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const [collegeID, setCollegeID] = React.useState<string>(user.college_id);
    const [name, setName] = React.useState<string>(user.name);
    const [email, setEmail] = React.useState<string>(user.email);

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

    const isValid = React.useMemo(() => {
        return (
            hasEdits &&
            UUID.length > 0 &&
            // collegeID.length > 0 &&
            name.length > 0 &&
            email.length > 0
        );
    }, [hasEdits, UUID, collegeID, name, email]);

    const user_roles = user.active_roles.map(
        (role: TUserRoleLog) => role.role_uuid,
    );

    return (
        <>
            <Form
                onSubmit={onSubmit}
                className="grid grid-cols-2 gap-4 lg:flex lg:h-full"
            >
                <Snippet
                    // Allow user uuid to be copied
                    variant="bordered"
                    color="default"
                    symbol={""}
                    size="md"
                    className="w-full text-default-500 relative h-14"
                    timeout={1000}
                    classNames={{
                        copyButton:
                            "absolute right-2 bg-default-200 hover:!bg-default-300",
                    }}
                >
                    {UUID}
                </Snippet>

                <Input
                    type="text"
                    label="College ID"
                    name="college_id"
                    // If no user is selected, show a different placeholder
                    placeholder={multiDisabledPlaceholder("ID #")}
                    // Disable the input if there are multiple or no users are selected
                    isDisabled={isEmpty || isMultiple}
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
                    type="email"
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
                <UserRoleSelect
                    roles={roles}
                    onSelectionChange={(selection) => {
                        if (selection == "all") {
                            setHasEdits(true);
                        } else if (
                            user_roles.length == selection.size &&
                            user_roles.every((r) => selection.has(r))
                        ) {
                            setHasEdits(false);
                        } else {
                            setHasEdits(true);
                        }
                    }}
                    defaultSelectedKeys={user_roles}
                    isDisabled={isEmpty}
                    className="col-span-2"
                />
                <Divider className="h-[1px] bg-default-400 col-span-2" />
                <div className="w-full mt-auto col-span-2 flex flex-row gap-2">
                    <Button
                        size="lg"
                        className="w-full"
                        isDisabled={isEmpty || !isValid}
                        isLoading={mutation.isPending}
                        color={"primary"}
                        variant="shadow"
                        type="submit"
                    >
                        {isNew
                            ? "Create User"
                            : isMultiple
                              ? "Apply Batch Edit"
                              : "Update User"}
                    </Button>
                    <Button
                        isIconOnly
                        size="lg"
                        color="danger"
                        variant="flat"
                        isDisabled={isEmpty}
                        isLoading={deleteMutation.isPending}
                        startContent={<TrashIcon className="size-5" />}
                        onPress={() =>
                            deleteMutation.mutate({ user_uuid: user.uuid })
                        }
                    ></Button>
                </div>
            </Form>
        </>
    );
}
