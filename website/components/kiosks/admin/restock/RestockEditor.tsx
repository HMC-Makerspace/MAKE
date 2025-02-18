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
    restock_uuid,
}: {
    data: TRestockRequestLog;
    restock_uuid: UUID;
}) => {
    return (
        await axios.patch<TRestockRequest>(
            `/api/v3/restock/status/${restock_uuid}`,
            {
                status_obj: data,
            },
        )
    ).data;
};

export default function RestockEditor({
    onClose,
    restock,
}: {
    onClose: () => void;
    restock: TRestockRequest;
}) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateRestockRequestLogs,
        onSuccess: (result: TRestockRequest) => {
            // Update the restock request in the query cache
            queryClient.setQueryData(["restock"], (old: TRestockRequest[]) => {
                return old.map((u) => (u.uuid === restock.uuid ? result : u));
            });
            queryClient.setQueryData(["restock", restock.uuid], result);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
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
                message:
                    (data.get("completion_note") as string) || "Status updated",
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_status, restock_uuid: restock.uuid });
            onClose();
        },
        [restock.uuid],
    );

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
                        defaultSelectedKeys={[
                            restock.current_status.toString(),
                        ]}
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
