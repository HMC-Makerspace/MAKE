import React, { useEffect } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Form,
    Input,
    addToast
} from "@heroui/react";
import { TWorkshop, TWorkshopUserRecord } from "../../../../common/workshop";
import { UserUUID } from "../../../../common/user";
import { UUID } from "../../../../common/global";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkshopSigninConfirmation } from "./WorkshopSigninConfirmation";
import clsx from "clsx";
import axios, { AxiosError } from "axios";

const signinWorkshop = async ({
    workshop_uuid,
    user_uuid,
}: {
    workshop_uuid: UUID;
    user_uuid: UserUUID;
}) => {
    return await axios.patch<TWorkshop>(`/api/v3/workshop/${workshop_uuid}/sign_in/${user_uuid}`);
};

export default function WorkshopSigninModal({
    workshop,
    isOpen,
    onOpenChange,
}: {
    workshop: TWorkshop;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    const queryClient = useQueryClient();
    
    const signinMutation = useMutation({
        mutationFn: signinWorkshop,
        onSuccess: ({ data: updatedWorkshop }) => {
            console.log("Success", updatedWorkshop);

            queryClient.setQueryData(
                ["workshop", updatedWorkshop.uuid],
                updatedWorkshop,
            );
            queryClient.setQueryData(["workshop"], (old: TWorkshop[]) => {
                return (old ?? []).map((oldWorkshop) =>
                    oldWorkshop.uuid === updatedWorkshop.uuid
                        ? updatedWorkshop
                        : oldWorkshop,
                );
            });
            queryClient.setQueryData(
                ["workshop", "public"],
                (old: TWorkshop[]) => {
                    return (old ?? []).map((oldWorkshop) =>
                        oldWorkshop.uuid === updatedWorkshop.uuid
                            ? updatedWorkshop
                            : oldWorkshop,
                    );
                },
            );
            addToast({
                title: `Successfully signed in to workshop`,
                color: "success",
            });
            wrapOnOpenChange(false);
        },
        onError: (e: AxiosError<{ error: string }>) => {
            console.log("Error", e);
            addToast({
                title: `Error: ${e.response?.data?.error}`,
                color: "danger",
            });
        },
    });

    const [email, setEmail] = React.useState<string>("");
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setEmail(formData.get("email") as string);
        },
        [],
    );

    const wrapOnOpenChange = (open?: boolean) => { // wraps onOpenChange() to also reset the email (+ confirmation text)
        onOpenChange(open);
        setEmail("");
    }

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={wrapOnOpenChange}
            className="flex flex-col justify-center align-center"
            size="2xl"
        >
            <ModalContent>
                <ModalHeader>
                    <h1 className="text-2xl font-bold">Sign in to Workshop</h1>
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={onSubmit}>
                        <Input
                            type="text"
                            label="Email"
                            name="email"
                            placeholder="Enter your email to sign in"
                            onValueChange={() => setHasEdits(true)}
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }}
                            isRequired
                        />
                        {email === "" && (
                            <div className="flex flex-row gap-2 justify-between w-full pt-4">
                                <Button
                                    color="primary"
                                    variant="bordered"
                                    isDisabled={!hasEdits}
                                    type="submit"
                                >
                                    Continue
                                </Button>
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={() => {
                                        wrapOnOpenChange(true);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </Form>

                    {email && (
                        <WorkshopSigninConfirmation
                            email={email}
                            rsvp_list={workshop.rsvp_list}
                            capacity={workshop.capacity}
                            onSubmit={(uuid) => {
                                if (!uuid) return;
                                signinMutation.reset();
                                signinMutation.mutate({
                                    workshop_uuid: workshop.uuid,
                                    user_uuid: uuid,
                                });
                            }}
                            onCancel={() => {
                                setEmail("");
                                onOpenChange(false);
                            }}
                        />
                    )}
                </ModalBody>
                <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
