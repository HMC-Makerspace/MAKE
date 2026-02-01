import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
} from "@heroui/react";
import { TWorkshop } from "../../../../common/workshop";
import { UserChip } from "../../user/UserChip";

export default function WorkshopSigninListModal({
    workshop,
    isOpen,
    onOpenChange,
}: {
    workshop: TWorkshop;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center align-center"
            size="2xl"
        >
            <ModalContent>
                <ModalHeader>
                    <h1 className="text-2xl font-bold">Sign in list for workshop "{workshop.title}"</h1>
                </ModalHeader>
                <ModalBody>
                    {workshop.sign_in_list.map(u => (
                        <UserChip
                            user_uuid={u.user_uuid}
                        ></UserChip>
                    ))}
                </ModalBody>
                <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
