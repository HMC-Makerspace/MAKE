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
import { motion } from "motion/react";

export default function ItemEditor({
    item,
    certs,
    roles,
    areas,
    items,
    isNew,
    isDisabled,
    onUpdate = () => {},
    setSelectedItem,
}: {
    item: TInventoryItem;
    certs: TCertification[];
    roles: TUserRole[];
    areas: TArea[];
    items: TInventoryItem[];
    isNew: boolean;
    isDisabled: boolean;
    onUpdate?: (isNew: boolean) => void;
    setSelectedItem: (s: Set<string>) => void;
}) {
    const key = isNew ? "new" : item.uuid;

    return (
        <div
            className={clsx(
                "flex flex-col rounded-xl bg-content1 p-4",
                "h-1/3 lg:h-full relative",
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
                items={items}
                isMultiple={false}
                isDisabled={isDisabled}
                isNew={isNew}
                onUpdate={onUpdate}
                setSelectedItem={setSelectedItem}
            />
            <motion.div
                initial={{
                    opacity:
                        item.role === ITEM_ROLE.MACHINE ||
                        item.role === ITEM_ROLE.AREA
                            ? 100
                            : 0,
                }}
                animate={{
                    opacity:
                        item.role === ITEM_ROLE.MACHINE ||
                        item.role === ITEM_ROLE.AREA
                            ? 100
                            : 0,
                }}
                className={clsx(
                    "absolute w-fit p-4 h-fit bg-primary-200/20 m-auto",
                    "top-0 bottom-0 left-0 right-0 rounded-xl flex gap-1",
                    "items-center justify-center font-semibold",
                    "text-default-foreground pointer-events-none",
                )}
            >
                Edit this item in its associated kiosk
            </motion.div>
        </div>
    );
}
