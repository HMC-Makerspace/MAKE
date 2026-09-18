import type { TInventoryItem, TInventoryAudit } from "common/inventory";
import { UUID } from "common/global";

import { UseMutationResult } from "@tanstack/react-query";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    DateInput,
    Button,
    Textarea,
} from "@heroui/react";
import { timestampToZonedDateTime } from "../../../../utils";
import clsx from "clsx";
import React from "react";

export default function InventoryAuditModal({
    item,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    item: TInventoryItem;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        TInventoryItem,
        Error,
        {
            uuid: UUID;
            patch: Partial<TInventoryItem>;
        }
    >;
}) {
    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);

            patchMutation.reset();

            patchMutation.mutate({
                uuid: item.uuid,
                patch: {
                    audit_logs: [
                        {
                            timestamp: Date.now() / 1000,
                            description: data.get("description") as string,
                        },
                        ...(item.audit_logs ?? []),
                    ],
                },
            });
            onOpenChange(false);
        },
        [patchMutation],
    );

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <div className="w-full overflow-auto">
                        <ModalHeader>New Inventory Item Audit</ModalHeader>
                        <ModalBody>
                            <Form onSubmit={onSubmit}>
                                <div className="w-full flex flex-col gap-2">
                                    <DateInput
                                        label="Audit Time"
                                        isDisabled
                                        name="audit_time"
                                        value={timestampToZonedDateTime(
                                            Date.now() / 1000,
                                        )}
                                        variant="faded"
                                        color="primary"
                                        size="md"
                                    />
                                    <Textarea
                                        label="Description"
                                        name="description"
                                        placeholder="Enter audit description"
                                        variant="faded"
                                        color="primary"
                                        classNames={{
                                            input: clsx([
                                                "placeholder:text-default-500",
                                                "placeholder:italic",
                                                "text-default-700",
                                            ]),
                                            base: "w-full",
                                        }}
                                    />
                                </div>
                                <ModalFooter className="w-full justify-between">
                                    <Button
                                        variant="shadow"
                                        color="primary"
                                        type="submit"
                                        // isDisabled={!userCanRequest && }
                                        // isLoading={mutation.isPending}
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
                                </ModalFooter>
                            </Form>
                        </ModalBody>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
