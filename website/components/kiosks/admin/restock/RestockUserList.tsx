import { ModalBody, ModalFooter, ModalHeader, Button, Form, addToast } from "@heroui/react";
import { TRestockRequest } from "common/restock";
import { UseMutationResult } from "@tanstack/react-query";
import UsersTable from "../users/UsersTable";
import { TUser, UserUUID } from "common/user";
import { Selection } from "@heroui/react";
import React from "react";
import { AxiosError } from "axios";

export default function RestockUserList({
    onClose,
    restock,
    users,
    isLoading,
    mutation,
}: {
    onClose: () => void;
    restock: TRestockRequest;
    users: TUser[];
    isLoading: boolean;
    mutation: UseMutationResult<
        TRestockRequest,
        AxiosError,
        {
            restock: TRestockRequest;
            user_uuid: UserUUID;
            add: boolean;
        }
    >;
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

    return (
        <>
            <ModalHeader>Add User to Mailing List</ModalHeader>
            <ModalBody className="w-full">
                <div className="w-full flex justify-center overflow-auto justify-items-start">
                    <div className="w-[90%] max-h-[90%] justify-center  overflow-auto ">
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
                            unselectableUsers={restock.mailing_list}
                        />
                    </div>
                </div>
                <div className="flex flex-row gap-2 w-full justify-center items-center">
                    <h1>Add</h1>
                    <h1 className="font-bold">
                        {selectedUsers.length > 0 ? selectedUsers[0].name : "-"}
                    </h1>
                    <h1> to restock mailing list</h1>
                </div>

                <ModalFooter>
                    <div className="flex flex-row justify-between w-full gap-2">
                        <Button
                            variant="shadow"
                            type="submit"
                            color="primary"
                            className="w-full sm:w-auto"
                            onPress={() =>
                                mutation.mutate(
                                    {
                                        restock,
                                        user_uuid: selectedUsers[0].uuid,
                                        add: true,
                                    },
                                    {
                                        onSuccess: onClose,
                                    },
                                )
                            }
                        >
                            Submit
                        </Button>

                        <Button variant="flat" color="danger" onPress={onClose}>
                            Cancel
                        </Button>
                    </div>
                </ModalFooter>
            </ModalBody>
        </>
    );
}
