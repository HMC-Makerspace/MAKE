import { Button, Modal, Form, ModalContent, Checkbox } from "@heroui/react";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";

import { UserRoleUUID, TUserRole } from "common/user";
import { UUID } from "common/global";
import { UserRoleSelect } from "../../../user/UserRoleSelect";

export default function RequiredRolesModal<
    // Allow any type that has a uuid and optional required_roles list
    T extends { uuid: UUID; authorized_roles?: UserRoleUUID[] | null },
>({
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
                authorized_roles?: UserRoleUUID[] | null;
            };
        }
    >;
}) {
    const [hasEdits, setHasEdits] = React.useState(false);
    const [currentRoles, setCurrentRoles] = React.useState<UserRoleUUID[]>(
        element.authorized_roles || [],
    );
    // An open authorized object always has an empty role list and is available to anyone,
    // whereas an closed authorized object with an empty role list is available to no one.
    const [openAuthorized, setOpenAuthorized] = React.useState(
        element.authorized_roles === null,
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            if (openAuthorized) {
                patchMutation.mutate({
                    uuid: element.uuid,
                    patch: { authorized_roles: null },
                });
            } else {
                patchMutation.mutate({
                    uuid: element.uuid,
                    patch: { authorized_roles: currentRoles },
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
                            Edit Authorized Roles
                        </div>
                        <div>
                            Users with at least one of the selected roles will
                            be able to reserve this machine.
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
                                        ? "Reservable by all roles"
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
