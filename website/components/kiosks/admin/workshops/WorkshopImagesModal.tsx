import React from "react";
import {
    Input,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Select,
    SelectItem,
    Form,
    Textarea,
} from "@heroui/react";
import { TWorkshop } from "../../../../../common/workshop";
import ImageCarousel from "../../../ImageCarousel";
import { FILE_RESOURCE_TYPE } from "../../../../../common/file";
import { UUID } from "common/global";

export default function WorkshopImagesModal({
    workshop,
    isOpen,
    onOpenChange,
    firstTime = false,
}: {
    workshop?: TWorkshop | UUID[];
    isOpen: boolean;
    onOpenChange: () => void;
    firstTime?: boolean;
}) {
    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            size="lg"
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center"
        >
            <ModalContent>
                <ModalHeader>
                    {firstTime ? "Add Batch Image" : "Workshop Images"}
                </ModalHeader>

                <ModalBody className="flex flex-col items-center px-6 justify-center">
                    <div className="w-[90%] h-[40vh]">
                        {workshop ? (
                            <ImageCarousel
                                resource_uuid={Array.isArray(workshop) ? workshop : workshop.uuid}
                                resource_type={FILE_RESOURCE_TYPE.WORKSHOP}
                                editable={true}
                                firstTime={firstTime}
                            />
                        ) : (
                            <div>No workshop selected.</div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter className="flex flex-col items-center">
                    <Button
                        color="primary"
                        onPress={() => {
                            onOpenChange();
                        }}
                    >
                        Done
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
