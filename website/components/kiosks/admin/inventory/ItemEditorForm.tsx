import { Form, Input } from "@heroui/react";
import clsx from "clsx";
import { InventoryItemUUID, ItemQuantity, TInventoryItemLocation, TItemCertificate, TInventoryItem, ITEM_ROLE, ITEM_ACCESS_TYPE } from "common/inventory";
import React from "react";

export default function ItemEditorForm({
    item,
}: {
    item: TInventoryItem;
}) {
    const isEmpty = !item.uuid;
    const isMultiple = false; // Define isMultiple

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
    const [longName, setLongName] = React.useState<string>(item.long_name || "");
    const [role, setRole] = React.useState<ITEM_ROLE>(item.role);
    const [accessType, setAccessType] = React.useState<ITEM_ACCESS_TYPE>(item.access_type);
    const [locations, setLocations] = React.useState<TInventoryItemLocation[]>(item.locations);
    const [reorder_url, setReorderUrl] = React.useState<string>(item.reorder_url || "");
    const [serialNumber, setSerialNumber] = React.useState<string>(item.serial_number || "");
    const [kitContents, setKitContents] = React.useState<InventoryItemUUID[]>(item.kit_contents || []);
    const [keywords, setKeywords] = React.useState<string[]>(item.keywords || []);
    const [requiredCerts, setRequiredCerts] = React.useState<TItemCertificate[]>(item.required_certifications || []);
    const [authorizedRoles, setAuthorizedRoles] = React.useState<string[]>(item.authorized_roles || []);

    const placeholder = (text: string) => (isEmpty ? `Select an item` : text);
    const disabledPlaceholder = (text: string) => placeholder(text);

    return (
        <Form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 lg:flex">
            <Input
                type="text"
                label="UUID"
                name="uuid"
                placeholder={disabledPlaceholder("UUID")}
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
            <Input
                type="text"
                label="Name"
                name="name"
                placeholder={disabledPlaceholder("Item Name")}
                isDisabled={isEmpty || isMultiple}
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
            <Input
                type="text"
                label="Long Name"
                name="long_name"
                placeholder={disabledPlaceholder("Long Item Name")}
                isDisabled={isEmpty || isMultiple}
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
            <Input
                type="text"
                label="Role"
                name="role"
                placeholder={disabledPlaceholder("Role")}
                isDisabled={isEmpty || isMultiple}
                value={role}
                onValueChange={(value) => setRole(value as ITEM_ROLE)}
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
                type="number"
                label="Access Type"
                name="access_type"
                placeholder={disabledPlaceholder("Access Type")}
                isDisabled={isEmpty || isMultiple}
                value={accessType.toString()}
                onValueChange={(value) => setAccessType(Number(value))}
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
                label="Locations"
                name="locations"
                placeholder={disabledPlaceholder("Locations")}
                isDisabled={isEmpty}
                value={locations.map(location => location.area).join(", ")}
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
                label="Reorder URL"
                name="reorder_url"
                placeholder={disabledPlaceholder("Reorder URL")}
                isDisabled={isEmpty || isMultiple}
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
                placeholder={disabledPlaceholder("Serial Number")}
                isDisabled={isEmpty || isMultiple}
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
                placeholder={disabledPlaceholder("Kit Contents")}
                isDisabled={isEmpty || isMultiple}
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
                placeholder={disabledPlaceholder("Keywords")}
                isDisabled={isEmpty || isMultiple}
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
                placeholder={disabledPlaceholder("Required Certifications")}
                isDisabled={isEmpty || isMultiple}
                value={requiredCerts.join(", ")}
                onValueChange={(value) => setRequiredCerts(value.split(", ").map(cert => ({ name: cert, certification_uuid: "", required_level: 0 } as TItemCertificate)))}
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
                placeholder={disabledPlaceholder("Authorized Roles")}
                isDisabled={isEmpty || isMultiple}
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
