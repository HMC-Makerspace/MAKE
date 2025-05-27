import { Modal, ModalContent, Button, Form } from "@heroui/react";
import React from "react";

/** Delete Confirmation Modal */
export default function DeleteModal({
    itemType,
    itemName,
    onSubmit,
    isOpen,
    onOpenChange,
    isLoading,
}: {
    itemType: string;
    itemName: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    isLoading: boolean;
}) {
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold capitalize">
                            Delete{` ${itemType}`}
                        </div>
                        <div className="flex flex-col gap-2">
                            <p>
                                Are you sure you want to delete the
                                {` ${itemType}${itemName ? " " : ""}`}
                                <span className="font-semibold">
                                    {itemName}
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
                                isLoading={isLoading}
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
