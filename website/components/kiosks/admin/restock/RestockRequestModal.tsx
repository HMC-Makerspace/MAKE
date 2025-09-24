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
import React from "react";

const updateRestocks = async ({
    restock,
    isNew,
}: {
    restock: TRestockRequest;
    isNew: boolean;
}) => {
    if (isNew) {
        // Creating new restock request
        return (
            await axios.post<TRestockRequest>("/api/v3/restock/", {
                request_obj: restock,
            })
        ).data;
    } else {
        // Add the user to the restock request's mailing list
        return (
            await axios.patch<TRestockRequest>(
                `/api/v3/restock/mailing_list/${restock.uuid}`,
                {
                    person_obj: restock.mailing_list,
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
    onSuccess,
    onError,
}: {
    requestingUser?: TUser;
    restocks: TRestockRequest[];
    restockSelected: TInventoryItem;
    editIsOpen: boolean;
    editOnOpenChange: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
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

    // Whether the user is able to be added to the restock's mailing list
    // (e.g. they are not already on the list)
    const userCanRequest =
        prevRestock && requestingUser
            ? !(
                  prevRestock.mailing_list.includes(requestingUser.uuid) ||
                  prevRestock.requesting_user == requestingUser.uuid
              )
            : true;

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
            onSuccess("Restock request updated successfully");
            editOnOpenChange();
        },
        onError: (error) => {
            onError("Error updating restock request: " + error.message);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!requestingUser) {
                return;
            }

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            const restock: TRestockRequest = isNew
                ? {
                      uuid: crypto.randomUUID(),
                      item_uuid: restockSelected.uuid,
                      current_status: RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
                      quantity_requested: Number(data.get("req_quantity")),
                      reason: data.get("reason_restock") as string,
                      mailing_list: [],
                      requesting_user: requestingUser.uuid,
                      status_logs: [
                          {
                              timestamp: Date.now() / 1000,
                              status: RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
                              message: data.get("reason_restock") as string,
                          },
                      ],
                  }
                : {
                      ...prevRestock,
                      mailing_list: [
                          ...prevRestock.mailing_list,
                          requestingUser.uuid,
                      ],
                  };
            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ restock: restock, isNew: isNew });
        },
        [restockSelected.uuid, requestingUser?.uuid],
    );

    return (
        <Modal
            isOpen={editIsOpen}
            placement="top-center"
            onOpenChange={editOnOpenChange}
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) =>
                    restockSelected ? (
                        <div className="w-full">
                            <ModalHeader>Restock Request Form</ModalHeader>
                            <ModalBody>
                                <Form onSubmit={onSubmit}>
                                    {isNew ? (
                                        <>
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
                                                <Textarea
                                                    label="Reason for Restock"
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
                                                />
                                            </div>

                                            <ModalFooter className="w-full justify-between">
                                                <Button
                                                    variant="shadow"
                                                    color="primary"
                                                    type="submit"
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
                                            </ModalFooter>
                                        </>
                                    ) : (
                                        <div>
                                            <p className="pb-2">
                                                There is already a restock
                                                request for this item. If you
                                                would like to be notified when
                                                it is restocked, please select
                                                "Join Mailing List" below.
                                            </p>

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
                                                <div className="flex flex-row gap-2 items-center ">
                                                    <h3 className="font-bold">
                                                        Last Message:
                                                    </h3>
                                                    <p>
                                                        {prevRestock.status_logs.at(
                                                            -1,
                                                        )
                                                            ? prevRestock.status_logs.at(
                                                                  -1,
                                                              )?.message
                                                            : ""}
                                                    </p>
                                                </div>

                                                {userCanRequest ? null : (
                                                    <div className="flex justify-center">
                                                        <p className="font-bold">
                                                            You are already on
                                                            the mailing list.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <ModalFooter className="w-full justify-between">
                                                <Button
                                                    variant="shadow"
                                                    color="primary"
                                                    type="submit"
                                                    isDisabled={!userCanRequest}
                                                >
                                                    Join Mailing List
                                                </Button>
                                                <Button
                                                    variant="flat"
                                                    color="danger"
                                                    onPress={onClose}
                                                >
                                                    Cancel
                                                </Button>
                                            </ModalFooter>
                                        </div>
                                    )}
                                </Form>
                            </ModalBody>
                        </div>
                    ) : null
                }
            </ModalContent>
        </Modal>
    );
}
