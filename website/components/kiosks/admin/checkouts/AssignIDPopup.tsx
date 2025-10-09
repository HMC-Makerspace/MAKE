import {
    addToast,
    Button,
    Form,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    NumberInput,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    CertificationUUID,
    TCertification,
    TRequiredCertificate,
} from "common/certification";
import { TUser, UserUUID } from "common/user";
import React, { useState } from "react";
import CertificationTag from "../certifications/CertificationTag";
import clsx from "clsx";

async function patchCollegeID({
    user_uuid,
    college_id,
}: {
    user_uuid: UserUUID;
    college_id: string;
}) {
    return (
        await axios.patch<TUser>(`/api/v3/user/${user_uuid}/info`, {
            college_id: college_id,
        })
    ).data;
}

export default function AssignIDPopup({
    missingIDUser,
    setMissingIDUser,
    college_id,
}: {
    missingIDUser?: TUser;
    setMissingIDUser: (user?: TUser) => void;
    college_id?: string;
}) {
    const queryClient = useQueryClient();

    const collegeIDMutation = useMutation({
        mutationFn: patchCollegeID,
        onSuccess: (data) => {
            queryClient.setQueryData(["user", data.uuid], data);
            queryClient.setQueryData(
                ["user", "by", "id", data.college_id],
                data,
            );
            queryClient.setQueryData(["user"], (old: TUser[]) =>
                old.map((u) => (u.uuid === data.uuid ? data : u)),
            );
            addToast({
                title: "Successfully updated user.",
                color: "success",

            });
            setMissingIDUser(undefined);
        },
        onError: (err) => {
            addToast({
                title: "Error: " + err,
                color: "danger",
            });
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!missingIDUser || !college_id) return;

            collegeIDMutation.reset();

            // Run the mutation
            collegeIDMutation.mutate({
                user_uuid: missingIDUser.uuid,
                college_id: college_id,
            });
        },
        [collegeIDMutation, missingIDUser, college_id],
    );

    return (
        <Modal
            isOpen={!!missingIDUser}
            onOpenChange={() => setMissingIDUser(undefined)}
            backdrop="blur"
            size="lg"
        >
            <ModalContent>
                {(onClose) => {
                    if (!missingIDUser || !college_id) return <></>;

                    return (
                        <Form
                            onSubmit={onSubmit}
                            className="flex flex-col"
                            validationBehavior="native"
                        >
                            <ModalHeader className="text-2xl">
                                Assign College ID
                            </ModalHeader>
                            <ModalBody>
                                <div className="text-xl">
                                    Are you sure you want to assign the id{" "}
                                    <span className="font-semibold">
                                        {college_id}
                                    </span>{" "}
                                    to the user{" "}
                                    <span className="font-semibold">
                                        {missingIDUser.name}
                                    </span>
                                    ?
                                    <br />
                                    <br />
                                    Once confirmed, only an administrator can
                                    change the user's id.
                                </div>
                            </ModalBody>

                            <ModalFooter className="flex flex-row justify-between w-full gap-2">
                                <Button
                                    variant="shadow"
                                    type="submit"
                                    color="primary"
                                    className="w-full sm:w-auto"
                                    isLoading={collegeIDMutation.isPending}
                                >
                                    Confirm
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
                    );
                }}
            </ModalContent>
        </Modal>
    );
}
