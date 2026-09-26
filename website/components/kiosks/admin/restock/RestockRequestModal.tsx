import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    Button,
    Input,
    Textarea,
    NumberInput,
    addToast,
    Checkbox,
} from "@heroui/react";
import {
    TRestockRequest,
    RESTOCK_REQUEST_STATUS,
} from "../../../../../common/restock";
import RestockType from "./RestockType";
import { TInventoryItem } from "common/inventory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TUser } from "common/user";
import axios from "axios";
import clsx from "clsx";
import React, { useState } from "react";
import { XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const updateRestocks = async ({
    restock,
    isNew,
    associated_uuid,
}: {
    restock: TRestockRequest;
    isNew: boolean;
    associated_uuid: string | undefined;
}) => {
    if (isNew) {
        // Creating new restock request
        return (
            await axios.post<TRestockRequest>("/api/v3/restock/", {
                request_obj: restock,
                associated_uuid,
            })
        ).data;
    } else {
        // Add the user to the restock request's mailing list or update reason
        return (
            await axios.put<TRestockRequest>(
                `/api/v3/restock/`,
                {
                    request_obj: restock,
                    associated_uuid
                },
            )
        ).data;
    }
};

export default function RestockRequestModal({
    requestingUser,
    restocks,
    restockSelected,
    editIsOpen,
    editOnOpenChange,
    type,
}: {
    requestingUser?: TUser;
    restocks: TRestockRequest[];
    restockSelected: TInventoryItem;
    editIsOpen: boolean;
    editOnOpenChange: () => void;
    type: "create_self" | "create_other" | "both";
}) {
    const prevRestock = restocks.findLast(
        (r) => r.item_uuid == restockSelected.uuid,
    );

    // is a new restock if it isn't in the list, or if it is on the list and
    // its status isn't restock or pending
    const isNew =
        !prevRestock ||
        prevRestock.current_status === RESTOCK_REQUEST_STATUS.RESTOCKED ||
        prevRestock.current_status === RESTOCK_REQUEST_STATUS.DENIED;

    const [forOtherUser, setForOtherUser] = useState(false);
    const [otherEmail, setOtherEmail] = useState<string>();

    // Whether the user is able to be added to the restock's mailing list
    // (e.g. they are not already on the list)
    const userCanJoinMailingList =
        type !== "create_other" && prevRestock && requestingUser
            ? !(
                  prevRestock.mailing_list.includes(requestingUser.uuid) ||
                  prevRestock.requesting_user == requestingUser.uuid
              )
            : true;
    // Whether the user is able to add other people to the restock's mailing list
    const userCanRequestOther = type === "create_other";

    const { data: otherUser, isPending: otherUserLoading } = useQuery<TUser>({
        queryKey: ["user", "by", "email", otherEmail],
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: 1,
        enabled: !!otherEmail,
    });

    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateRestocks,
        onSuccess: (data, variables) => {
            if (variables.isNew) {
                queryClient.setQueryData(
                    ["restock"],
                    (old: TRestockRequest[]) => [...old, data],
                );
            } else {
                queryClient.setQueryData(
                    ["restock"],
                    (old: TRestockRequest[]) =>
                        old.map((w) => (w.uuid === data.uuid ? data : w)),
                );
            }
            const title = isNew
                ? "Successfully created restock"
                : requestingUser?.uuid &&
                    !(
                        prevRestock.mailing_list.includes(
                            requestingUser.uuid,
                        ) || prevRestock.requesting_user === requestingUser.uuid
                    ) &&
                    data.mailing_list.includes(requestingUser.uuid)
                  ? "Successfully joined mailing list"
                  : "Successfully updated restock";
            addToast({
                title,
                color: "success",
            });
            setForOtherUser(false);
            setOtherEmail(undefined);
            editOnOpenChange();
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

            if (!requestingUser || (otherEmail && otherUserLoading)) {
                return;
            }

            // Get form data as an object.
            const data = new FormData(e.currentTarget);
            // Reason can be added any time
            const reason = data.get("reason_restock") as string;

            const restock: TRestockRequest | undefined = !isNew
                ? { ...prevRestock }
                : {
                      uuid: crypto.randomUUID(),
                      item_uuid: restockSelected.uuid,
                      current_status: RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
                      quantity_requested: Number(data.get("req_quantity")),
                      reason: reason,
                      // Add other user to email list if necessary
                      mailing_list:
                          type !== "create_other" && !!otherUser
                              ? [otherUser.uuid]
                              : [],
                      requesting_user:
                          type === "create_other"
                              ? (otherUser?.uuid ?? requestingUser.uuid)
                              : requestingUser.uuid,
                      status_logs: [],
                  };

            // Add self or other user if not already on mailing list
            const relevant_uuid = forOtherUser || type === "create_other"
                ? otherUser?.uuid
                : requestingUser.uuid;
            if (
                relevant_uuid &&
                !restock.mailing_list.includes(relevant_uuid) &&
                restock.requesting_user !== relevant_uuid
            ) {
                restock.mailing_list.push(relevant_uuid);
            }

            // Add the new reason or an empty reason if the request is new
            if (reason || isNew) {
                restock.status_logs.push({
                    timestamp: Date.now() / 1000,
                    status: restock.current_status,
                    message: reason,
                });
            }
            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({
                restock: restock,
                isNew: isNew,
                associated_uuid: otherUser?.uuid,
            });
        },
        [
            isNew,
            prevRestock,
            restockSelected.uuid,
            requestingUser?.uuid,
            otherUser,
            otherEmail,
            otherUserLoading,
        ],
    );

    return (
        <Modal
            isOpen={editIsOpen}
            placement="top-center"
            onOpenChange={() => {
                editOnOpenChange();
                setForOtherUser(false);
                setOtherEmail(undefined);
            }}
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) =>
                    restockSelected ? (
                        <div className="w-full overflow-auto">
                            <ModalHeader className="pb-2">
                                Restock Request Form
                            </ModalHeader>
                            <ModalBody>
                                <Form onSubmit={onSubmit}>
                                    {isNew ? (
                                        <div className="w-full flex flex-col gap-2">
                                            <div className="flex flex-row gap-2">
                                                <Input
                                                    label="Item Requested"
                                                    isDisabled
                                                    defaultValue={
                                                        restockSelected.name
                                                    }
                                                    variant="faded"
                                                    color="primary"
                                                    size="md"
                                                />
                                                <NumberInput
                                                    label="Requested Quantity"
                                                    name="req_quantity"
                                                    minValue={1}
                                                    defaultValue={1}
                                                    variant="faded"
                                                    color="primary"
                                                    size="md"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full overflow-auto">
                                            {userCanJoinMailingList && (
                                                /* LEFT OFF HERE, NEED TO DO OTHER AND BOTH
                                                JOINING AND OTHERING
                                                */
                                                <p className="pb-2">
                                                    There is already a restock
                                                    request for this item. If
                                                    you would like to be
                                                    notified when it is
                                                    restocked, please select
                                                    "Join Mailing List" below.
                                                </p>
                                            )}
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-row gap-2 items-center ">
                                                    <h3 className="font-bold">
                                                        Current Status:
                                                    </h3>
                                                    <RestockType
                                                        request_status={
                                                            prevRestock.current_status
                                                        }
                                                        size="md"
                                                    />
                                                </div>
                                                <div className="w-full overflow-auto flex flex-col gap-2 items-left ">
                                                    <h3 className="font-bold">
                                                        Last Message:
                                                    </h3>
                                                    <p className="overflow-auto pl-4">
                                                        {prevRestock.status_logs.at(
                                                            -1,
                                                        )
                                                            ? prevRestock.status_logs.at(
                                                                  -1,
                                                              )?.message
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="pt-4 pb-2">
                                                If you would like to add an
                                                additional comment, please enter
                                                it in the textbox below.
                                            </p>
                                        </div>
                                    )}
                                    {type === "both" && (
                                        <div className="flex flex-row gap-1 align-middle">
                                            <Checkbox
                                                color="primary"
                                                checked={forOtherUser}
                                                onValueChange={setForOtherUser}
                                            />
                                            <span className="text-sm">
                                                For another user?
                                            </span>
                                        </div>
                                    )}
                                    {(type === "create_other" ||
                                        (type === "both" && forOtherUser)) && (
                                        <Input
                                            name="user_email"
                                            label="User Email"
                                            placeholder="Enter email"
                                            variant="faded"
                                            color="primary"
                                            size="md"
                                            isRequired
                                            classNames={{
                                                input: clsx([
                                                    "placeholder:text-default-500",
                                                    "placeholder:italic",
                                                    "text-default-700",
                                                ]),
                                            }}
                                            onBlur={(e) =>
                                                setOtherEmail(
                                                    e.currentTarget.value ||
                                                        undefined,
                                                )
                                            }
                                            validate={(value) =>
                                                value === ""
                                                    ? "Please fill out this field"
                                                    : otherEmail && !otherUser
                                                      ? "No user found with given email."
                                                      : null
                                            }
                                            endContent={
                                                !otherEmail ||
                                                otherUserLoading ? undefined : !otherUser ? (
                                                    <XCircleIcon className="text-danger-300 size-5" />
                                                ) : (
                                                    <CheckCircleIcon className="text-success-300 size-5" />
                                                )
                                            }
                                        />
                                    )}
                                    <Textarea
                                        label={
                                            isNew
                                                ? "Reason for Restock"
                                                : "Updated Reason"
                                        }
                                        name="reason_restock"
                                        placeholder="Enter reason"
                                        variant="faded"
                                        color="primary"
                                        classNames={{
                                            input: clsx([
                                                "placeholder:text-default-500",
                                                "placeholder:italic",
                                                "text-default-700",
                                            ]),
                                            base: "w-full",
                                        }}
                                        required={
                                            !isNew && !userCanJoinMailingList
                                        }
                                        isRequired={
                                            !isNew && !userCanJoinMailingList
                                        }
                                    />
                                    <ModalFooter className="w-full justify-between">
                                        <Button
                                            variant="shadow"
                                            color="primary"
                                            type="submit"
                                            isDisabled={
                                                !!otherEmail && otherUserLoading
                                            }
                                            isLoading={mutation.isPending}
                                        >
                                            {isNew
                                                ? "Submit Request"
                                                : userCanJoinMailingList &&
                                                    !forOtherUser
                                                  ? "Join Mailing List"
                                                  : "Update Request"}
                                        </Button>
                                        <Button
                                            variant="flat"
                                            color="danger"
                                            onPress={onClose}
                                        >
                                            Cancel
                                        </Button>
                                    </ModalFooter>
                                </Form>
                            </ModalBody>
                        </div>
                    ) : null
                }
            </ModalContent>
        </Modal>
    );
}
