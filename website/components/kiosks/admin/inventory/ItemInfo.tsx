import clsx from "clsx";
import {
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Tooltip,
    Link as HeroLink,
} from "@heroui/react";
import { TInventoryItem } from "../../../../../common/inventory";
import ItemRoleIcon from "./ItemRoleIcon";
import ItemLocationChip from "./ItemLocationChip";
import { TArea } from "common/area";
import CertificationTag from "../certifications/CertificationTag";
import { TCertification } from "common/certification";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { mergeRequiredCerts } from "../../../../utils";

export default function ItemInfo({
    item_data,
    inventory,
    areas,
    certs,
    quantity,
}: {
    item_data?: TInventoryItem;
    inventory: TInventoryItem[];
    areas: TArea[];
    certs: TCertification[];
    quantity?: number;
}) {
    const parent_kit = inventory.find(k => k.uuid == item_data?.parent_kit);
    const mergedReqCerts = mergeRequiredCerts(item_data?.required_certifications, parent_kit?.required_certifications);

    return (
        <div>
            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button>
                        {quantity && quantity > 1 ? (
                            <>
                                {quantity}
                                <XMarkIcon className="size-4" />
                            </>
                        ) : null}
                        <h1>{item_data ? item_data.name : "Unknown Item"}</h1>
                    </Button>
                </PopoverTrigger>
                {item_data && (
                    <PopoverContent className="p-2 xl:min-w-[25vw] xl:max-w-[30vw]">
                        <div className="flex flex-col gap-2 bg-default-100 p-2 w-full">
                            <div
                                className={clsx(
                                    "bg-default-200 p-2 h-fit w-full",
                                    "rounded-md text-center whitespace-nowrap",
                                    "overflow-x-auto text-default-700",
                                )}
                            >
                                {item_data.name || "Item"}
                            </div>

                            <div className="flex flex-row gap-2 justify-evenly items-center">
                                <Tooltip
                                    content={item_data.role || "Unknown Role"}
                                    placement="bottom"
                                    color="primary"
                                    classNames={{
                                        content: "capitalize",
                                    }}
                                >
                                    <div
                                        className={clsx(
                                            "bg-default-200 p-2 h-fit w-full",
                                            "rounded-md flex justify-center",
                                            "whitespace-nowrap overflow-x-auto",
                                            "text-default-700",
                                        )}
                                    >
                                        <ItemRoleIcon role={item_data.role} />
                                    </div>
                                </Tooltip>

                                <div className="flex-row gap-1 min-w-max flex-wrap">
                                    {parent_kit ? (
                                        parent_kit.locations.map((location, index) => (
                                            <div className="pb-1">
                                                <ItemLocationChip
                                                    key={`${item_data.uuid}-location-${index}`}
                                                    location={{
                                                        area: location.area,
                                                        specific: `In ${parent_kit?.name}`,
                                                        container: ""
                                                    }}
                                                    areas={areas}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        item_data.locations.map((location, index) => (
                                            <div className="pb-1">
                                                <ItemLocationChip
                                                    key={`${location.area}-${index}`}
                                                    location={location}
                                                    areas={areas}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div
                                className={`bg-default-200 p-2 h-fit w-full rounded-md flex justify-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {mergedReqCerts.length ==
                                    0 ? (
                                    <div>No Required Certifications</div>
                                ) : (
                                    <div className="flex flex-row flex-wrap gap-1 overflow-auto max-w-1/2 items-center justify-center">
                                        {mergedReqCerts?.map(
                                            (c) => (
                                                <CertificationTag
                                                    key={c.certification_uuid}
                                                    cert_uuid={
                                                        c.certification_uuid
                                                    }
                                                    certifications={certs}
                                                    level={c.required_level}
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                            <div
                                className={`bg-primary p-2 h-fit w-full rounded-md text-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {item_data.reorder_url ? (
                                    <HeroLink
                                        isExternal
                                        showAnchorIcon
                                        as={Link}
                                        to={item_data.reorder_url}
                                        className="text-primary-foreground text-sm"
                                    >
                                        Reorder Link
                                    </HeroLink>
                                ) : (
                                    "No Reorder Link"
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                )}
            </Popover>
        </div>
    );
}
