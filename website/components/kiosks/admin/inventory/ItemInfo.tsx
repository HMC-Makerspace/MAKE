import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { AxiosError } from "axios";
import clsx from "clsx";
import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Tooltip,
    Link,
} from "@heroui/react";
import { TInventoryItem, InventoryItemUUID, ITEM_RELATIVE_QUANTITY } from "../../../../../common/inventory";
import ItemRoleIcon from "./ItemRoleIcon";
import ItemLocationChip from "./ItemLocationChip";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TArea } from "common/area";
import CertificationTag from "../certifications/CertificationTag";
import { TCertification } from "common/certification";
import { set } from "mongoose";

export default function ItemInfo({
    item_uuid,
    inventory,
    areas,
    certs,
}: {
    item_uuid: InventoryItemUUID;
    inventory: TInventoryItem[];
    areas: TArea[];
    certs: TCertification[];
}) {

    const [item_data, setItemData] = useState<TInventoryItem | undefined>()

    useEffect(() => {
        setItemData(inventory.find((item) => item.uuid === item_uuid));
    }, [item_uuid, inventory])
    
    console.log("iteminfo", inventory, item_uuid, areas, certs, item_data)

    return (
        
        <div>
            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button >
                        <h1>{item_data ? item_data.name : "Unknown Item"}</h1>
                    </Button>
                </PopoverTrigger>
                {item_data &&
                    <PopoverContent className="p-2 xl:min-w-[25vw] xl:max-w-[30vw]">
                        <div className='flex flex-col gap-2 bg-default-100 p-2 w-full'>
                            <div
                                className={`bg-default-200 p-2 h-fit w-full rounded-md text-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {item_data?.name || (item_data ? "Unknown Item" : "Item")}
                            </div>
                            
                            <div className='flex flex-row gap-2 justify-evenly items-center'>

                                {
                                    item_data ? 
                                        <Tooltip
                                            content={item_data.role}
                                            placement="bottom"
                                            color="primary"
                                            classNames={{
                                                content: "capitalize",
                                            }}
                                        >
                                            <div
                                                className={`bg-default-200 p-2 h-fit w-full rounded-md flex justify-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                                            >
                                                <ItemRoleIcon role={item_data.role} />
                                            </div>
                                        </Tooltip>
                                    :
                                        <div 
                                            className={clsx(
                                                "bg-default-300 text-md text-default-400",
                                                "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                                "sm:min-w-16",
                                            )}
                                        >
                                            Unknown Type
                                        </div>
                                }

                                {
                                    item_data && 
                                        <div className="flex-row gap-1 min-w-max flex-wrap">
                                            {item_data.locations.map((location, index) => (
                                                <div className='pb-1'>
                                                    <ItemLocationChip
                                                        key={`${location.area}-${index}`}
                                                        location={location}
                                                        areas={areas}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    
                                }
                            </div>

                            <div
                                className={`bg-default-200 p-2 h-fit w-full rounded-md flex justify-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {
                                    item_data ? 
                                        item_data.required_certifications && item_data.required_certifications.length == 0 ?
                                            <div>
                                                No Required Certifications
                                            </div> 
                                        :
                                            <div className="flex flex-row flex-wrap gap-1 overflow-auto max-w-1/2 items-center justify-center">
                                            {item_data.required_certifications?.map((c) => (
                                                <CertificationTag
                                                    key={c.certification_uuid}
                                                    cert_uuid={c.certification_uuid}
                                                    certifications={certs}
                                                    level={c.required_level}
                                                />
                                            ))}
                                        </div> 
                                    :
                                    <div>
                                        Unknown Certifications
                                    </div>
                                }
                            </div>
                            <div
                                className={`bg-primary p-2 h-fit w-full rounded-md text-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {item_data.reorder_url ? 
                                    <Link
                                        isExternal 
                                        showAnchorIcon 
                                        href={item_data.reorder_url}
                                        className='text-primary-foreground text-sm'
                                    >
                                        Reorder Link
                                    </Link>
                                    :
                                    "No Reorder Link"
                                 }
                            </div>
                        </div>
                    </PopoverContent>
                }
            </Popover>
            
            
        </div>
    );
}

