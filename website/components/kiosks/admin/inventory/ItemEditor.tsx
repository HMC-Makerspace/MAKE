import { TInventoryItem, ITEM_ROLE, ITEM_ACCESS_TYPE } from "../../../../../common/inventory";
import { Form, Input, Selection } from "@heroui/react";
import React from "react";
import ItemEditorForm from "./ItemEditorForm";

export default function ItemEditor({
    item,
    isNew,
    isLoading,
}: {
    item: TInventoryItem;
    isNew: boolean;
    isLoading: boolean;
}) {
    const isEmpty = item.uuid != "";

    return (
        <div className="flex flex-col h-full w-full lg:w-2/5 rounded-xl bg-content1 p-4">
            <h1 className="3xl font-bold text-center pb-2">Item Editor</h1>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <ItemEditorForm
                    item={
                        {
                            uuid: "",
                            name: "",
                            role: ITEM_ROLE.TOOL,
                            access_type: ITEM_ACCESS_TYPE.USE_IN_SPACE,
                            locations: [],
                        }
                    }
                />
            )}
        </div>
    );
}

