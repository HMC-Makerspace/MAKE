import { Button, Form, Input } from "@heroui/react";
import { Select, SelectSection, SelectItem } from "@heroui/select";
import {Accordion, AccordionItem} from "@heroui/accordion";
import clsx from "clsx";
import {
    InventoryItemUUID,
    ItemQuantity,
    TInventoryItemLocation,
    TItemCertificate,
    TInventoryItem,
    ITEM_ROLE,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import React from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import ItemCertTag from "./ItemCertTag";
import { CertificationUUID, TCertification } from "common/certification";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import EditCertsModal from "./ItemCertEditor";

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
        return (await axios.post<TInventoryItem>("/api/v3/inventory", { item_obj: data }))
            .data;
    } else {
        return (await axios.put<TInventoryItem>(`/api/v3/inventory`, { item_obj: data }))
            .data;
    }
};

export default function ItemEditorForm({
    item,
    isMultiple,
    isNew,
    onSuccess,
    onError,
}: {
    item: TInventoryItem;
    isMultiple: boolean;
    isNew: boolean;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const isEmpty = !item.uuid;

    const queryClient = useQueryClient();

    // Get all certs in order to display possible prereqs
    const allCerts = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    // Get all certs in order to display possible prereqs
    // const allItems = useQuery<TInventoryItem[]>({
    //     queryKey: ["inventory"],
    //     refetchOnWindowFocus: false,
    // });

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

    // function getAccessType(type: "Use in Space"|"Checkout in Space"|) { // todo restyle to other function definition methods
    //     switch(type) {
    //         case ""
    //     }
    // }

    // const [UUID, setUUID] = React.useState<InventoryItemUUID>(item.uuid);
    // const [name, setName] = React.useState<string>(item.name);
    // const [longName, setLongName] = React.useState<string>(
    //     item.long_name || "",
    // );
    // const [role, setRole] = React.useState<ITEM_ROLE>(item.role);
    // const [accessType, setAccessType] = React.useState<ITEM_ACCESS_TYPE>(
    //     item.access_type,
    // );
    const [locations, setLocations] = React.useState<TInventoryItemLocation[]>(
        item.locations,
    );
    // const [reorderUrl, setReorderUrl] = React.useState<string>(
    //     item.reorder_url || "",
    // );
    // const [serialNumber, setSerialNumber] = React.useState<string>(
    //     item.serial_number || "",
    // );
    const [kitContents, setKitContents] = React.useState<InventoryItemUUID[]>(
        item.kit_contents || [],
    );
    // const [keywords, setKeywords] = React.useState<string[]>(
    //     item.keywords || [],
    // );
    // const [requiredCerts, setRequiredCerts] = React.useState<TItemCertificate[]>(
    //     item.required_certifications || []
    // );

    // console.log(item.required_certifications)

    // setItemOpenCert(item);
    // setCertEditorOpen(true);

    //const [ItemOpenCert, setItemOpenCert] = React.useState<TIn
    const [certEditorOpen, setCertEditorOpen] = React.useState<boolean>(false);


    const [authorizedRoles, setAuthorizedRoles] = React.useState<string[]>(
        item.authorized_roles || [],
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            console.log("submitting form");

            // If something is wrong, don't submit.
            if (isEmpty) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            console.log(data.get("role"));

            const new_item: TInventoryItem = {
                uuid: data.get("UUID") as string ?? item.uuid,
                name: data.get("name") as string,
                long_name: data.get("long_name") as string,
                role: data.get("role") as ITEM_ROLE,
                access_type: parseInt(data.get("access_type") as string) as ITEM_ACCESS_TYPE,//[0]?.key,//getAccessType(data.get("access_type") as string),//ITEM_ACCESS_TYPE[data.get("access_type") as string],// as ITEM_ACCESS_TYPE,
                locations: locations, // TODO
                reorder_url: data.get("reorder_url") as string,
                serial_number: data.get("serial_number") as string,
                kit_contents: kitContents, // TODO
                keywords: (data.get("keywords") as string)?.split(",").map(i => i.trim()) ?? [], // TODO
                required_certifications: item.required_certifications,//.map(c=>{return {certification_uuid:c,required_level:1}}), //todo
                authorized_roles: authorizedRoles // TODO
            };

            //console.log(new_user);

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_item, isNew: isNew });
        },
        [isEmpty],
    );

    const placeholder = (text: string) => (isEmpty ? `Select an item` : text);

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            //setHasEdits(true);
        };
    }, []);

    // Wrap effects for numbers specifically (e.g. validity checking)
    // const wrapNumberEdit = React.useCallback((fn: (arg0: any) => void) => {
    //     return (value: any) => {
    //         let num = parseInt(value || 0);

    //         if ((isNaN(num) && value != "") || // not actually a number
    //             (num < 0 || num > 999999999999999)) // not in the valid range of numbers
    //             return;
            
    //         wrapEdit(fn)(num);
    //     };
    // }, []);

    const wrapSetEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            wrapEdit(fn)(Array.from(value));
        };
    }, []);

    return (<>
        <Form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 lg:flex overflow-auto">
            <Input
                type="text"
                label="UUID"
                name="uuid"
                placeholder={placeholder("UUID")}
                isDisabled
                defaultValue={item.uuid}
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
            <Input // Name
                type="text"
                label="Name"
                name="name"
                placeholder={placeholder("Item Name")}
                isDisabled={isEmpty}
                isRequired
                defaultValue={item.name}
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
                isDisabled={isEmpty}
                defaultValue={item.long_name}
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
            {/* <div className="flex gap-3 w-full"> */}
                <Select // Role
                    // onSelectionChange={(value) => {
                    //     if (value == "all") {
                    //         return;
                    //     } else {
                    //         setRole(Array.from(value)[0] as ITEM_ROLE);
                    //     }
                    // }}
                    isDisabled={isEmpty}
                    variant="faded"
                    color="primary"
                    size="md"
                    defaultSelectedKeys={[item.role+""]}
                    key={item.role}
                    name="role" // wow abe you forgot to name it
                    label="Role"
                    placeholder={placeholder("Role")}
                    classNames={{
                        value: clsx([
                            "placeholder:text-default-500",
                            "placeholder:italic",
                            "text-default-700",
                        ]),
                    }}
                >
                    {roles.map((role) => (
                        <SelectItem key={role.key}>{role.label}</SelectItem>
                    ))}
                </Select>
                <Select // Access Type
                    label="Access Type"
                    name="access_type"
                    placeholder={placeholder("Access Type")}
                    isDisabled={isEmpty}
                    //value={item.access_type.toString()}

                    defaultSelectedKeys={isEmpty ? [] : [item.access_type+""]}
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
            <Input // Locations
                type="text"
                label="Locations"
                name="locations"
                placeholder={placeholder("Locations")}
                isDisabled={isEmpty}
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
            />
            <Input
                type="text"
                label="Reorder URL"
                name="reorder_url"
                placeholder={placeholder("Reorder URL")}
                isDisabled={isEmpty}
                defaultValue={item.reorder_url}
                //onValueChange={setReorderUrl}
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
                isDisabled={isEmpty}
                defaultValue={item.serial_number}
                //onValueChange={setSerialNumber}
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
                label="Kit Contents"
                name="kit_contents"
                placeholder={placeholder("Kit Contents")}
                isDisabled={isEmpty}
                //defaultValue={item.kit_contents?.join(", ")}
                //onValueChange={(value) => setKitContents(value.split(", "))}
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

            {/* {(allItems.data && (<Select<TInventoryItem>



            label="Required Certifications wait no i mean kit contents"
            name="kit_contents"
            placeholder={placeholder("Required Certifications")}
            isDisabled={isEmpty}



            selectedKeys={kitContents}
            onSelectionChange={wrapSetEdit(setKitContents)}
            selectionMode="multiple"
            isMultiline
            size="lg"
            variant="faded"
            color="primary"
            labelPlacement="inside"
            classNames={{
                value: "text-default-500",
            }}
            itemHeight={45}
            renderValue={(selectedKeys) => {
                if (selectedKeys.length === 0) {
                    // If no prereqs are selected, show the placeholder
                    return "";
                } else {
                    return (
                        // Otherwise, show the selected prereqs in a flexbox
                        <div className="flex flex-wrap gap-1 p-2">
                            {selectedKeys.map(
                                (i) => {
                                    return i.key &&
                                        i.textValue ? (
                                            <div key={item.uuid + "-prereq-" + i.key}>{i.textValue as string}</div>
                                            //<ItemCertTag cert_uuid={c.key as string} req_level={1} key={item.uuid + "-prereq-" + c.key} on_level_change={()=>{}} />
                                        // <CertificationTag cert_uuid={c.key as string} key={item.uuid + "-prereq-" + c.key} />
                                    ) : null;
                                },
                            )}
                        </div>
                    );
                }
            }}
            >
            {allItems.data.map((i) => (
                <SelectItem
                    key={
                        i.uuid
                    }
                    textValue={
                        i.name
                    }
                    value={
                        i.uuid
                    }
                    className="h-[45px]"
                >
                    <div>{i.uuid /* todo cert tag here *//*}</div>
                </SelectItem>
            ))}
            </Select>))*/}
            <Input
                type="text"
                label="Keywords"
                name="keywords"
                placeholder={placeholder("Keywords")}
                isDisabled={isEmpty}
                defaultValue={item.keywords?.join(", ")}
                //onValueChange={(value) => setKeywords(value.split(", "))}
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

            
            {/* <Input
                                type="number"
                                className="text-sm font-semibold text-nowrap"
                            
            
                            >
                            
                            </Input> */}
            {/* {(allCerts.data && (<Select<TItemCertificate> // this should probably be a separate component



                label="Required Certifications"
                name="required_certifications"
                placeholder={placeholder("Required Certifications")}
                isDisabled={isEmpty}
                


                selectedKeys={requiredCerts}
                onSelectionChange={wrapSetEdit(setRequiredCerts)}
                selectionMode="multiple"
                isMultiline
                size="lg"
                variant="faded"
                color="primary"
                labelPlacement="inside"
                classNames={{
                    value: "text-default-500",
                }}
                itemHeight={45}
                renderValue={(selectedKeys) => {
                    if (selectedKeys.length === 0) {
                        // If no prereqs are selected, show the placeholder
                        return "";
                    } else {
                        return (
                            // Otherwise, show the selected prereqs in a flexbox
                            <div className="flex flex-wrap gap-1 p-2">
                                {selectedKeys.map(
                                    (c) => {
                                        return c.key &&
                                            c.textValue ? (
                                                // <div key={item.uuid + "-prereq-" + c.key}>{c.key as string}</div>
                                                <ItemCertTag cert_uuid={c.key as string} req_level={1} key={item.uuid + "-prereq-" + c.key} on_level_change={()=>{}} />
                                            // <CertificationTag cert_uuid={c.key as string} key={item.uuid + "-prereq-" + c.key} />
                                        ) : null;
                                    },
                                )}
                            </div>
                        );
                    }
                }}
            >
                {allCerts.data.map((c) => (
                    <SelectItem
                        key={
                            c.uuid
                        }
                        textValue={
                            c.name
                        }
                        value={
                            c.uuid
                        }
                        className="h-[45px]"
                    >
                        <div>{c.uuid /* todo cert tag here *//*}</div>
                    </SelectItem>
                ))}
            </Select>))} */}


            <div className="flex flex-col gap-2">
                <label>Required Certifications</label>
                <Button
                    variant="flat"
                    color="secondary"
                    onPress={() => {
                        //setItemOpenCert(item);
                        setCertEditorOpen(true);
                    }}
                    isIconOnly
                    isDisabled={isEmpty}
                >
                    <PencilSquareIcon className="size-6" />
                </Button>
            </div>

            

            {/* <div className="flex flex-col gap-2">
                <Button
                    variant="flat"
                    color="secondary"
                    onPress={async () => {
                        //setItemOpenCert(item);
                        console.log((await axios.put<TInventoryItem>("/api/v3/inventory", { item_obj: {
                            certification_uuid: "certification-uuid-1",
                            required_level: 1
                        } })).data);
                    }}
                    isIconOnly
                >
                    <PencilSquareIcon className="size-6" />
                </Button>
            </div> */}


            <UserRoleSelect // todo pull from v3
                selectedKeys={authorizedRoles}
                // label="Authorized Roles"
                // labelPlacement="inside"
                
                // name="authorized_roles"
                // placeholder={placeholder("Authorized Roles")}
                isDisabled={isEmpty}
                onSelectionChange={wrapSetEdit(setAuthorizedRoles)}
                // variant="faded"
                // color="primary"
                // size="md"
                // classNames={{
                //     input: clsx([
                //         "placeholder:text-default-500",
                //         "placeholder:italic",
                //         "text-default-700",
                //     ]),
                // }}
            />
            <div className="w-full">
                <Button
                    size="lg"
                    className="w-full"
                    isDisabled={isEmpty}
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

        {certEditorOpen && (
                <EditCertsModal
                    key={"itemcertedit-" + item.uuid}
                    item={item}
                    certificates={item.required_certifications || []}
                    isOpen={certEditorOpen}
                    onOpenChange={setCertEditorOpen}
                    onSuccess={() => setCertEditorOpen(false)}
                    onError={() => alert("Error")}
                />
            )}

        </>
    );
}
