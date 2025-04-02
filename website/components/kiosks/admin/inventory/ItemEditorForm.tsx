import { Form, Input } from "@heroui/react";
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
} from "common/inventory";
import React from "react";

export const roles = [
    { key: "MATERIAL", label: "Material" },
    { key: "TOOL", label: "Tool" },
    { key: "KIT", label: "Kit" },
];

export const accessTypes = [
    { key: 0, label: "Use in Space" },
    { key: 1, label: "Checkout in Space" },
    { key: 2, label: "Checkout and Take Home" },
    { key: 3, label: "Take Home" },
];

export default function ItemEditorForm({ item }: { item: TInventoryItem }) {
    const isEmpty = !item.uuid;

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default browser page refresh.
        e.preventDefault();

        // If something is wrong, don't submit.
        if (isEmpty) return;

        // Get form data as an object.
        const data = new FormData(e.currentTarget);

        // Submit data to your backend API.
        // setSubmitted(data);
    };

    const [UUID, setUUID] = React.useState<InventoryItemUUID>(item.uuid);
    const [name, setName] = React.useState<string>(item.name);
    const [longName, setLongName] = React.useState<string>(
        item.long_name || "",
    );
    const [role, setRole] = React.useState<ITEM_ROLE>(item.role);
    const [accessType, setAccessType] = React.useState<ITEM_ACCESS_TYPE>(
        item.access_type,
    );
    const [locations, setLocations] = React.useState<TInventoryItemLocation[]>(
        item.locations,
    );
    const [reorder_url, setReorderUrl] = React.useState<string>(
        item.reorder_url || "",
    );
    const [serialNumber, setSerialNumber] = React.useState<string>(
        item.serial_number || "",
    );
    const [kitContents, setKitContents] = React.useState<InventoryItemUUID[]>(
        item.kit_contents || [],
    );
    const [keywords, setKeywords] = React.useState<string[]>(
        item.keywords || [],
    );
    const [requiredCerts, setRequiredCerts] = React.useState<
        TItemCertificate[]
    >(item.required_certifications || []);
    const [authorizedRoles, setAuthorizedRoles] = React.useState<string[]>(
        item.authorized_roles || [],
    );

    const placeholder = (text: string) => (isEmpty ? `Select an item` : text);

    return (
        <Form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 lg:flex overflow-auto">
            <Input
                type="text"
                label="UUID"
                name="uuid"
                placeholder={placeholder("UUID")}
                isDisabled
                value={UUID}
                onValueChange={setUUID}
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
                value={name}
                onValueChange={setName}
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
                value={longName}
                onValueChange={setLongName}
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
            <div className="flex gap-3 w-full">
                <Select // Role
                    onSelectionChange={(value) => {
                        if (value == "all") {
                            return;
                        } else {
                            setRole(Array.from(value)[0] as ITEM_ROLE);
                        }
                    }}
                    isDisabled={isEmpty}
                    variant="faded"
                    color="primary"
                    size="md"
                    defaultSelectedKeys={[role]}
                    key={role}
                    label="Role"
                    placeholder="Role"
                    classNames={{
                        value: clsx([
                            "placeholder:text-default-500",
                            "placeholder:italic",
                            "text-default-700",
                        ]),
                    }}
                    className="w-auto"
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
                    value={accessType.toString()}
                    onSelectionChange={(value) => {
                        if (value == "all") {
                            return;
                        } else {
                            setAccessType(
                                parseInt(Array.from(value)[0] as string),
                            );
                        }
                    }}
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
            </div>
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
                value={reorder_url}
                onValueChange={setReorderUrl}
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
                value={serialNumber}
                onValueChange={setSerialNumber}
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
                value={kitContents.join(", ")}
                onValueChange={(value) => setKitContents(value.split(", "))}
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
                label="Keywords"
                name="keywords"
                placeholder={placeholder("Keywords")}
                isDisabled={isEmpty}
                value={keywords.join(", ")}
                onValueChange={(value) => setKeywords(value.split(", "))}
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
                label="Required Certifications"
                name="required_certifications"
                placeholder={placeholder("Required Certifications")}
                isDisabled={isEmpty}
                value={requiredCerts.join(", ")}
                onValueChange={(value) =>
                    setRequiredCerts(
                        value.split(", ").map(
                            (cert) =>
                                ({
                                    name: cert,
                                    certification_uuid: "",
                                    required_level: 0,
                                }) as TItemCertificate,
                        ),
                    )
                }
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
                label="Authorized Roles"
                name="authorized_roles"
                placeholder={placeholder("Authorized Roles")}
                isDisabled={isEmpty}
                value={authorizedRoles.join(", ")}
                onValueChange={(value) => setAuthorizedRoles(value.split(", "))}
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
        </Form>
    );
}
