import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
} from "@heroui/react";
import { TWorkshop } from "../../../../common/workshop";
import { UserChip } from "../../user/UserChip";
import { UUID } from "common/global";

export default function WorkshopSigninListModal({
    workshop,
    isOpen,
    onOpenChange,
}: {
    workshop: TWorkshop;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    const getUserPlace = (uuid: UUID) => {
        let i = 0;
        while (i < workshop.rsvp_list.length) {
            if (workshop.rsvp_list[i].user_uuid == uuid) {
                return i;
            }
            i++;
        }
        return -1;
    }

    const getUserSpot = (uuid: UUID) => {
        let place = getUserPlace(uuid);

        if (place < 0) return "";
        else if (!workshop.capacity || place < workshop.capacity) return `RSVP #${1+place}`
        else return `Waitlist #${1+place-workshop.capacity}`
    }

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
                    {workshop.sign_in_list.map(u => (<div className="flex flex-row">
                        <UserChip
                            user_uuid={u.user_uuid}
                            className="flex-auto mx-1"
                        ></UserChip>
                        <div className="px-5 mx-1 flex items-center justify-center">{getUserSpot(u.user_uuid)}</div>
                    </div>))}
                </ModalBody>
                <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
