import React from "react";
import axios from "axios";
import { addToast } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TCertification } from "common/certification";
import DeleteModal from "../../../DeleteModal";

export default function DeleteCertModal({
    cert,
    isOpen,
    onOpenChange,
}: {
    cert: TCertification;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            return axios.delete(`/api/v3/certification/${cert.uuid}`);
        },
        onSuccess: () => {
            addToast({
                title: `Successfully deleted certification "${cert.name}"`,
                color: "success",
            });

            // Remove the cert from the query cache
            queryClient.setQueryData(
                ["certification"],
                (old: TCertification[]) => {
                    return old.filter((c) => c.uuid !== cert.uuid);
                },
            );
            queryClient.removeQueries({
                queryKey: ["certification", cert.uuid],
            });
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

            // Run the mutation
            mutation.mutate();
            onOpenChange(false);
        },
        [mutation],
    );

    return (
        <DeleteModal
            itemType="certification"
            itemName={cert.name}
            onSubmit={onSubmit}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isLoading={mutation.isPending}
        />
    );
}
