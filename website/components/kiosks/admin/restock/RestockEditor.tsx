import {
    Input,
    Button,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    Form,
    Textarea,
    addToast
} from "@heroui/react";
import React from "react";
import {
    RESTOCK_REQUEST_STATUS,
    RESTOCK_REQUEST_STATUS_LABELS,
    TRestockRequest,
    TRestockRequestLog,
} from "../../../../../common/restock";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UUID } from "common/global";
import RestockType from "./RestockType";

// Define the mutation function that will run when the form is submitted
const updateRestockRequestLogs = async ({
    data,
    restock_uuids,
}: {
    data: TRestockRequestLog;
    restock_uuids: UUID[];
}) => {
    return (
        await axios.patch<TRestockRequest[]>(`/api/v3/restock/statuses`, {
            status_obj: data,
            restock_uuids,
        })
    ).data;
};

export default function RestockEditor({
    onClose,
    restocks,
}: {
    onClose: () => void;
    restocks: TRestockRequest[];
}) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateRestockRequestLogs,
        onSuccess: (result: TRestockRequest[]) => {
            // Update the restock request in the query cache
            queryClient.setQueryData(["restock"], (old: TRestockRequest[]) => {
                return old.map((old_restock) => {
                    for (const new_restock of result) {
                        if (new_restock.uuid === old_restock.uuid) {
                            return new_restock;
                        }
                    }
                    return old_restock;
                });
            });
            addToast({
                title: `Restock request updated successfully`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default browser page refresh.
        e.preventDefault();

        // Get form data as an object.
        const data = new FormData(e.currentTarget);

        // Create a new status log object
        const new_status: TRestockRequestLog = {
            timestamp: Math.floor(Date.now() / 1000),
            status:
                parseInt(data.get("status") as string) ||
                RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
            message: (data.get("completion_note") as string) || undefined,
        };

        // Reset the mutation (clears any previous errors)
        mutation.reset();
        // Run the mutation
        mutation.mutate({
            data: new_status,
            restock_uuids: restocks.map((r) => r.uuid),
        });
        onClose();
    };

    return (
        <>
            <ModalHeader className="flex flex-col gap-1">
                Modify Restock Request
            </ModalHeader>
            <ModalBody>
                <Form onSubmit={onSubmit}>
                    <Select
                        label="Update Restock Status"
                        name="status"
                        color="primary"
                        variant="bordered"
                        labelPlacement="outside"
                        defaultSelectedKeys={
                            restocks.length === 1
                                ? [restocks[0].current_status.toString()]
                                : undefined
                        }
                        isRequired
                        renderValue={(items) =>
                            items.map((item) => (
                                <RestockType
                                    request_status={item.key as number}
                                    size="md"
                                />
                            ))
                        }
                        classNames={{
                            label: "pl-2",
                        }}
                    >
                        {RESTOCK_REQUEST_STATUS_LABELS.map((option) => (
                            <SelectItem key={option.key}>
                                <RestockType request_status={option.key} />
                            </SelectItem>
                        ))}
                    </Select>
                    <Textarea
                        label="Completion Note"
                        placeholder="Enter notes"
                        variant="bordered"
                        color="primary"
                        name="completion_note"
                        classNames={{
                            input: "placeholder:text-default-400 text-default-700",
                        }}
                    />

                    <ModalFooter className="w-full justify-between">
                        <Button
                            color="primary"
                            type="submit"
                            isLoading={mutation.isPending}
                        >
                            Save Changes
                        </Button>
                        <Button color="danger" variant="flat" onPress={onClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </ModalBody>
        </>
    );
}
