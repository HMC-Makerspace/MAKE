import {
    Button,
    Checkbox,
    Divider,
    Form,
    Input,
    NumberInput,
    Snippet,
    Textarea,
    Tooltip,
} from "@heroui/react";
import { Select, SelectSection, SelectItem } from "@heroui/select";
import { Accordion, AccordionItem } from "@heroui/accordion";
import clsx from "clsx";
import {
    InventoryItemUUID,
    ItemQuantity,
    TInventoryItemLocation,
    TInventoryItem,
    ITEM_ROLE,
    ITEM_ACCESS_TYPE,
    ITEM_RELATIVE_QUANTITY,
} from "../../../../../common/inventory";
import React, { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TCertification } from "common/certification";
import { BookmarkIcon, UserIcon, GlobeAltIcon, TrashIcon } from "@heroicons/react/24/outline";
import { TUserRole } from "common/user";
import ItemRoleIcon from "./ItemRoleIcon";
import RequiredCertsModal from "../certifications/RequiredCertsModal";
import AuthorizedRolesModal from "../certifications/AuthorizedRolesModal";
import { motion } from "framer-motion";
import ItemQuantityIcon from "./ItemQuantityIcon";
import ItemLocationModal from "./ItemLocationModal";
import { TArea } from "common/area";

// export
const roles = [
    { key: "MATERIAL", label: "Material" },
    { key: "TOOL", label: "Tool" },
    { key: "KIT", label: "Kit" },
];

// export
const accessTypes = [
    { key: 0, label: "Use in Space" },
    { key: 1, label: "Checkout in Space" },
    { key: 2, label: "Checkout and Take Home" },
    { key: 3, label: "Take Home" },
];

// Define the mutation function that will run when the form is submitted
const createUpdateItem = async ({
    data,
    isNew,
}: {
    data: TInventoryItem;
    isNew: boolean;
}) => {
    if (isNew) {
        return (
            await axios.post<TInventoryItem>("/api/v3/inventory", {
                item_obj: data,
            })
        ).data;
    } else {
        return (
            await axios.put<TInventoryItem>(`/api/v3/inventory`, {
                item_obj: data,
            })
        ).data;
    }
};

const patchItem = async ({
    uuid,
    patch,
}: {
    uuid: InventoryItemUUID;
    patch: Partial<TInventoryItem>;
}) => {
    return (
        await axios.patch<TInventoryItem>(`/api/v3/inventory/${uuid}`, {
            partial_item_obj: patch,
        })
    ).data;
};

const deleteItem = async ({
    item_uuid
}: {
    item_uuid: string
}) => {
    return (await axios.delete(`/api/v3/inventory/${item_uuid}`)).data
}

export default function ItemEditorForm({
    item,
    certs,
    roles,
    areas,
    isMultiple,
    isDisabled,
    isNew,
    onSuccess,
    onError,
}: {
    item: TInventoryItem;
    certs: TCertification[];
    roles: TUserRole[];
    areas: TArea[];
    isMultiple: boolean;
    isDisabled: boolean;
    isNew: boolean;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {

    const [UUID, setUUID] = React.useState<string>(
        isNew ? crypto.randomUUID() : item.uuid,
    );

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUpdateItem,
        onSuccess: (result: TInventoryItem) => {
            queryClient.setQueryData(["inventory", UUID], result);
            queryClient.setQueryData(["inventory"], (old: TInventoryItem[]) => {
                if (isNew) {
                    return [...old, result];
                } else {
                    return old.map((i) => (i.uuid === UUID ? result : i));
                }
            });
            onSuccess(
                `Successfully ${isNew ? "created" : "updated"} item${isMultiple ? "s" : ""}`,
            );
            setHasEdits(false);
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteItem,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["inventory"], (old: TInventoryItem[]) =>
                old.filter((i) => i.uuid !== variables.item_uuid),
            );
            onSuccess(`Successfully deleted item`);
            setHasEdits(false);
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            console.log("submitting form");

            // If something is wrong, don't submit.
            if (isDisabled) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);
            
            let quantity = parseInt(data.get("quantity") as string);
            let available = item.available;
            
            if (Math.abs(quantity)/quantity != Math.abs(item.quantity)/item.quantity) { // quantity type change
                available = quantity;
            }

            const new_item: TInventoryItem = {
                uuid: UUID,
                name: data.get("name") as string,
                long_name: data.get("long_name") as string,
                role: data.get("role") as ITEM_ROLE,
                access_type: parseInt(
                    data.get("access_type") as string,
                ) as ITEM_ACCESS_TYPE,
                locations: item.locations,
                reorder_url: data.get("reorder_url") as string,
                serial_number: data.get("serial_number") as string,
                keywords:
                    (data.get("keywords") as string)
                        ?.split(",")
                        .map((i) => i.trim()) ?? [],
                required_certifications: item.required_certifications,
                authorized_roles: item.authorized_roles,
                quantity: quantity,
                available: available
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_item, isNew: isNew });
        },
        [isDisabled, item, UUID],
    );

    const placeholder = (text: string) => (item.uuid || isNew ? text : `Select an item`);

    const [hasEdits, setHasEdits] = useState(false);

    // A function that wraps a setter to also update the hasEdits state
    // const wrapEdit = (fn: (arg0: any) => void) => {
    //     return (value: any) => {
    //         fn(value);
    //         setHasEdits(true);
    //     };
    // };

    const defaultEdit = () => setHasEdits(true);

    const patchMutation = function(successExtras: () => void) {
        return useMutation({
            mutationFn: patchItem,
            onSuccess: (obj: TInventoryItem) => {
                queryClient.setQueryData(["inventory", obj.uuid], obj);
                queryClient.setQueryData(
                    ["inventory"],
                    (old: TInventoryItem[]) => {
                        return old.map((i) =>
                            i.uuid === obj.uuid ? obj : i,
                        );
                    },
                );

                successExtras();
            },
            onError: (error) => {
                alert(`Error: ${error.message}`);
            },
        });
    }

    const [reqcertsOpen, setReqcertsOpen] = React.useState<boolean>(false); // whether reqcerts edit modal is open
    const [authrolesOpen, setAuthrolesOpen] = React.useState<boolean>(false); // whether authroles edit modal is open
    const [locationEditorOpen, setLocationEditorOpen] = React.useState<boolean>(false); // whether location editor modal is open

    const reqcertsMutation = patchMutation(() => setReqcertsOpen(false));
    const authrolesMutation = patchMutation(() => setAuthrolesOpen(false));
    const locationEditorMutation = patchMutation(() => setLocationEditorOpen(false));

    const [qtype, setQtype] = React.useState<boolean>(item.quantity >= 0); // type of quantity (true: numerical, false: categorical)
    
    return (
        <>
            <Form
                onSubmit={onSubmit}
                className="overflow-auto h-full justify-between gap-4"
            >
                <Snippet
                    // Allow user uuid to be copied
                    variant="bordered"
                    color="default"
                    symbol={""}
                    size="md"
                    className="w-full text-default-500 relative h-14"
                    timeout={1000}
                    classNames={{
                        copyButton:
                            "absolute right-2 bg-default-200 hover:!bg-default-300",
                    }}
                >
                    {UUID}
                </Snippet>

                <div className="w-full grid grid-cols-2 gap-4 lg:grid-cols-1 overflow-auto">
                    <Input // Name
                        type="text"
                        label="Name"
                        name="name"
                        placeholder={placeholder("Item Name")}
                        isDisabled={isDisabled}
                        isRequired
                        defaultValue={item.name}
                        onValueChange={defaultEdit}
                        variant="faded"
                        color="primary"
                        size="md"
                        classNames={{
                            input: clsx([
                                "placeholder:text-default-500",
                                "placeholder:italic",
                                "text-default-700",
                            ]),
                        }}
                    />
                    <Input // Long Name
                        type="text"
                        label="Long Name"
                        name="long_name"
                        placeholder={placeholder("Long Item Name")}
                        isDisabled={isDisabled}
                        defaultValue={item.long_name}
                        onValueChange={defaultEdit}
                        variant="faded"
                        color="primary"
                        size="md"
                        classNames={{
                            input: clsx([
                                "placeholder:text-default-500",
                                "placeholder:italic",
                                "text-default-700",
                            ]),
                        }}
                    />
                    <Select // Access Type
                        label="Access Type"
                        name="access_type"
                        placeholder={placeholder("Access Type")}
                        isDisabled={isDisabled}
                        isRequired
                        value={item.access_type?.toString()}
                        defaultSelectedKeys={
                            (isDisabled || isNew) ? [] : [item.access_type + ""]
                        }
                        onSelectionChange={defaultEdit}
                        variant="faded"
                        color="primary"
                        size="md"
                        classNames={{
                            value: clsx([
                                "placeholder:text-default-500",
                                "placeholder:italic",
                                "text-default-700",
                            ]),
                        }}
                        className="w-full"
                    >
                        {accessTypes.map((accessType) => (
                            <SelectItem key={accessType.key}>
                                {accessType.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <div className="grid grid-cols-2 w-full gap-4 col-span-full">
                        <div className="flex flex-row gap-1">
                            {qtype ? (
                                <NumberInput
                                    label="Quantity"
                                    name="quantity"
                                    placeholder={placeholder("Quantity")}
                                    isDisabled={isDisabled}
                                    isRequired
                                    defaultValue={isDisabled ? undefined : item.quantity}
                                    onValueChange={defaultEdit}
                                    minValue={0}
                                    variant="faded"
                                    color="primary"
                                    size="md"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                            ) : (
                                <Select
                                    label="Quantity"
                                    name="quantity"
                                    placeholder={placeholder("Quantity")}
                                    isDisabled={isDisabled}
                                    isRequired
                                    disallowEmptySelection
                                    defaultSelectedKeys={[(item.quantity < 0 ? item.quantity : -2) + ""]}
                                    onSelectionChange={defaultEdit}
                                    selectionMode={"single"}
                                    variant="faded"
                                    color="primary"
                                    size="md"
                                    labelPlacement="inside"
                                    classNames={{
                                        value: "text-default-500 min-h-[48px] content-center",
                                    }}
                                    renderValue={(selectedKeys) => {
                                        if (
                                            selectedKeys.length === 0 ||
                                            selectedKeys.length > 1
                                        ) {
                                            return ""; // Show placeholder
                                        } else {
                                            return (
                                                <div className="">
                                                    {selectedKeys[0].textValue}
                                                </div>
                                            );
                                        }
                                    }}
                                    showScrollIndicators={false}
                                >
                                    <SelectItem
                                        key={"-2" /*ITEM_RELATIVE_QUANTITY.HIGH*/}
                                        textValue={"High"}
                                    >
                                        <span className="flex gap-2 items-center">
                                            High
                                        </span>
                                    </SelectItem>
                                    <SelectItem
                                        key={"-1" /*ITEM_RELATIVE_QUANTITY.LOW*/}
                                        textValue={"Low"}
                                    >
                                        <span className="flex gap-2 items-center">
                                            Low
                                        </span>
                                    </SelectItem>
                                </Select>
                            )}
                            
                            <motion.div className="content-center"
                                initial={{
                                    color: isDisabled ? "hsl(var(--heroui-default-300))" : "hsl(var(--heroui-default-500))",
                                }}
                                whileHover={{
                                    color: isDisabled ? "hsl(var(--heroui-default-300))" : "hsl(var(--heroui-primary-600))",
                                }}
                                onClick={() => {
                                    if (isDisabled) return;
                                    setQtype(!qtype);
                                    defaultEdit();
                                }}
                            >
                                <ItemQuantityIcon
                                    qtype={qtype}
                                    className={`size-7 ${!isDisabled && "cursor-pointer"}`} // we don't care about the class "false" right.
                                    isDisabled={isDisabled}
                                />
                            </motion.div>
                        </div>
                        <Select
                            name="role"
                            placeholder={placeholder("Item type")}
                            defaultSelectedKeys={isDisabled ? [] : isNew ? [ITEM_ROLE.MATERIAL] : [item.role]}
                            onSelectionChange={defaultEdit}
                            isDisabled={isDisabled}
                            isRequired
                            disallowEmptySelection
                            selectionMode={"single"}
                            variant="faded"
                            color="primary"
                            label="Type"
                            labelPlacement="inside"
                            // Base classes
                            classNames={{
                                value: "text-default-500 min-h-[48px] content-center",
                            }}
                            renderValue={(selectedKeys) => {
                                if (
                                    selectedKeys.length === 0 ||
                                    selectedKeys.length > 1
                                ) {
                                    return ""; // Show placeholder
                                } else {
                                    return (
                                        <div className="">
                                            {selectedKeys[0].textValue}
                                        </div>
                                    );
                                }
                            }}
                            showScrollIndicators={false}
                        >
                            <SelectItem
                                key={ITEM_ROLE.MATERIAL}
                                textValue={"Material"}
                            >
                                <span className="flex gap-2 items-center">
                                    <ItemRoleIcon role={ITEM_ROLE.MATERIAL} />
                                    Material
                                </span>
                            </SelectItem>
                            <SelectItem key={ITEM_ROLE.TOOL} textValue={"Tool"}>
                                <span className="flex gap-2 items-center">
                                    <ItemRoleIcon role={ITEM_ROLE.TOOL} />
                                    Tool
                                </span>
                            </SelectItem>
                            <SelectItem
                                key={ITEM_ROLE.MACHINE}
                                textValue={"Machine"}
                                isReadOnly
                                className="text-default-400"
                            >
                                <span className="flex gap-2 items-center">
                                    <ItemRoleIcon role={ITEM_ROLE.MACHINE} />
                                    Machine
                                </span>
                            </SelectItem>
                            <SelectItem
                                key={ITEM_ROLE.AREA}
                                textValue={"Area"}
                                isReadOnly
                                className="text-default-400"
                            >
                                <span className="flex gap-2 items-center">
                                    <ItemRoleIcon role={ITEM_ROLE.AREA} />
                                    Area
                                </span>
                            </SelectItem>
                            <SelectItem
                                key={ITEM_ROLE.KIT}
                                textValue={"Kit"}
                                isReadOnly
                                className="text-default-400"
                            >
                                <span className="flex gap-2 items-center">
                                    <ItemRoleIcon role={ITEM_ROLE.KIT} />
                                    Kit
                                </span>
                            </SelectItem>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 w-full gap-4 col-span-full">
                        <Input
                            type="text"
                            label="Reorder URL"
                            name="reorder_url"
                            placeholder={placeholder("Reorder URL")}
                            isDisabled={isDisabled}
                            defaultValue={item.reorder_url}
                            onValueChange={defaultEdit}
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }}
                        />
                        <Input
                            type="text"
                            label="Serial Number"
                            name="serial_number"
                            placeholder={placeholder("Serial Number")}
                            isDisabled={isDisabled}
                            defaultValue={item.serial_number}
                            onValueChange={defaultEdit}
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }}
                        />
                    </div>
                    <Textarea
                        type="text"
                        label="Keywords"
                        name="keywords"
                        placeholder={placeholder("Keywords")}
                        isDisabled={isDisabled}
                        defaultValue={item.keywords?.join(", ")}
                        onValueChange={defaultEdit}
                        minRows={1}
                        variant="faded"
                        color="primary"
                        size="md"
                        classNames={{
                            input: clsx([
                                "placeholder:text-default-500",
                                "placeholder:italic",
                                "text-default-700",
                            ]),
                        }}
                    />
                    <Divider className="h-[1px] bg-default-400" />
                    <div className="flex justify-evenly">
                        <Tooltip
                            content={isNew ? "Create the item first, before editing locations." : "Locations"}
                            className="w-fit p-2"
                            delay={500}
                            closeDelay={150}
                            isDisabled={isDisabled}
                        >
                            <Button
                                variant="flat"
                                color="primary"
                                onPress={() => !isNew && setLocationEditorOpen(true)}
                                isIconOnly
                                isDisabled={isDisabled}
                                className={isNew ? "opacity-disabled" : ""}
                                data-hover={!isNew && !isDisabled}
                            >
                                <GlobeAltIcon className="size-6" />
                            </Button>
                        </Tooltip>

                        <Tooltip
                            content={isNew ? "Create the item first, before editing required certifications." : "Required Certifications"}
                            className="w-fit p-2"
                            delay={500}
                            closeDelay={150}
                            isDisabled={isDisabled}
                        >
                            <Button
                                variant="flat"
                                color="primary"
                                onPress={() => !isNew && setReqcertsOpen(true)}
                                isIconOnly
                                isDisabled={isDisabled}
                                className={isNew ? "opacity-disabled" : ""}
                                data-hover={!isNew && !isDisabled}
                            >
                                <BookmarkIcon className="size-6" />
                            </Button>
                        </Tooltip>
                        
                        <Tooltip
                            content={isNew ? "Create the item first, before editing authorized roles." : "Authorized Roles"}
                            className="w-fit p-2"
                            delay={500}
                            closeDelay={150}
                            isDisabled={isDisabled}
                        >
                            <Button
                                variant="flat"
                                color="primary"
                                onPress={() => !isNew && setAuthrolesOpen(true)}
                                isIconOnly
                                isDisabled={isDisabled}
                                className={isNew ? "opacity-disabled" : ""}
                                data-hover={!isNew && !isDisabled}
                            >
                                <UserIcon className="size-6" />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                <div className="w-full mt-auto col-span-2 flex flex-row gap-2">
                    <Button
                        size="lg"
                        className="w-full"
                        isDisabled={!hasEdits}
                        isLoading={mutation.isPending}
                        color={"primary"}
                        variant="shadow"
                        type="submit"
                    >
                        {isNew
                            ? "Create Item"
                            : isMultiple
                              ? "Apply Batch Edit"
                              : "Update Item"}
                    </Button>
                    <Button
                        isIconOnly
                        size="lg"
                        color="danger"
                        variant="flat"
                        isDisabled={isDisabled || isNew}
                        isLoading={deleteMutation.isPending}
                        onPress={() => deleteMutation.mutate({item_uuid: UUID})}
                    >
                        <TrashIcon className="size-5"/>
                    </Button>
                </div>
            </Form>

            <RequiredCertsModal
                key={"certreq-" + item.uuid}
                certifications={certs}
                element={item}
                isOpen={reqcertsOpen}
                onOpenChange={setReqcertsOpen}
                patchMutation={reqcertsMutation}
            />
            <AuthorizedRolesModal
                key={"roleauth-" + item.uuid}
                element={item}
                roles={roles}
                isOpen={authrolesOpen}
                onOpenChange={setAuthrolesOpen}
                patchMutation={authrolesMutation}
            />
            <ItemLocationModal
                key={"locedit-" + item.uuid}
                element={item}
                areas={areas}
                isOpen={locationEditorOpen}
                onOpenChange={setLocationEditorOpen}
                patchMutation={locationEditorMutation}
            />
        </>
    );
}
