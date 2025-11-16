import { ModalBody, ModalFooter, ModalHeader, Button, Form, addToast } from "@heroui/react";
import { TRestockRequest } from "common/restock";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import UsersTable from "../users/UsersTable";
import { TUser } from "common/user";
import { Selection } from "@heroui/react";
import React from "react";
import axios from "axios";

const updateRestocks = async ({
    restock,
}: {
    restock: TRestockRequest;
}) => {
    // Add the user to the restock request's mailing list
    return (
        await axios.patch<TRestockRequest>(
            `/api/v3/restock/mailing_list/${restock.uuid}`,
            {
                person_obj: restock.mailing_list,
            },
        )
    ).data;
};


export default function RestockUserList({
    onClose,
    prevRestock,
    users,
    isLoading,
    
}: {
    onClose: () => void;
    prevRestock: TRestockRequest;
    users: TUser[];
    isLoading:boolean;
}) {

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const selectedUsers = React.useMemo(
        () =>
            selectedKeys === "all"
                ? users
                : users.filter((user) => selectedKeys.has(user.uuid)),
        [selectedKeys, users],
    );

    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: updateRestocks,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(
                ["restock"],
                (old: TRestockRequest[]) =>
                    old.map((w) => (w.uuid === data.uuid ? data : w)),
            );
            addToast({
                title: `${"Successfully added to mailing list"}`,
                color: "success",
            });
            onClose();
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
    
                // Get form data as an object.
                const data = new FormData(e.currentTarget);
    
                const restock: TRestockRequest = {
                          ...prevRestock,
                          mailing_list: [
                              ...prevRestock.mailing_list,
                              selectedUsers[0].uuid,
                          ],
                      };
                // Reset the mutation (clears any previous errors)
                mutation.reset();
                // Run the mutation
                mutation.mutate({ restock: restock });
            },
            [prevRestock.uuid, selectedUsers[0]?.uuid],
        );

    return (
        <>
            <ModalHeader>
                Add User to Mailing List
            </ModalHeader>
            <Form onSubmit={onSubmit} className='w-full max-h-full overflow-auto'>

                <ModalBody className="w-full">
                    
                    <div className='w-full flex justify-center overflow-auto justify-items-start'>
                        <div className='w-[90%] max-h-[90%] justify-center  overflow-auto '>
                            <UsersTable
                                users={users}
                                roles={[]}
                                certs={[]}
                                selectedKeys={selectedKeys}
                                onSelectionChange={onSelectionChange}
                                isLoading={isLoading}
                                onCreate={() => {}} // Not used
                                fullHeader={false}
                                defaultColumns={["college_id", "name", "email"]}
                            />
                        </div>
                    </div>
                    <div className='flex flex-row gap-2 w-full justify-center items-center'>

                        <h1>Add</h1>
                        <h1 className='font-bold'>{ selectedUsers.length > 0 ? selectedUsers[0].name : "-" }</h1>
                        <h1> to resock mailing list</h1>
                    </div>

                    <ModalFooter>
                    <div className="flex flex-row justify-between w-full gap-2">
                        <Button
                            variant="shadow"
                            type="submit"
                            color="primary"
                            className="w-full sm:w-auto"
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
                </ModalFooter>
                </ModalBody>
            </Form>

        </>
    )
}