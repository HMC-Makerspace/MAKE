import React, {useEffect,useState} from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalFooter,
  Button,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { TWorkshop } from "../../../../../common/workshop";
import { MAKEUser } from "../../../user/User";
import MAKETable from '../../../Table.tsx';
import { convertTimestampToDate } from '../../../../utils.tsx';
import type { UnixTimestamp } from "../../../../../common/global";
import type { UserUUID } from "../../../../../common/user";


export default function WorkshopPeopleModal({
    workshop,
    isOpen,
    onOpenChange,
}:{
  workshop: TWorkshop | null;
  isOpen: boolean;
  onOpenChange: () => void;
}) {

  const [rsvpList, setRsvpList] = useState<{user: string; time: number;}[]>([]);

  useEffect(() => {
    {
      if (workshop?.rsvp_list) {
        const rsvpListArray = Object.entries(workshop.rsvp_list).map(([user, time]) => ({
          user,
          time,
        }));
        setRsvpList(rsvpListArray);
      }
    }
      
  }, [isOpen])

  const columns = [
    {name: 'User', id: 'user'},
    {name: 'Sign Up Time', id: 'sign_up_time'},
  ]

  return (
    <Modal
      isOpen={isOpen}
      placement="top-center"
      onOpenChange={onOpenChange}
      className="flex flex-col"
      size="lg"
      >
        <ModalContent
        >
        <ModalHeader>
          People
        </ModalHeader>
      <ModalBody className='flex flex-col items-center gap-0'>
        <Tabs 
          aria-label="Options"
          size="md"
        >
          <Tab 
            key="signups" 
            title="Signups"
            className='w-full mb-0'
          >
          {workshop?.rsvp_list && Object.keys(workshop?.rsvp_list).length > 0 ? (
          <Table
            isHeaderSticky
            aria-label="A table for workshop signups"
            fullWidth
        >
            <TableHeader>
                {columns.map((column) => (
                    <TableColumn key={column.id}>{column.name}</TableColumn>
                ))}
            </TableHeader>
            <TableBody>
            
            {Object.entries(workshop.rsvp_list).map(([user, time]) => (
              <TableRow key={user}>
                <TableCell>
                    <MAKEUser 
                    user_uuid={user}
                    size="lg"
                     />
                </TableCell>
                <TableCell>
                    {convertTimestampToDate(time)}
                </TableCell>
            </TableRow>
            ))}
            </TableBody>
        </Table>
        ) : (
          <div className='flex items-center justify-center m-8'>
            <p>No Signups Found</p>
          </div>
          
        )}
          </Tab>
          <Tab 
            key="attendees" 
            title="Attendees"
          >
          </Tab>
        </Tabs>
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