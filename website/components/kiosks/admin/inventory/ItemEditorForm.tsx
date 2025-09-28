import {
    Button,
    Checkbox,
    Form,
    Input,
    NumberInput,
    Textarea,
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
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { CertificationUUID, TCertification } from "common/certification";
import { BookmarkIcon, CakeIcon, PencilSquareIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { TUserRole } from "common/user";
import ItemRoleIcon from "./ItemRoleIcon";
import { CertSelect } from "../certifications/CertSelect";
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
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: createUpdateItem,
        onSuccess: (result: TInventoryItem) => {
            queryClient.setQueryData(["inventory", item.uuid], result);
            queryClient.setQueryData(["inventory"], (old: TInventoryItem[]) => {
                if (isNew) {
                    return [...old, result];
                } else {
                    return old.map((i) => (i.uuid === item.uuid ? result : i));
                }
            });
            onSuccess(
                `Successfully ${isNew ? "created" : "updated"} item${isMultiple ? "s" : ""}`,
            );
            // console.log(result);
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

            console.log(Array.from(data.getAll("authroles")) as string[]);
            //return;
            
            let quantity = parseInt(data.get("quantity") as string);
            let available = item.available;
            
            if (Math.abs(quantity)/quantity != Math.abs(item.quantity)/item.quantity) { // quantity type change
                available = quantity;
            }

            const new_item: TInventoryItem = {
                uuid: item.uuid, // change back to this if doesn't work with create : (data.get("UUID") as string) ?? item.uuid,
                name: data.get("name") as string,
                long_name: data.get("long_name") as string,
                role: data.get("role") as ITEM_ROLE,
                access_type: parseInt(
                    data.get("access_type") as string,
                ) as ITEM_ACCESS_TYPE,
                locations: item.locations,//locations, // TODO
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
        [isDisabled, item],
    );

    const placeholder = (text: string) => (item.uuid ? text : `Select an item`);

    const [hasEdits, setHasEdits] = useState(false);
    const [openAuthorized, setOpenAuthorized] = useState(
        item.authorized_roles === null,
    );

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = (fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    };

    const defaultEdit = () => setHasEdits(true);

    // Wrap effects for numbers specifically (e.g. validity checking)
    // const wrapNumberEdit = React.useCallback((fn: (arg0: any) => void) => {
    //     return (value: any) => {
    //         let num = parseInt(value || 0);
    //         if (
    //             (isNaN(num) && value != "") || // not actually a number
    //             num < 0 ||
    //             num > 999999999999999
    //         )
    //             // not in the valid range of numbers
    //             return;

    //         wrapEdit(fn)(num);
    //     };
    // }, []);

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
                        isDisabled ? [] : [item.access_type + ""]
                    }
                    onSelectionChange={defaultEdit}
                    // onSelectionChange={(value) => {
                    //     if (value == "all") {
                    //         return;
                    //     } else {
                    //         setAccessType(
                    //             parseInt(Array.from(value)[0] as string),
                    //         );
                    //     }
                    // }}
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
                    {/* </div> */}
                    {/* <Input // Locations
                    type="text"
                    label="Locations"
                    name="locations"
                    placeholder={placeholder("Locations")}
                    isDisabled={isDisabled}
                    // value={locations.map((location) => location.area).join(", ")}
                    // onValueChange={setReorderUrl}
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
                /> */}
                    <div className="grid grid-cols-2 w-full gap-4 col-span-full">
                        <div className="flex flex-row gap-1">
                            {qtype ? (
                                <NumberInput
                                    label="Quantity"
                                    name="quantity"
                                    placeholder={placeholder("Quantity")}
                                    isDisabled={isDisabled}
                                    isRequired
                                    defaultValue={item.quantity}
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
                            defaultSelectedKeys={[item.role]}
                            onSelectionChange={defaultEdit}
                            isDisabled={isDisabled}
                            isRequired
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
                    {/* TODO if this isn't always editable */}
                    <div className="flex justify-evenly">
                        <Button
                            variant="flat"
                            color="primary"
                            onPress={() => setReqcertsOpen(true)}
                            isIconOnly
                            isDisabled={isDisabled}
                        >
                            <BookmarkIcon className="size-6" />
                        </Button>
                        <Button
                            variant="flat"
                            color="primary"
                            onPress={() => setAuthrolesOpen(true)}
                            isIconOnly
                            isDisabled={isDisabled}
                        >
                            <CakeIcon className="size-6" />
                        </Button>
                        <Button
                            variant="flat"
                            color="primary"
                            onPress={() => setLocationEditorOpen(true)}
                            isIconOnly
                            isDisabled={isDisabled}
                        >
                            <VideoCameraIcon className="size-6" />
                        </Button>
                    </div>
                </div>
                <div className="w-full mt-auto col-span-full">
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
                element={item}
                roles={roles}
                isOpen={authrolesOpen}
                onOpenChange={setAuthrolesOpen}
                patchMutation={authrolesMutation}
            />
            <ItemLocationModal
                element={item}
                areas={areas}
                isOpen={locationEditorOpen}
                onOpenChange={setLocationEditorOpen}
                patchMutation={locationEditorMutation}
            />
        </>
    );
}
