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
    Select,
    SelectItem
} from "@heroui/react";
import {
    TRestockRequest,
    RESTOCK_REQUEST_STATUS,
} from "../../../../../common/restock";
import RestockType from "./RestockType";
import { InventoryItemUUID, TInventoryItem } from "common/inventory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TUser } from "common/user";
import axios from "axios";
import clsx from "clsx";
import React, { useState } from "react";

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
    inventory,
}: {
    requestingUser?: TUser;
    restocks: TRestockRequest[];
    restockSelected: TInventoryItem;
    editIsOpen: boolean;
    editOnOpenChange: () => void;
    inventory: TInventoryItem[];
}) {
    const restockOptions = [restockSelected.uuid, ...(restockSelected.kit_contents ?? [])];

    const prevRestocks = new Map<InventoryItemUUID, TRestockRequest | undefined>();
    for (let i of restockOptions) {
        prevRestocks.set(i, restocks.findLast(
            (r) => r.item_uuid == i,
        ));
    }

    const isPrevOld = function(prev: TRestockRequest | undefined) {
        // this is a new restock if it isn't in the list, or if it is on the list and
        // its status isn't restock or pending
        return !prev ||
            prev.current_status === RESTOCK_REQUEST_STATUS.RESTOCKED ||
            prev.current_status === RESTOCK_REQUEST_STATUS.DENIED;
    }

    const canReq = function(isNew: boolean, restockRequest: TRestockRequest | undefined) {
        // Whether the user is able to be added to the restock's mailing list
        // (e.g. they are not already on the list)
        return !isNew && requestingUser && restockRequest
            ? !(
                restockRequest.mailing_list.includes(requestingUser.uuid) ||
                restockRequest.requesting_user == requestingUser.uuid
            )
            : true;
    }

    const [prevRestock, setPrevRestock_] = useState<TRestockRequest | undefined>(prevRestocks.get(restockSelected.uuid));
    const [isNew, setIsNew] = useState<boolean>(isPrevOld(prevRestock));
    const [userCanRequest, setUserCanRequest] = useState<boolean>(canReq(isNew, prevRestock));

    const setPrevRestock = function(newreq: TRestockRequest | undefined) {
        setPrevRestock_(newreq);
        
        let updatedIsNew = isPrevOld(newreq);
        setIsNew(updatedIsNew);

        setUserCanRequest(canReq(updatedIsNew, newreq));
    }

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
            addToast({
                title: `${isNew ? "Successfully created restock" : "Successfully added to mailing list"}`,
                color: "success",
            });
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

            if (!requestingUser) {
                return;
            }

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            const restock: TRestockRequest = isNew || !prevRestock
                ? {
                      uuid: crypto.randomUUID(),
                      item_uuid: data.get("req_item") as InventoryItemUUID ?? restockSelected.uuid,
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
            mutation.mutate({ restock: restock, isNew: isNew ?? true });
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
                                    <div className="w-full flex flex-col gap-2">
                                        <div className="flex flex-row gap-2">
                                            <Select<TInventoryItem>
                                                label="Item Requested"
                                                name="req_item"
                                                placeholder="Pick an item to restock"
                                                defaultSelectedKeys={[restockSelected.uuid]}
                                                isRequired
                                                isDisabled={restockSelected.kit_contents?.length == 0 || !isPrevOld(prevRestocks.get(restockSelected.uuid))}
                                                onSelectionChange={keys => {
                                                    let key = Array.from(keys)[0];
                                                    setPrevRestock(prevRestocks.get(key as InventoryItemUUID));
                                                }}
                                                size="md"
                                                variant="faded"
                                                color="primary"
                                                labelPlacement="inside"
                                                classNames={{
                                                    value: "text-default-500",
                                                }}
                                                itemHeight={45}
                                            >
                                                {restockOptions.map((a) => {
                                                    let itm = inventory.find(i => i.uuid === a);
                                                    if (itm == undefined) return (<></>);
                                                    return (
                                                        <SelectItem
                                                            key={itm.uuid}
                                                            textValue={itm.name}
                                                            className="h-[45px]"
                                                        >
                                                            {itm.name}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </Select>

                                            {(isNew || !prevRestock) && (<NumberInput
                                                label="Requested Quantity"
                                                name="req_quantity"
                                                minValue={1}
                                                defaultValue={1}
                                                variant="faded"
                                                color="primary"
                                                size="md"
                                            />)}
                                        </div>
                                        {(isNew || !prevRestock) && (<Textarea
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
                                        />)}
                                    </div>

                                    {!isNew && prevRestock && (
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
                                        </div>
                                    )}
                                    
                                    <ModalFooter className="w-full justify-between">
                                        <Button
                                            variant="shadow"
                                            color="primary"
                                            type="submit"
                                            isDisabled={
                                                !userCanRequest ||
                                                mutation.isPending
                                            }
                                            isLoading={mutation.isPending}
                                        >
                                            {isNew || !prevRestock
                                                ? "Submit"
                                                : "Join Mailing List"}
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
