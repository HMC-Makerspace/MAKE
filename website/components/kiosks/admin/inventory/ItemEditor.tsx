import {
    TInventoryItem,
    ITEM_ROLE,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import React from "react";
import ItemEditorForm from "./ItemEditorForm";
import { TCertification } from "common/certification";
import { TUserRole } from "common/user";
import clsx from "clsx";
import { TArea } from "common/area";

export default function ItemEditor({
    item,
    certs,
    roles,
    areas,
    isNew,
    isDisabled,
    onUpdate = () => {},
}: {
    item: TInventoryItem;
    certs: TCertification[];
    roles: TUserRole[];
    areas: TArea[];
    isNew: boolean;
    isDisabled: boolean;
    onUpdate?: (isNew: boolean) => void;
}) {
    const key = isNew ? "new" : item.uuid;

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
                key={key}
                item={item}
                certs={certs}
                roles={roles}
                areas={areas}
                isMultiple={false}
                isDisabled={isDisabled}
                isNew={isNew}
                onUpdate={onUpdate}
            />
        </div>
    );
}
