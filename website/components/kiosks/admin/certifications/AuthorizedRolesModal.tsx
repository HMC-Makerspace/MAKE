import { Button, Modal, Form, ModalContent, Checkbox } from "@heroui/react";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";

import { UserRoleUUID, TUserRole } from "common/user";
import { UUID } from "common/global";
import { UserRoleSelect } from "../../../user/UserRoleSelect";

type Available = {
    uuid: UUID,
    available_to?: UserRoleUUID[] | null,
}

type Visible = {
    uuid: UUID,
    visible_to?: UserRoleUUID[] | null,
}

function RequiredRolesModal({
    type,
    element,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    type: "available_to" | "visible_to";
    element: any;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        typeof element,
        Error,
        {
            uuid: UUID;
            patch: any;
        }
    >;
}) {
    const [hasEdits, setHasEdits] = React.useState(false);
    const [currentRoles, setCurrentRoles] = React.useState<UserRoleUUID[]>(
        element[type] || [],
    );
    // An open authorized object always has an empty role list and is available to anyone,
    // whereas an closed authorized object with an empty role list is available to no one.
    const [openAuthorized, setOpenAuthorized] = React.useState(
        element[type] == null,
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            let patch: any = {};

            if (openAuthorized) {
                patch[type] = null;
                patchMutation.mutate({
                    uuid: element.uuid,
                    patch,
                });
            } else {
                patch[type] = currentRoles;
                patchMutation.mutate({
                    uuid: element.uuid,
                    patch,
                });
            }
            onOpenChange(false);
            setHasEdits(false);
        },
        [
            patchMutation,
            hasEdits,
            openAuthorized,
            currentRoles,
            onOpenChange,
            setHasEdits,
        ],
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
                            Edit {type == "available_to" ? "Accessor Roles" : "Viewer Roles"}
                        </div>
                        <div>
                            Users with at least one of the selected roles will
                            have {type == "available_to" ? "use" : "view"} permissions.
                        </div>

                        <div
                            className="flex flex-row w-full gap-2 items-center"
                            key={element.uuid + "-role"}
                        >
                            <UserRoleSelect
                                roles={roles}
                                selectedKeys={currentRoles}
                                label=""
                                placeholder={
                                    openAuthorized
                                        ? `${type == "available_to" ? "Usable" : "Viewable"} by all roles`
                                        : "Select roles to authorize"
                                }
                                isDisabled={openAuthorized}
                                onSelectionChange={(s) => {
                                    if (s === "all") {
                                        setCurrentRoles(
                                            roles.map((r) => r.uuid),
                                        );
                                    } else {
                                        setCurrentRoles(
                                            Array.from(s) as string[],
                                        );
                                    }
                                    setHasEdits(true);
                                }}
                            />
                            <div className="w-1/12 h-full flex flex-col text-center -mt-6">
                                <span className="text-primary-300 text-xs mb-2">
                                    All
                                </span>
                                <Checkbox
                                    isSelected={openAuthorized}
                                    onValueChange={(v) => {
                                        setOpenAuthorized(v);
                                        setCurrentRoles([]);
                                        setHasEdits(true);
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
    return (<RequiredRolesModal
        type="available_to"
        element={element}
        roles={roles}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        patchMutation={patchMutation}
    ></RequiredRolesModal>);
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
    return (<RequiredRolesModal
        type="visible_to"
        element={element}
        roles={roles}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        patchMutation={patchMutation}
    ></RequiredRolesModal>);
}