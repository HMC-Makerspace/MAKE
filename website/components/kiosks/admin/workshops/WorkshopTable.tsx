import React, {useEffect} from 'react';
import { 
    Selection,
    Button,
    Modal,
    ModalHeader,
    useDisclosure
} from '@heroui/react';
import {
    PhotoIcon,
    UserIcon,
    PencilSquareIcon,
    CheckIcon,
    TrashIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { TWorkshop } from 'common/workshop';
import MAKETable from '../../../Table.tsx';
import  { MAKEUser } from '../../../user/User.tsx';
import  UserRole from '../../../user/UserRole.tsx';
import { convertTimestampToDate } from '../../../../utils.tsx';
import ImageCarousel from '../../../ImageCarousel.tsx';
import { FILE_RESOURCE_TYPE } from '../../../../../common/file.ts';
import WorkshopPeopleModal from './WorkshopPeopleModal.tsx';
import WorkshopImagesModal from './WorkshopImagesModal.tsx';
import WorkshopEditModal from './WorkshopEditModal.tsx';
import DeleteModal from "../../../DeleteModal";


// TODO- 
// [] FIX TIME
// [] FIX AUTHORIZED ROLES

const columns = [
    {name: 'Title', id: 'title'},
    {name: 'Description', id:'description'},
    {name: 'Instructors + Support', id:'instructors'},
    {name: 'Time', id:'ws_time'},
    {name: 'Live', id: 'timestamp_public'},
    {name: 'Capacity', id:'capacity'},
    {name: 'Certifications', id:'required_certifications'},
    // {name: 'RSVP List', id:'rsvp_list'},
    // {name: 'Sign-In List', id:'sign_in_list'},
    {name: 'People', id:'signups'},
    {name: 'Photos', id:'photos'},
    {name: 'Authorized Roles', id:'authorized_roles'},
    {name: 'Edit', id:'edit'},
    {name: 'Delete', id:'delete'}
]
const defaultColumns = [
    'title',
    'description',
    'instructors',
    'ws_time',
    'timestamp_public',
    'capacity',
    'signups',
    'required_certifications',
    // 'rsvp_list',
    // 'sign_in_list',
    'photos',
    'authorized_roles',
    'edit',
    'delete'
]

export default function WorkshopTable({
    workshops,
    isLoading
} : {
    workshops: TWorkshop[];
    isLoading: boolean
}) {

    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
            new Set(defaultColumns),
        );
    
    const [selectedWorkshop, setSelectedWorkshop] = React.useState<TWorkshop | undefined>(undefined);
    const [isNew, setIsNew] = React.useState<boolean>(false);

    const {
            isOpen: peopleIsOpen,
            onOpen: peopleOnOpen,
            onOpenChange: peopleOnOpenChange,
        } = useDisclosure(); 

    const {
        isOpen: imagesIsOpen,
        onOpen: imagesOnOpen,
        onOpenChange: imagesOnOpenChange,
    } = useDisclosure();
    const {
        isOpen: editIsOpen,
        onOpen: editOnOpen,
        onOpenChange: editOnOpenChange,
    } = useDisclosure();

    return (
        <>
            <div className='flex flex-col justify-center items-center relative'>
                <h1 className="text-xl font-bold text-foreground-900 mb-2">
                    Workshops
                </h1>
                <h3 className="text-l text-foreground-900 mb-4">
                    View, edit, and create workshops.
                </h3>
                <Button
                    color="primary"
                    isDisabled={isLoading}
                    startContent={<PlusIcon className="size-6" />}
                    onPress={() => {
                        
                    }}
                    className="relative lg:absolute top-0 right-0 mb-4"
                >
                    Create
                </Button>
            </div>
        {   workshops.length > 0 ?
            <div>
                <MAKETable 
                  content={workshops}  
                  columns={columns}
                  visibleColumns={visibleColumns}
                  multiSelect={false}
                  isLoading={isLoading}
                  customColumnComponents={{
                    "title": (workshop) => {
                        return (
                            <div>
                                <h2 className='font-bold text-color[#403c38]'>{workshop.title}</h2>
                            </div>
                        )
                    },
                    "description": (workshop) => {
                        return (
                            <div className='min-w-[15vw]'>
                                {workshop.description ?
                                    <p>{workshop.description}</p>
                                    : <p>Come join the Makerspace for a fun workshop!</p>
                                }
                            </div>
                        )
                    },
                    "instructors": (workshop) => {
                        return (
                            <div className='flex flex-col gap-2 my-2'>
                                {
                                   workshop.instructors.map((instructor) => {
                                        return <MAKEUser size='sm' user_uuid={instructor} />
                                    })
                                }
                                { workshop.support_instructors &&
                                 (
                                    <>
                                        {workshop.support_instructors.map((instructor) => {
                                            return <MAKEUser size='sm' user_uuid={instructor}/> 
                                        })}
                                    </>
                                   
                                )
                                }
                            </div>
                        )
                    },
                    "ws_time": (workshop) => {
                        return (
                            <div className='flex flex-col min-w-[6vw]'>
                                <h2 className=' text-center'>{new Date(workshop.timestamp_start * 1000).toLocaleDateString()},</h2>
                                <h2 className='text-sm'>{new Date(workshop.timestamp_start * 1000).toLocaleTimeString()} - {new Date(workshop.timestamp_end * 1000).toLocaleTimeString()}</h2>
                            </div>
                        )
                    },
                    "timestamp_public": (workshop) => {
                        return (
                            <>
                            
                            { workshop.timestamp_public > Date.now() / 1000 ?
                                <div className='min-w-[6vw]'>
                                    <h2 className='text-center'>{convertTimestampToDate(workshop.timestamp_public)}</h2>
                                </div> : 
                                <div className='flex justify-center'>

                                <Button 
                                isIconOnly 
                                color='success'
                                radius='full'
                                startContent={
                                  <CheckIcon className="size-6" />
                                  }
                              ></Button>
                              </div>
                            }
                        </>
                        )
                    },
                    "capacity": (workshop) => {
                        return (
                            <div className='flex flex-col gap-2'>
                                {   
                                workshop.capacity ?
                                <p>{workshop.capacity}</p> :
                                <p>No Capacity</p>
                                }
                            </div>
                        )
                    },
                    "required_certifications": (workshop) => {
                        return (
                            <div className='flex flex-col gap-2'>
                                {   
                                (workshop.required_certifications && workshop.required_certifications.length > 0) ?
                                workshop.required_certifications.map((certification) => {
                                    return <p>{certification}</p> 
                                }) :
                                <p>No Certs</p>
                                }
                            </div>
                        )
                    },
                    "signups": (workshop) => {
                        return (
                            <>
                                <Button 
                                  isIconOnly 
                                  className='bg-default-300'
                                  startContent={
                                    <UserIcon className="size-6" />
                                    }
                                   onPress={() => {
                                        setSelectedWorkshop(workshop);
                                        peopleOnOpen();
                                    }}
                                />
                            </>
                        )
                    },
                    "photos": (workshop) => {
                        return (
                            <>
                                <Button 
                                  isIconOnly 
                                  className='bg-default-300'
                                  startContent={
                                    <PhotoIcon className="size-6" />
                                    }
                                    onPress={() => {
                                        setSelectedWorkshop(workshop);
                                        imagesOnOpen();
                                    }}
                                ></Button>
                            </>
                        )
                    },
                    // "authorized_roles": (workshop) => {
                    //     return (
                    //         <div>
                    //             {
                    //                 workshop.authorized_roles ?

                    //                 workshop.authorized_roles.map((roleUUID) => {
                    //                     return <UserRole 
                    //                     role_uuid={workshop.authorized_roles}
                    //                   />
                    //                 })

                    //             }
                                
                    //         </div>
                    //     )
                    // },
                    "edit": (workshop) => {
                        return (
                            <>
                                <Button 
                                    isIconOnly 
                                    color="primary"
                                    startContent={
                                    <PencilSquareIcon className="size-6" />
                                    }
                                    onPress={() => {
                                        setSelectedWorkshop(workshop);
                                        editOnOpen();
                                    }}
                                ></Button>
                            </>
                        )
                    },
                    "delete": (workshop) => {
                        return (
                            <>
                                <Button 
                                    isIconOnly 
                                    color="danger"
                                    startContent={
                                    <TrashIcon className="size-6" />
                                    }
                                    onPress={() => {
                                        setSelectedWorkshop(workshop);

                                    }}
                                ></Button>
                            </>
                        )
                    }
                  }}
                /> 

                <WorkshopPeopleModal 
                    workshop={selectedWorkshop}
                    isOpen={peopleIsOpen}
                    onOpenChange={peopleOnOpenChange}
                />
                <WorkshopImagesModal 
                    workshop={selectedWorkshop}
                    isOpen={imagesIsOpen}
                    onOpenChange={imagesOnOpenChange}
                />
                <WorkshopEditModal 
                    workshop={selectedWorkshop}
                    isNew={isNew}
                    isOpen={editIsOpen}
                    onOpenChange={editOnOpenChange}
                />
            </div>
            
        : <p>No Workshops Found</p>}            
        </>
    )
}