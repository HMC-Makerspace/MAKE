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
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";

export default function ItemInfo({
    item_data,
    areas,
    certs,
    quantity,
    className = "",
}: {
    item_data?: TInventoryItem;
    areas: TArea[];
    certs: TCertification[];
    quantity?: number;
    className?: string;
}) {
    return (
        <div>
            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button className={className}>
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
                                <div
                                    className={clsx(
                                        "bg-default-200 p-2 h-fit w-full",
                                        "rounded-md flex justify-center",
                                        "whitespace-nowrap overflow-x-auto",
                                        "text-default-700 capitalize gap-2",
                                        "items-center"
                                    )}
                                >
                                    {item_data.role || "Unknown Role"}
                                    <ItemRoleIcon role={item_data.role} />
                                </div>

                                <div className="flex-row gap-1 min-w-max flex-wrap empty:-ml-2">
                                    {item_data.locations.map(
                                        (location, index) => (
                                            <div className="pb-1">
                                                <ItemLocationChip
                                                    key={`${location.area}-${index}`}
                                                    location={location}
                                                    areas={areas}
                                                />
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            <div
                                className={`bg-default-200 p-2 h-fit w-full rounded-md flex justify-center whitespace-nowrap, overflow-x-auto ${item_data ? "text-default-700" : "text-default-400"}`}
                            >
                                {item_data.required_certifications &&
                                item_data.required_certifications.length ==
                                    0 ? (
                                    <div>No Required Certifications</div>
                                ) : (
                                    <div className="flex flex-row flex-wrap gap-1 overflow-auto max-w-1/2 items-center justify-center">
                                        {item_data.required_certifications?.map(
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
                            <Button
                                variant="solid"
                                color="primary"
                                as={Link}
                                isDisabled={!item_data.reorder_url}
                                // radius="none"
                                to={item_data.reorder_url || ""}
                                target="_blank"
                                className="rounded-md"
                            >
                                {item_data.reorder_url ? (
                                    <>
                                        Reorder Link
                                        <ArrowTopRightOnSquareIcon className="size-5" />
                                    </>
                                ) : (
                                    "No Reorder Link"
                                )}
                            </Button>
                        </div>
                    </PopoverContent>
                )}
            </Popover>
        </div>
    );
}
