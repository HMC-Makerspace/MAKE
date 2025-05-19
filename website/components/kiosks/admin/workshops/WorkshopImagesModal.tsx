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

export default function WorkshopImagesModal({
    workshop,
    isOpen,
    onOpenChange,
}:{
    workshop?: TWorkshop;
    isOpen: boolean;
    onOpenChange: () => void;
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
                Workshop Images
            </ModalHeader>

            <ModalBody className='flex flex-col items-center px-6 justify-center'>
              <div className="w-[90%] h-[40vh]">
                <ImageCarousel
                uuid={workshop?.uuid}
                fileType={FILE_RESOURCE_TYPE.WORKSHOP} 
                editable={true}
                />
              </div>
                
            </ModalBody>
            <ModalFooter className='flex flex-col items-center'>
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
  )
}