import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { AxiosError } from "axios";
import clsx from "clsx";
import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Tooltip,
} from "@heroui/react";
import { TInventoryItem, InventoryItemUUID, ITEM_RELATIVE_QUANTITY } from "../../../../../common/inventory";
import ItemRoleIcon from "./ItemRoleIcon";
import ItemLocationChip from "./ItemLocationChip";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TArea } from "common/area";
import CertificationTag from "../certifications/CertificationTag";
import { TCertification } from "common/certification";

export default function ItemInfo({
    item_uuid,
    areas,
    certs,
}: {
    item_uuid: InventoryItemUUID;
    areas: TArea[];
    certs: TCertification[];
}) {

    const {data: item_data} = useQuery<TInventoryItem, AxiosError>({
        queryKey: ["inventory", item_uuid],
        enabled: !!item_uuid,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    return (
        
        <div>
            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button>
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
                        {/* <div className='flex flex-row gap-2'>
                            <div className={`cursor:default bg-default-200 p-2 h-fit w-full rounded-md text-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}>
                                <Input
                                    isDisabled
                                    placeholder={item_data?.uuid || (item_data ? "Unknown UUID" : "UUID")}
                                    className='bg-default-200 p-0 h-fit w-fit '
                                />
                            </div>
                            
                            <Button
                                isIconOnly
                                onPress={() => {
                                        // Copy the UUID to the clipboard
                                        navigator.clipboard.writeText(
                                            item_data ?
                                            item_data.uuid :
                                            ''
                                        );
                                }}
                            >
                                <ClipboardIcon className="size-6 text-primary-300" />
                            </Button>
                        </div> */}
                        
                        <div className='flex flex-row gap-2 justify-evenly'>
                            
                            { item_data ? 
                                (item_data.quantity === ITEM_RELATIVE_QUANTITY.HIGH) ? 
                                    (
                                        <div
                                            className={clsx(
                                                "bg-success-200 text-md text-success-foreground",
                                                "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                                "sm:min-w-16",
                                            )}
                                        >
                                            High
                                        </div>
                                    ) :
                                    (item_data.quantity === ITEM_RELATIVE_QUANTITY.LOW) ? 
                                        (
                                            <div
                                                className={clsx(
                                                    "bg-danger-300 text-md text-danger-foreground",
                                                    "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                                    "sm:min-w-16",
                                                )}
                                            >
                                                Low
                                            </div>
                                        ) :
                                        (
                                            <div
                                                className={clsx(
                                                    "bg-default-200 text-md text-default-foreground",
                                                    "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                                    "sm:min-w-16",
                                                )}
                                            >
                                                {item_data.available}
                                                {" / "}
                                                {item_data.quantity}
                                            </div>
                                        )
                                : <div 
                                    className={clsx(
                                        "bg-default-300 text-md text-default-400",
                                        "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                        "sm:min-w-16",
                                    )}
                                >
                                    Unknown Quantity
                                </div>                
                            }

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
                                item_data ? 
                                    <div className="flex flex-col gap-2 min-w-max">
                                        {item_data.locations.map((location, index) => (
                                            <ItemLocationChip
                                                key={`${location.area}-${index}`}
                                                location={location}
                                                areas={areas}
                                            />
                                        ))}
                                    </div>
                                :
                                <div 
                                    className={clsx(
                                        "bg-default-300 text-md text-default-400",
                                        "p-2 sm:px-4 rounded-lg min-w-12 w-fit text-center",
                                        "sm:min-w-16",
                                    )}
                                >
                                    Unknown Area
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
                                        <div className="flex flex-col gap-1 overflow-auto max-w-1/2">
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

                    </div>
                    
                </PopoverContent>}
            </Popover>
            
            
        </div>
    );
}

