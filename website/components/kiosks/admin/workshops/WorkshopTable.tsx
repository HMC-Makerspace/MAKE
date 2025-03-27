import React from 'react';
import { 
    Selection,
    Button,
    User
} from '@heroui/react';
import {
    PhotoIcon,
    UserIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import { TWorkshop } from 'common/workshop';
import MAKETable from '../../../Table.tsx';
import  { MAKEUser } from '../../../user/User.tsx';
import { convertTimestampToDate } from '../../../../utils.tsx';
import ImageCarousel from '../../../ImageCarousel.tsx';
import { FILE_RESOURCE_TYPE } from '../../../../../common/file.ts';


const columns = [
    {name: 'Title', id: 'title'},
    {name: 'Description', id:'description'},
    {name: 'Instructors + Support', id:'instructors'},
    {name: 'Time', id:'ws_time'},
    {name: 'Capacity', id:'capacity'},
    {name: 'Certifications', id:'required_certifications'},
    // {name: 'RSVP List', id:'rsvp_list'},
    // {name: 'Sign-In List', id:'sign_in_list'},
    {name: 'People', id:'signups'},
    {name: 'Photos', id:'photos'},
    {name: 'Authorized Roles', id:'authorized_roles'},
    {name: 'Edit', id:'edit'}
]
const defaultColumns = [
    'title',
    'description',
    'instructors',
    'ws_time',
    'capacity',
    'signups',
    'required_certifications',
    // 'rsvp_list',
    // 'sign_in_list',
    'photos',
    'authorized_roles',
    'edit'
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
    console.log(workshops)
    return (
        <>
            <div className='flex flex-col justify-center items-center'>
                <h1 className="text-xl font-bold text-foreground-900 mb-2">
                    Workshops
                </h1>
                <h3 className="text-l text-foreground-900 mb-4">
                    View, edit, and create workshops.
                </h3>
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
                                <h2 className='font-bold text-[#faf8f7]'>{workshop.title}</h2>
                            </div>
                        )
                    },
                    "description": (workshop) => {
                        return (
                            <div className='min-w-[15vw]'>
                                <p>{workshop.description}</p>
                            </div>
                        )
                    },
                    "instructors": (workshop) => {
                        return (
                            <div className='flex flex-col gap-2'>
                                {
                                   workshop.instructors.map((instructor) => {
                                        return <MAKEUser size='sm' user_uuid={instructor} />
                                    })
                                }
                                { workshop.support_instructors &&
                                 (
                                    <>
                                        {workshop.support_instructors.map((instructor) => {
                                            return <MAKEUser size='sm' user_uuid={instructor} />
                                        })}
                                    </>
                                   
                                )
                                }
                            </div>
                        )
                    },
                    // "support_instructors": (workshop) => {
                    //     return (
                    //         <div className='flex flex-col gap-2'>
                    //             { workshop.support_instructors &&
                    //                workshop.support_instructors.map((instructor) => {
                    //                     return <MAKEUser size='sm' user_uuid={instructor} />
                    //                 })
                    //             }
                    //         </div>
                    //     )
                    // },
                    "ws_time": (workshop) => {
                        return (
                            <div>
                                <h2>{convertTimestampToDate(workshop.timestamp_start)} - {new Date(workshop.timestamp_end * 1000).toLocaleTimeString()}</h2>
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
                                ></Button>
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
                                ></Button>
                            </>
                        )
                    },
                    "edit": (workshop) => {
                        return (
                            <>
                                <Button 
                                    isIconOnly 
                                    color="primary"
                                    startContent={
                                    <PencilSquareIcon className="size-6" />
                                    }
                                ></Button>
                            </>
                        )
                        
                    }
                  }}
                />
            </div>
        : null}            
        </>
    )
}