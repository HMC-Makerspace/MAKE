import {
    Input,
    Selection,
    SortDescriptor,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Modal,
    Spinner,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Checkbox,
    Link,
    Select,
    SelectItem,
    Form
} from "@heroui/react";
import React from "react"
import { RESTOCK_REQUEST_STATUS, TRestockRequest, TRestockRequestLog } from "../../../../../common/restock";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

    // Define the mutation function that will run when the form is submitted
    const updateRestockRequest = async ({
        data,
    }: {
        data: TRestockRequest;
    }) => {
        return (await axios.put<TRestockRequest>(`/api/v3/restock`, { request_obj: data })) // fixing here
            .data;
    };
    

export default function RestockEditor({onClose, restock} : {onClose:() => void; restock: TRestockRequest}) {

    const isEmpty = !restock.uuid;

    const [UUID, setUUID] = React.useState<string>(
            restock.uuid,
        );
    
    const [sendingChanges, setSendingChanges] = React.useState<boolean>(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: updateRestockRequest,
        onSuccess: (result: TRestockRequest) => {
            queryClient.setQueryData(["restock"], (old: TRestockRequest[]) => {
                return old.map((u) => (u.uuid === UUID ? result : u));
            });
        },
        onSettled: () => {
            setSendingChanges(false);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            console.log("submitting form");

            // If something is wrong, don't submit.
            if (isEmpty) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            const changed_restock: TRestockRequest = {
                uuid: restock.uuid,
                item_uuid: restock.item_uuid,
                current_quantity: restock.current_quantity,
                quantity_requested: restock.quantity_requested,
                reason: restock.reason,
                requesting_user: restock.requesting_user,
                current_status: parseInt(data.get("status") as string) || RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
                status_logs: [...restock.status_logs, 
                    {
                        
                        timestamp: Math.floor(Date.now() / 1000),
                        status: parseInt(data.get("status") as string) || RESTOCK_REQUEST_STATUS.PENDING_APPROVAL,
                        message: data.get("completion_note") as string || "Status updated",
            
                    }

                ]
                
            };

            console.log(changed_restock);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            setSendingChanges(true);
            mutation.mutate({ data: changed_restock});
            onClose();
        },
        [restock],
    );



    const restockOptions = [
        {key:RESTOCK_REQUEST_STATUS.PENDING_APPROVAL, label: "Pending"},
        {key:RESTOCK_REQUEST_STATUS.APPROVED_WAITING, label: "Approved, Waiting"},
        {key:RESTOCK_REQUEST_STATUS.APPROVED_ORDERED, label: "Ordered"},
        {key:RESTOCK_REQUEST_STATUS.RESTOCKED, label: "Restocked"},
        {key:RESTOCK_REQUEST_STATUS.DENIED, label: "Denied"}
    ];

    return (
        <>
            <ModalHeader className="flex flex-col gap-1">Modify Restock Request</ModalHeader>

            <ModalBody className=''>
                <Form onSubmit={onSubmit}>
                    <Select 
                        label="Update Restock Status"
                        name="status"
                    >
                        {
                            restockOptions.map((option) => (
                                <SelectItem key={option.key}>{option.label}</SelectItem>
                            ))
                        }
                    </Select>
                    <Input label="Completion Note" placeholder="Enter notes" variant="bordered" name="completion_note" />

                    <ModalFooter className="flex align-center">
                    <Button color="danger" variant="flat" >
                        Cancel
                    </Button>
                    <Button color="primary" type="submit" >
                        Save Changes
                    </Button>
                </ModalFooter>

                </Form>
            </ModalBody>
        </>
    )
}