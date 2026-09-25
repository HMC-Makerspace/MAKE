import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Button,
} from "@heroui/react";
import { TWorkshop } from "../../../../common/workshop";
import { UserChip } from "../../user/UserChip";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { TUser } from "common/user";

export default function WorkshopRSVPDisclaimerModal({
    overCapacity,
    workshop,
    rsvpMutation,
    isOpen,
    onOpenChange,
}: {
    overCapacity: boolean;
    workshop: TWorkshop;
    rsvpMutation: UseMutationResult<
        TWorkshop,
        AxiosError<{ error: string }, any>,
        { workshop_uuid: string; cancel: boolean },
        unknown
    >;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center align-center overflow-auto"
        >
            <ModalContent className="overflow-auto max-h-[66%]">
                {(onClose) => (
                    <>
                        <ModalHeader>
                            <h3 className="text-2xl font-bold">Disclaimer</h3>
                        </ModalHeader>
                        <ModalBody className="overflow-auto h-full">
                            <div className="size-full flex flex-col gap-4 items-center overflow-auto">
                                <p>{workshop.rsvp_disclaimer}</p>
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex flex-row justify-between items-center">
                            <Button 
                                color="primary"
                                onPress={() => {
                                    rsvpMutation.mutate({
                                        workshop_uuid:
                                            workshop.uuid,
                                        cancel: false
                                    });
                                    onClose();
                                }
                                    
                                }
                            >
                                {overCapacity ? "I understand, Join Waitlist" : "I understand, RSVP"}
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
