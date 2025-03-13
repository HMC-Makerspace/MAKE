import React from 'react';
import { TWorkshop } from 'common/workshop';
import WorkshopCard from './WorkshopCard';

export default function WorkshopTable({
    workshops
} : {
    workshops: TWorkshop[]
}) {
    console.log(workshops)
    return (
        <>
            <div className='flex flex-col justify-center items-center'>
                <h1 className="text-xl font-bold text-foreground-900 mb-2">
                    Workshops
                </h1>
                <h3 className="text-l text-foreground-900 mb-4">
                    View, edit, and create restock workshops.
                </h3>
            </div>
        {   workshops.length > 0 ?
            <WorkshopCard workshop={workshops[0]}/>
        : null}            
        </>
    )
}