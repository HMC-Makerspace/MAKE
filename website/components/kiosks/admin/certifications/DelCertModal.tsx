import {
    Button,
    Modal,
    Form,
    ModalContent,
} from "@heroui/react";

import React from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TCertification } from "common/certification";

export default function DeleteCertModal({
    cert,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    cert: TCertification;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            return axios.delete(`/api/v3/certification/${cert.uuid}`);
        },
        onSuccess: () => {
            onSuccess(`Successfully deleted certification "${cert.name}"`);
            
            // Remove the cert from the query cache
            queryClient.setQueryData(["certification"], (old: TCertification[]) => {
                return old.filter((c) => c.uuid !== cert.uuid);
            });
            queryClient.removeQueries({
                queryKey: ["certification", cert.uuid],
            });
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Run the mutation
            mutation.mutate();
        },
        [mutation],
    );

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">Delete Certification</div>
                        <div className="flex flex-col gap-2">
                            <p>
                                Are you sure you want to delete the certification{" "}
                                <span className="font-semibold">
                                    {cert.name}
                                </span>
                                ?
                            </p>
                            <p className="text-sm text-default-400">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div
                            id="role-bottom-buttons"
                            className="flex flex-row justify-between w-full"
                        >
                            <Button
                                variant="shadow"
                                type="submit"
                                color="danger"
                                className="w-full sm:w-1/4"
                                isLoading={mutation.isPending}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="flat"
                                color="secondary"
                                className="w-1/4"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}