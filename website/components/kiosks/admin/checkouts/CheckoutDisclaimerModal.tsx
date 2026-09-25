import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Button,
} from "@heroui/react";
import { TWorkshop } from "../../../../../common/workshop";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { TCheckoutItem } from "common/checkout";
import { TInventoryItem } from "common/inventory";

export default function CheckoutDisclaimerModal({
    type,
    items,
    onSubmit,
    isOpen,
    onOpenChange,
}: {
    type: "checkout" | "return";
    items: TInventoryItem[];
    onSubmit: () => void;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center align-center overflow-auto"
            size="xl"
        >
            <ModalContent className="overflow-auto max-h-[75%]">
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h3 className="text-2xl font-bold capitalize">
                                {type} Disclaimer{items.length > 1 ? "s" : ""}
                            </h3>
                        </ModalHeader>
                        <ModalBody className="overflow-auto h-full pt-0">
                            <div className="size-full flex flex-col gap-4 items-center overflow-auto break-words">
                                {items.map((i) => (
                                    <div
                                        key={i.uuid}
                                        className="flex flex-col gap-2 justify-start w-full"
                                    >
                                        <div className="font-semibold">
                                            {i.name}
                                        </div>
                                        <div className="pl-4">
                                            {type === "checkout"
                                                ? i.checkout_disclaimer
                                                : i.return_disclaimer}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex flex-row justify-between items-center">
                            <Button
                                color="primary"
                                onPress={() => {
                                    onSubmit();
                                    onOpenChange(false);
                                }}
                                className="capitalize"
                            >
                                {type}
                            </Button>
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
