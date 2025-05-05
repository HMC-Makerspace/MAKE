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
    Selection,
} from "@heroui/react";
import { TWorkshop } from "../../../../../common/workshop";
import { MAKEUser } from "../../../user/User";
import MAKETable from '../../../Table.tsx';
import { convertTimestampToDate } from '../../../../utils.tsx';
import type { UUID } from "../../../../../common/global";
import type { UserUUID } from "../../../../../common/user";

//TODO: PUT A PLACE FOR PEOPLE NOTIFIED & CHECK SCROLLING

const rsvpColumns = [
    {name: 'User', id: 'user'},
    {name: 'Sign Up Time', id: 'sign_up_time'},
];
const rsvpDefaultColumns = ['user', 'sign_up_time'];

const attendeeColumns = [
    {name: 'User', id: 'user'},
    {name: 'Attended Time', id: 'attended_time'},
];
const attendeeDefaultColumns = ['user', 'attended_time'];

export default function WorkshopPeopleModal({
    workshop,
    isOpen,
    onOpenChange,
}:{
    workshop?: TWorkshop;
    isOpen: boolean;
    onOpenChange: () => void;
}) {

    const [rsvpList, setRsvpList] = useState<{uuid:UUID; user: string; time: number;}[]>([]);
    const [attendeesList, setAttendeesList] = useState<{uuid:UUID; user: string; time: number;}[]>([]);

    const [rsvpVisibleColumns, setRsvpVisibleColumns] = React.useState<Selection>(
        new Set(rsvpDefaultColumns),
    );

    const [attendeeVisibleColumns, setAttendeeVisibleColumns] = React.useState<Selection>(
        new Set(attendeeDefaultColumns),
    );
    
  useEffect(() => {
    {
        if (workshop?.rsvp_list) {
        // Convert the rsvp_list object to an array of objects
        const rsvpArray = Object.entries(workshop.rsvp_list).map((rsvp) => ({
            uuid: workshop.uuid,
            user: rsvp[1].user_uuid,
            time: rsvp[1].timestamp,
        }));
        setRsvpList(rsvpArray);
      }
    }
    {
      if (workshop?.sign_in_list) {
        // Convert the sign_in_list object to an array of objects
        const signInArray = Object.entries(workshop.sign_in_list).map((rsvp) => ({
			uuid: workshop.uuid,
			user: rsvp[1].user_uuid,
			time: rsvp[1].timestamp,
        }));
        setAttendeesList(signInArray);
      }
    }
      
  }, [isOpen]);

  

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
                        {rsvpList.length > 0 ? (
                        <MAKETable 
                            content={rsvpList}  
                            columns={rsvpColumns}
                            visibleColumns={rsvpVisibleColumns}
                            multiSelect={false}
                            isLoading={false}
                            customColumnComponents={{
                            "user": (user) => {
                                        return (
                                            <div>
                                                <MAKEUser 
                                                user_uuid={user.user}
                                                size="lg" 
                                                />
                                            </div>
                                        )
                                },
                                "sign_up_time": (user) => {
                                return (
                                    <div>
                                    {convertTimestampToDate(user.time)}
                                    </div>
                                )
                                }
                            }}
                        />
                        ) : (
                        <div className='flex items-center justify-center m-8'>
                            <p>No Signups Found</p>
                        </div>
                        )}
                    </Tab>

                    <Tab 
                    key="attendees" 
                    title="Attendees"
                    className='w-full mb-0'
                    >
                        {attendeesList.length > 0 ? (
                        <MAKETable 
                            content={attendeesList}  
                            columns={attendeeColumns}
                            visibleColumns={attendeeVisibleColumns}
                            multiSelect={false}
                            isLoading={false}
                            customColumnComponents={{
                            "user": (user) => {
                                        return (
                                            <div>
                                                <MAKEUser 
                                                user_uuid={user.user}
                                                size="lg" 
                                                />
                                            </div>
                                        )
                                },
                                "attended_time": (user) => {
                                return (
                                    <div>
                                    {convertTimestampToDate(user.time)}
                                    </div>
                                )
                                }
                            }}
                        />
                        ) : (
                        <div className='flex items-center justify-center m-8'>
                            <p>No Signups Found</p>
                        </div>
                        )}
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