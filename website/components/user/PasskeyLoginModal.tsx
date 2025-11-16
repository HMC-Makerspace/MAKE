import {
    Button,
    Modal,
    Form,
    ModalContent,
    ModalFooter,
    Input,
    addToast,
} from "@heroui/react";

import React, { useState } from "react";
import {
    QueryClient,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { StatusCodes } from "http-status-codes";

async function emailLogin({
    email,
    passkey,
}: {
    email: string;
    passkey: string;
}) {
    return (
        await axios.post("/login/email", {
            email: email,
            passkey: passkey,
        })
    ).data;
}

export default function PasskeyLoginModal({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [email, setEmail] = useState("");
    const [passkey, setPasskey] = useState("");

    const isValid = email && passkey;

    const mutation = useMutation({
        mutationFn: emailLogin,
        onSuccess: () => {
            addToast({
                title: `Successfully logged in`,
                color: "success",
            });
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
        onError: (error: AxiosError) => {
            if (error.status === StatusCodes.UNAUTHORIZED) {
                addToast({
                    title: `Incorrect email/passkey!`,
                    color: "danger",
                });
            } else {
                addToast({
                    title: `Error: ${error.message}`,
                    color: "danger",
                });
            }
        },
    });

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            isDismissable={false}
            isKeyboardDismissDisabled={false}
        >
            <ModalContent className="flex flex-col gap-4 p-4">
                {(onClose) => (
                    <Form
                        validationBehavior="native"
                        onSubmit={(e) => {
                            e.preventDefault();

                            mutation.mutate({
                                email: email,
                                passkey: passkey,
                            });
                        }}
                    >
                        <div className="text-lg font-semibold">
                            Login with Email
                        </div>

                        <Input
                            value={email}
                            onValueChange={setEmail}
                            label="Email"
                            type="email"
                            minLength={1}
                            fullWidth
                            classNames={{
                                mainWrapper: "w-full",
                            }}
                            variant="faded"
                        />
                        <Input
                            value={passkey}
                            onValueChange={setPasskey}
                            label="Passkey"
                            minLength={1}
                            type="password"
                            fullWidth
                            classNames={{
                                mainWrapper: "w-full",
                            }}
                            variant="faded"
                        />

                        <ModalFooter className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                color="primary"
                                fullWidth
                                isDisabled={!isValid}
                                isLoading={mutation.isPending}
                                type="submit"
                            >
                                Submit
                            </Button>
                            <Button
                                variant="flat"
                                color="default"
                                fullWidth
                                onPress={onClose}
                            >
                                Close
                            </Button>
                        </ModalFooter>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}
