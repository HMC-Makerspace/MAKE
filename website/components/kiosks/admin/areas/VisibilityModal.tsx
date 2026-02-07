import { Button, Modal, Form, ModalContent, Checkbox } from "@heroui/react";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";

import { UserRoleUUID, TUserRole, UserUUID } from "common/user";
import { UUID } from "common/global";
import { UserRoleSelect } from "../../../user/UserRoleSelect";

export default function RequiredRolesModal({
    item,
    itemType,
    roles,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    item: { uuid: UUID; visible_to?: UserUUID[] | null };
    itemType: string;
    roles: TUserRole[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        { uuid: UUID; visible_to?: UserUUID[] | null },
        Error,
        {
            uuid: UUID;
            patch: {
                visible_to?: UserRoleUUID[] | null;
            };
        }
    >;
}) {
    const [hasEdits, setHasEdits] = React.useState(false);
    const [currentRoles, setCurrentRoles] = React.useState<UserRoleUUID[]>(
        item.visible_to || [],
    );
    // An open authorized object always has an empty role list and is available to anyone,
    // whereas an closed authorized object with an empty role list is available to no one.
    const [openVisible, setOpenVisible] = React.useState(
        item.visible_to === null,
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            if (openVisible) {
                patchMutation.mutate({
                    uuid: item.uuid,
                    patch: { visible_to: null },
                });
            } else {
                patchMutation.mutate({
                    uuid: item.uuid,
                    patch: { visible_to: currentRoles },
                });
            }
            onOpenChange(false);
            setHasEdits(false);
        },
        [
            patchMutation,
            hasEdits,
            openVisible,
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
                        <div className="text-lg font-semibold capitalize">
                            Edit {itemType} Visibility
                        </div>
                        <div>
                            If no roles are selected, then no users will be able
                            to see this{" "}
                            <span className="capitalize">{itemType}</span>. To
                            enable access for all users regardless of role,
                            select the Open Access toggle. Otherwise, only users
                            with the selected roles will be able to see this{" "}
                            {itemType}.
                        </div>

                        <div
                            className="flex flex-row w-full gap-2 items-center"
                            key={item.uuid + "-role"}
                        >
                            <UserRoleSelect
                                roles={roles}
                                selectedKeys={currentRoles}
                                label=""
                                placeholder={
                                    openVisible
                                        ? "Visible to all roles"
                                        : "Select roles"
                                }
                                isDisabled={openVisible}
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
                                <span className="text-success-200 text-xs mb-2">
                                    Open
                                </span>
                                <Checkbox
                                    isSelected={openVisible}
                                    onValueChange={(v) => {
                                        setOpenVisible(v);
                                        setCurrentRoles([]);
                                        setHasEdits(true);
                                    }}
                                    color="success"
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
