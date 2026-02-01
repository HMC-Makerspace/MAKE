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
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import {
    TRestockRequest,
    RESTOCK_REQUEST_STATUS,
} from "../../../../../common/restock";
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

export default function UserExportModal({
    users,
    isOpen,
    onOpenChange,
}: {
    users: TUser[];
    isOpen: boolean;
    onOpenChange: () => void;
}) {
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default browser page refresh.
        e.preventDefault();

        // Get form data as an object.
        const data = new FormData(e.currentTarget);
    };

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            size="lg"
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col justify-between pb-2">
                            Export User Data
                            <div className="text-small text-default-400">
                                {`Total ${users.length} entries`}
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <Form onSubmit={onSubmit}>
                                <div className="w-full flex flex-col gap-2">
                                    <Autocomplete
                                        label="Separator"
                                        name="separator"
                                        variant="faded"
                                        color="primary"
                                        size="md"
                                        labelPlacement="outside-left"
                                        classNames={{
                                            base: "w-full justify-center",
                                        }}
                                        defaultInputValue="Comma"
                                    >
                                        <AutocompleteItem key=",">
                                            Comma
                                        </AutocompleteItem>
                                        <AutocompleteItem key={`\t`}>
                                            Tab
                                        </AutocompleteItem>
                                    </Autocomplete>
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
                                        variant="flat"
                                        color="danger"
                                        onPress={onClose}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="shadow"
                                        color="primary"
                                        type="submit"
                                    >
                                        Export
                                    </Button>
                                </ModalFooter>
                            </Form>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
