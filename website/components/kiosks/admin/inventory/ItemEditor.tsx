import {
    TInventoryItem,
    ITEM_ROLE,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import { Form, Input, Selection } from "@heroui/react";
import React from "react";
import ItemEditorForm from "./ItemEditorForm";
import { TCertification } from "common/certification";
import { TUserRole } from "common/user";
import clsx from "clsx";

export default function ItemEditor({
    item,
    certs,
    roles,
    isNew,
    isDisabled,
}: {
    item: TInventoryItem;
    certs: TCertification[];
    roles: TUserRole[];
    isNew: boolean;
    isDisabled: boolean;
}) {
    const isEmpty = item.uuid != "";

    return (
        <div
            className={clsx(
                "flex flex-col rounded-xl bg-content1 p-4",
                "h-1/3 lg:h-full",
                "w-full lg:w-2/3 xl:w-1/2 2xl:w-1/3",
            )}
        >
            <h1 className="3xl font-bold text-center pb-2">Item Editor</h1>
            <ItemEditorForm
                key={item.uuid}
                item={item}
                certs={certs}
                roles={roles}
                isMultiple={false}
                isDisabled={isDisabled}
                isNew={isNew}
            />
        </div>
    );
}
