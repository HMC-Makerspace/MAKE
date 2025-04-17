import React, {useEffect} from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  Tabs,
  Tab
} from "@heroui/react";
import { TWorkshop } from "../../../../../common/workshop";

export default function WorkshopPeopleModal({
    workshop,
    isOpen,
    onOpenChange,
}:{
  workshop: TWorkshop | null;
  isOpen: boolean;
  onOpenChange: () => void;
}) {

  useEffect(() => {
    {
      for (let key in workshop?.rsvp_list) {
        console.log(key, workshop?.rsvp_list[key]); // Access key and value
      }
    }
  }, [isOpen])
  return (
    <Modal
      isOpen={isOpen}
      placement="top-center"
      onOpenChange={onOpenChange}
      className="flex flex-col justify-center"
      size="lg"
      >
        <ModalContent>
        <ModalHeader>
          People
        </ModalHeader>
      <ModalBody className='flex flex-col items-center'>
        <Tabs 
          aria-label="Options"
          size="md"
        >
          <Tab 
            key="signups" 
            title="Signups"
          >
          {workshop?.rsvp_list ? (
            Object.entries(workshop.rsvp_list).map(([key, value]) => (
              <div key={key}>
                {key}: {value}
              </div>
            ))
          ) : (
            <p>No Signups Found</p>
          )}
          </Tab>
          <Tab 
            key="attendees" 
            title="Attendees"
          >

          </Tab>
        </Tabs>
      </ModalBody>
        </ModalContent>
    </Modal>
  )
}