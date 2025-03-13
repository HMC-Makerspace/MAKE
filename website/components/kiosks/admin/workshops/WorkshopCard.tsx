import React from 'react';
import {
    Card,
    CardHeader,
    CardBody, 
    CardFooter,
    Divider
} from '@heroui/react';
import { convertTimestampToDate } from '../restock/RestockStatusLogs';
import { TWorkshop } from 'common/workshop';
import { MAKEUser } from '../../../user/User';
import ImageCarousel from '../../../ImageCarousel';
import { FILE_RESOURCE_TYPE } from '../../../../../common/file';


export default function WorkshopCard({
    workshop
} : {
    workshop: TWorkshop
}) {
    return (
        <>
            <Card className='p-4'>
                <CardHeader>
                    <div className='flex flex-col gap-4'>
                    <div>
                        <h1 className="text-xl font-bold text-foreground-900">{workshop.title ?? "No Workshop Title Available"}</h1>
                        <h2 className="mb-2">{convertTimestampToDate(workshop.timestamp_start)} - {convertTimestampToDate(workshop.timestamp_end)}</h2>
                    </div>
                    <div className="flex flex-row gap-4">
                        <h2>Instructors:</h2>
                        {workshop.instructors.map((instructor) => (
                            <MAKEUser user_uuid={instructor}/>
                        ))}
                    </div>
                    {workshop.support_instructors ? 
                    <div className="flex flex-row gap-4">
                        <h2>Support Instructors:</h2>
                        {workshop.support_instructors.map((instructor) => (
                            <MAKEUser user_uuid={instructor}/>
                        ))}
                    </div> : null
                    }
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className='flex flex-row gap-4'>
                    <p>{workshop.description}</p>
                    <ImageCarousel uuid={workshop.uuid} fileType={FILE_RESOURCE_TYPE.WORKSHOP} editable={true}/>
                    </div>
                    
                </CardBody>
            </Card>     
        </>
    )
}