import {
    Button,
    Checkbox,
    Form,
    Input,
    NumberInput,
    Textarea,
    addToast
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
} from "../../../../../common/inventory";
import React, { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { CertificationUUID, TCertification } from "common/certification";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import EditCertsModal from "./ItemCertEditor";
import { TUserRole } from "common/user";
import ItemRoleIcon from "./ItemRoleIcon";

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

export default function ItemEditorForm({
    item,
    certs,
    roles,
    isMultiple,
    isDisabled,
    isNew,
}: {
    item: TInventoryItem;
    certs: TCertification[];
    roles: TUserRole[];
    isMultiple: boolean;
    isDisabled: boolean;
    isNew: boolean;
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
            addToast({
                title: `Successfully ${isNew ? "created" : "updated"} item${isMultiple ? "s" : ""}`,
                timeout: 3000,
                color: "success",
                severity: "success",
            });
            // console.log(result);
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                timeout: 3000,
                color: "danger",
                severity: "danger"
            });
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

            console.log(data.get("role"));

            // const new_item: TInventoryItem = {
            //     uuid: (data.get("UUID") as string) ?? item.uuid,
            //     name: data.get("name") as string,
            //     long_name: data.get("long_name") as string,
            //     role: data.get("role") as ITEM_ROLE,
            //     access_type: parseInt(
            //         data.get("access_type") as string,
            //     ) as ITEM_ACCESS_TYPE, //[0]?.key,//getAccessType(data.get("access_type") as string),//ITEM_ACCESS_TYPE[data.get("access_type") as string],// as ITEM_ACCESS_TYPE,
            //     locations: locations, // TODO
            //     reorder_url: data.get("reorder_url") as string,
            //     serial_number: data.get("serial_number") as string,
            //     keywords:
            //         (data.get("keywords") as string)
            //             ?.split(",")
            //             .map((i) => i.trim()) ?? [], // TODO
            //     required_certifications: item.required_certifications, //.map(c=>{return {certification_uuid:c,required_level:1}}), //todo
            //     authorized_roles: authorizedRoles, // TODO
            // };

            //console.log(new_user);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            // mutation.mutate({ data: new_item, isNew: isNew });
        },
        [isDisabled],
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
                    {/* <Select // Access Type
                    label="Access Type"
                    name="access_type"
                    placeholder={placeholder("Access Type")}
                    isDisabled={isDisabled}
                    //value={item.access_type.toString()}

                    defaultSelectedKeys={
                        isDisabled ? [] : [item.access_type + ""]
                    }
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
                </Select> */}
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
                        <NumberInput
                            label="Quantity"
                            name="quantity"
                            placeholder={placeholder("Quantity")}
                            isDisabled={isDisabled}
                            defaultValue={item.quantity}
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
        </>
    );
}
