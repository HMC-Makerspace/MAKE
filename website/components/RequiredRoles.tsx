import {
    Button,
    Modal,
    Form,
    ModalContent,
    Checkbox,
    ModalHeader,
} from "@heroui/react";

import React, { useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";

import { UserRoleUUID, TUserRole } from "common/user";
import { UUID } from "common/global";
import { UserRoleSelect } from "./user/UserRoleSelect";
import clsx from "clsx";

type Available = {
    uuid: UUID;
    available_to?: UserRoleUUID[] | null;
};

type Visible = {
    uuid: UUID;
    visible_to?: UserRoleUUID[] | null;
};

export function RequiredRoles({
    type,
    roles,
    currentRoles,
    setCurrentRoles,
    setHasEdits = () => {},
    size = "lg",
    className,
}: {
    type: "available_to" | "visible_to";
    roles: TUserRole[];
    currentRoles: UserRoleUUID[] | null;
    setCurrentRoles: (newRoles: UserRoleUUID[] | null) => void;
    setHasEdits?: (has: boolean) => void;
    size?: "sm" | "lg";
    className?: string;
}) {
    // An open authorized object always has an empty role list and is available to anyone,
    // whereas an closed authorized object with an empty role list is available to no one.
    const openAuthorized = currentRoles == null;

    return (
        <div className={clsx("flex flex-col gap-2 w-full", className)}>
            {size === "lg" && (
                <div>
                    Users with at least one of the selected roles will have
                    permission to{" "}
                    {type == "available_to" ? "use/access." : "view."}
                    <br />
                    To enable access for all users regardless of role, select
                    the All toggle.
                </div>
            )}

            <div className="flex flex-row w-full gap-2 items-center">
                <UserRoleSelect
                    roles={roles}
                    selectedKeys={currentRoles || []}
                    label=""
                    placeholder={
                        openAuthorized
                            ? `${type === "available_to" ? "Accessible" : "Viewable"} by all roles`
                            : `${type === "available_to" ? "Accessible to" : "Visible to"} no one, click to select roles`
                    }
                    isDisabled={openAuthorized}
                    onSelectionChange={(s) => {
                        if (s === "all") {
                            setCurrentRoles(roles.map((r) => r.uuid));
                        } else {
                            setCurrentRoles(Array.from(s) as string[]);
                        }
                        setHasEdits(true);
                    }}
                    className="h-full"
                    classNames={{
                        label: "pl-2",
                        value: `text-default-500 content-center ${size === "sm" ? "text-sm" : ""}`,
                        trigger: "py-2",
                    }}
                    size="sm"
                />
                <div
                    className={clsx(
                        "h-full flex flex-col text-center w-fit",
                        size === "sm" ? "-mt-3 gap-1" : "-mt-6 gap-2",
                    )}
                >
                    <span className="text-primary-300 text-xs">All</span>
                    <Checkbox
                        isSelected={openAuthorized}
                        onValueChange={(isOpenToAll) => {
                            if (isOpenToAll) {
                                setCurrentRoles(null);
                                setHasEdits(true);
                            } else {
                                setCurrentRoles([]);
                                setHasEdits(true);
                            }
                        }}
                        color="primary"
                        size="lg"
                        className="mx-auto"
                        classNames={{
                            wrapper: "me-0",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// Overloaded
export function RequiredRolesModal({
    type,
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    type: "available_to";
    element: Available;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        typeof element,
        Error,
        {
            uuid: UUID;
            patch: {
                available_to?: UserRoleUUID[] | null;
            };
        }
    >;
}): React.ReactNode;
export function RequiredRolesModal({
    type,
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    type: "visible_to";
    element: Visible;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        typeof element,
        Error,
        {
            uuid: UUID;
            patch: {
                visible_to?: UserRoleUUID[] | null;
            };
        }
    >;
}): React.ReactNode;
export function RequiredRolesModal({
    type,
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    type: "available_to" | "visible_to";
    element: {
        uuid: UUID;
        available_to?: UserRoleUUID[] | null;
        visible_to?: UserRoleUUID[] | null;
    };
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        typeof element,
        Error,
        {
            uuid: UUID;
            patch: {
                available_to?: UserRoleUUID[] | null;
                visible_to?: UserRoleUUID[] | null;
            };
        }
    >;
}) {
    const [currentRoles, setCurrentRoles] = useState<UserRoleUUID[] | null>(
        element[type] || null,
    );
    const [hasEdits, setHasEdits] = React.useState(false);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            patchMutation.reset();

            let patch = { [type]: currentRoles };

            patchMutation.mutate({
                uuid: element.uuid,
                patch,
            });
            setHasEdits(false);
            onOpenChange(false);
        },
        [patchMutation],
    );
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="2xl"
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">
                            Edit{" "}
                            {type == "available_to"
                                ? "Accessor Roles"
                                : "Viewer Roles"}
                        </div>
                        <RequiredRoles
                            type={type}
                            roles={roles}
                            currentRoles={currentRoles}
                            setCurrentRoles={setCurrentRoles}
                            setHasEdits={setHasEdits}
                        />
                        <div className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!hasEdits}
                                isLoading={patchMutation.isPending}
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

// Wrappers for the above component to account for both types of authorized roles
// trying to figure out typescript things for this, so may not work lol

export function AvailableToRolesModal<T extends Available>({
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    element: T;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                available_to?: UserRoleUUID[] | null;
            };
        }
    >;
}) {
    return (
        <RequiredRolesModal
            type="available_to"
            element={element}
            roles={roles}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            patchMutation={patchMutation}
        />
    );
}

export function VisibleToRolesModal<T extends Visible>({
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    element: T;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                visible_to?: UserRoleUUID[] | null;
            };
        }
    >;
}) {
    return (
        <RequiredRolesModal
            type="visible_to"
            element={element}
            roles={roles}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            patchMutation={patchMutation}
        />
    );
}
