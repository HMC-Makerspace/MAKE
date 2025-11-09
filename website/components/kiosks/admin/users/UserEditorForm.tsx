import {
    Button,
    Chip,
    Divider,
    Form,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Snippet,
    Tooltip,
    addToast,
    useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
    TUser,
    TUserRole,
    TUserRoleLog,
    UserRoleUUID,
    UserUUID,
} from "common/user";
import React from "react";
import axios from "axios";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import {
    ArrowRightEndOnRectangleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import {
    CheckCircleIcon,
    LockClosedIcon,
    LockOpenIcon,
    XCircleIcon,
} from "@heroicons/react/24/solid";

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

const deleteUser = async ({ user_uuid }: { user_uuid: string }) => {
    return (await axios.delete(`/api/v3/user/${user_uuid}`)).data;
};

export default function UserEditorForm({
    user,
    roles,
    isMultiple,
    isNew,
    onCreate,
}: {
    user: TUser;
    roles: TUserRole[];
    isMultiple: boolean;
    isNew: boolean;
    onCreate?: (newUser: UserUUID) => void;
}) {
    const isEmpty = !user.uuid && !isNew;

    const UUID = user.uuid;

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
            setHasEdits({
                name: false,
                college_id: false,
                email: false,
                roles: false,
                passkey: false,
            });
            if (onCreate && isNew) {
                onCreate(UUID);
            }
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
            setHasEdits({
                name: false,
                college_id: false,
                email: false,
                roles: false,
                passkey: false,
            });
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
                passkey: data.get("passkey") as string,
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_user, isNew: isNew });
        },
        [user, UUID, isEmpty],
    );

    type editableKeys = "name" | "college_id" | "email" | "roles" | "passkey";

    const [hasEdits, setHasEdits] = React.useState<{
        [key in editableKeys]: boolean;
    }>({
        name: false,
        college_id: false,
        email: false,
        roles: false,
        passkey: false,
    });

    const placeholder = (text: string) => (isEmpty ? `Select a user` : text);
    const multiDisabledPlaceholder = (text: string) =>
        isMultiple ? `Disabled for batch edit` : placeholder(text);
    const patchEdits = (key: editableKeys, value: boolean) => {
        const new_edits = { ...hasEdits };
        new_edits[key] = value;
        setHasEdits(new_edits);
    };

    const user_roles = user.active_roles.map(
        (role: TUserRoleLog) => role.role_uuid,
    );

    // If any input has edits, the form is submittable.
    const isSubmittable = Object.values(hasEdits).some(Boolean);

    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

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
                    defaultValue={user.college_id}
                    onValueChange={(value) =>
                        patchEdits(
                            "college_id",
                            // Not technically required
                            value !== user.college_id,
                        )
                    }
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
                    defaultValue={user.name}
                    onValueChange={(value) =>
                        patchEdits("name", !!value && value !== user.name)
                    }
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
                    defaultValue={user.email}
                    onValueChange={(value) =>
                        patchEdits("email", !!value && value !== user.email)
                    }
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
                            patchEdits("roles", true);
                        } else if (
                            user_roles.length == selection.size &&
                            user_roles.every((r) => selection.has(r))
                        ) {
                            patchEdits("roles", false);
                        } else {
                            patchEdits("roles", true);
                        }
                    }}
                    defaultSelectedKeys={user_roles}
                    isDisabled={isEmpty}
                    className="col-span-2"
                />
                <Divider className="h-[1px] bg-default-400 col-span-2" />
                <div className="flex flex-row w-full gap-2 items-center">
                    <div
                        className={clsx(
                            "flex flex-col gap-1",
                            (isEmpty || isMultiple) && "opacity-disabled",
                        )}
                    >
                        <div className="text-primary text-small pl-2 flex-1">
                            Passkey
                        </div>
                        <div className="text-tiny text-default-500 pl-2">
                            Used as an alternate auth method via request headers
                            or by holding alt when logging in.
                        </div>
                    </div>
                    <Tooltip
                        content={"Create this user before assigning a passkey."}
                        isDisabled={!isNew}
                        color="primary"
                    >
                        <Button
                            className={clsx(
                                "flex-1 px-2 max-w-10",
                                isNew && "!opacity-disabled",
                            )}
                            variant="faded"
                            isDisabled={isEmpty || isMultiple}
                            onPress={() => (!isNew ? onOpen() : undefined)}
                        >
                            {user.passkey || isEmpty ? (
                                <>
                                    <LockClosedIcon className="size-5 flex-1" />
                                    <CheckCircleIcon className="flex-1 size-4 text-success-300" />
                                </>
                            ) : (
                                <>
                                    <LockOpenIcon className="size-5 flex-1" />
                                    <XCircleIcon className="flex-1 size-4 text-danger-300" />
                                </>
                            )}
                        </Button>
                    </Tooltip>
                </div>
                <Button
                    fullWidth
                    isDisabled={isEmpty || isMultiple || isNew}
                    variant="flat"
                    color="primary"
                    startContent={
                        <ArrowRightEndOnRectangleIcon className="size-6" />
                    }
                    onPress={async () =>
                        await axios
                            .get(`/login/${user.uuid}`)
                            .then(() => (window.location.href = "/"))
                    }
                >
                    Login as User
                </Button>
                <div className="w-full mt-auto col-span-2 flex flex-row gap-2">
                    <Button
                        size="lg"
                        className="w-full"
                        isDisabled={isEmpty || !isSubmittable}
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
                        isDisabled={isEmpty || isMultiple}
                        isLoading={deleteMutation.isPending}
                        startContent={<TrashIcon className="size-5" />}
                        onPress={() =>
                            deleteMutation.mutate({ user_uuid: user.uuid })
                        }
                    ></Button>
                </div>
            </Form>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    <Form
                        validationBehavior="native"
                        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                            // Prevent default browser page refresh.
                            e.preventDefault();

                            // If something is wrong, don't submit.
                            if (isEmpty || isNew) return;

                            // Get form data as an object.
                            const data = new FormData(e.currentTarget);

                            const passkey = data.get("passkey") as string;

                            const new_user: TUser = {
                                ...user,
                                passkey: passkey,
                            };

                            // Reset the mutation (clears any previous errors)
                            mutation.reset();
                            // Run the mutation
                            mutation.mutate(
                                { data: new_user, isNew: isNew },
                                {
                                    onSettled: onClose,
                                },
                            );
                        }}
                    >
                        <ModalHeader>
                            {user.passkey ? "Overwrite Passkey" : "Set Passkey"}
                        </ModalHeader>
                        <ModalBody className="pt-0">
                            <Input
                                description={
                                    "Used as an alternate auth method via request headers " +
                                    "or by holding alt when logging in. Passkeys are immediately " +
                                    "hashed on the server and are not retrievable."
                                }
                                type="password"
                                label="New Passkey"
                                name="passkey"
                                size="lg"
                                minLength={1}
                                isDisabled={isEmpty || isMultiple}
                                color="primary"
                                variant="faded"
                                classNames={{
                                    description: "text-default-500 pl-2",
                                }}
                            />
                        </ModalBody>
                        <ModalFooter className="pt-0 flex flex-row justify-around w-full">
                            <Button
                                color="primary"
                                type="submit"
                                className="w-1/3"
                                isDisabled={mutation.isPending}
                            >
                                Submit
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={onClose}
                                className="w-1/3"
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Form>
                </ModalContent>
            </Modal>
        </>
    );
}
