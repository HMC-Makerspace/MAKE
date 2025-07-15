import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Button, Card, Input } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import { getForegroundColor } from "../../../../utils";

// A certification tag similar (but with less rounded edges) to user role tags (see UserRole)
export default function ItemCertTag({
    cert_uuid,
    req_level,
    on_level_change,
}: {
    cert_uuid: string;
    req_level: number;
    on_level_change: (val: number) => void;
}) {
    const { data, isSuccess, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
    });

    // Default to gray if not yet successful
    const color = isSuccess ? data.color : "gray";
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isSuccess
    const title = isSuccess ? `${data.name}` : isError ? "Error" : "Loading";
    const foregroundColor = getForegroundColor(color);

    var a = req_level;

    return (
        <Card
            className="p-1.5 flex flex-row gap-1 w-fit px-2.5 rounded-sm"
            style={{ backgroundColor: color }}
            isBlurred={!isSuccess}
        >
            <h1
                className="text-sm font-semibold text-nowrap"
                style={{
                    color: foregroundColor,
                }}
            >
                {title}
                {/* {a} */}
                {/* <Input
                    type="text"
                    className="text-sm font-semibold text-nowrap"
                style={{
                    // backgroundColor: color,
                    // color: foregroundColor,
                }}

                >
                
                </Input> */}
            </h1>

            <div className="flex flex-col">
                <Button
                    className="h-50 rounded-sm"
                    isIconOnly
                    // onPress={()=>on_level_change(++a)}
                >
                    <ChevronUpIcon className="size-3" />
                </Button>

                <Button
                    className="h-50 rounded-sm"
                    isIconOnly
                    //onPress={()=>on_level_change(--a)}
                >
                    <ChevronDownIcon className="size-3" />
                </Button>
            </div>
        </Card>
    );
}