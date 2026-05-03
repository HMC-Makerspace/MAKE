import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
} from "@heroui/react";
import { TWorkshop } from "../../../../common/workshop";
import { UserChip } from "../../user/UserChip";

export default function WorkshopUserListModal({
    workshop,
    type,
    isOpen,
    onOpenChange,
}: {
    workshop: TWorkshop;
    type: "rsvp" | "sign-in";
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    const typeName = type === "rsvp" ? "RSVP" : "Sign in";
    const userList =
        type === "rsvp" ? workshop.rsvp_list : workshop.sign_in_list;
    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center align-center overflow-auto"
            size="2xl"
        >
            <ModalContent className="overflow-auto max-h-[66%]">
                <ModalHeader>
                    <h1 className="text-2xl font-bold">
                        {typeName} list for workshop "{workshop.title}"
                    </h1>
                </ModalHeader>
                <ModalBody className="overflow-auto h-full">
                    <div className="size-full flex flex-col gap-4 items-center overflow-auto">
                        {userList.map((u, i) => {
                            const RSVP_index = workshop.rsvp_list.findIndex(
                                (r) => r.user_uuid === u.user_uuid,
                            );
                            const RSVPd = RSVP_index !== -1;
                            const onWaitlist =
                                RSVPd &&
                                workshop.capacity &&
                                RSVP_index >= workshop.capacity;

                            return (
                                <div className="w-full flex gap-2 p-2 bg-default-200 rounded-2xl">
                                    <div className="font-bold text-default-700 p-2 content-center">
                                        {i + 1}.
                                    </div>
                                    <UserChip
                                        user_uuid={u.user_uuid}
                                        classNames={{
                                            wrapper:
                                                "items-center sm:items-start",
                                            name: "text-ellipsis overflow-hidden",
                                            description:
                                                "text-ellipsis overflow-hidden",
                                        }}
                                    />
                                    {type === "sign-in" && (
                                        <div className="font-bold text-default-700 p-2 content-center ml-auto">
                                            {onWaitlist
                                                ? `Waitlist #${RSVP_index + 1}`
                                                : RSVPd
                                                  ? `RSVP #${RSVP_index + 1}`
                                                  : "Walk-In"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ModalBody>
                <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
