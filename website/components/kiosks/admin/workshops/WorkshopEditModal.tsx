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

export default function WorkshopEditModal({
    workshop,
    isOpen,
    onOpenChange,
}:{
  workshop: TWorkshop | null;
  isOpen: boolean;
  onOpenChange: () => void;
}) {

  return (
    <Modal
      isOpen={isOpen}
      placement="top-center"
      onOpenChange={onOpenChange}
      className="flex flex-col justify-center"
      >
        <ModalContent>
        <ModalHeader>
          <h1 className="text-2xl font-bold">Workshop Edit</h1>
        </ModalHeader>
      <ModalBody>
        <h1>Hiiii</h1>
      </ModalBody>
        </ModalContent>
    </Modal>
  )
}