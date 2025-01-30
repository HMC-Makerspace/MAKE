import { Form, Input, Select } from "@heroui/react";
import clsx from "clsx";
import { TUser, TUserRole, TUserRoleLog, UserRoleUUID } from "common/user";
import React from "react";

export default function UserEditorForm({
    user,
    isMultiple,
}: {
    user: TUser;
    isMultiple: boolean;
}) {
    const isEmpty = !user.uuid;

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent default browser page refresh.
        e.preventDefault();

        // If something is wrong, don't submit.
        if (isEmpty) return;

        // Get form data as an object.
        const data = new FormData(e.currentTarget);

        // const user: TUser = {
        //     uuid: user_uuid,
        //     name: data.get("name") as string,
        //     email: data.get("email") as string,
        // };

        // Submit data to your backend API.
        // setSubmitted(data);
    };

    const [UUID, setUUID] = React.useState<string>(user.uuid);
    const [collegeID, setCollegeID] = React.useState<string>(user.college_id);
    const [name, setName] = React.useState<string>(user.name);
    const [email, setEmail] = React.useState<string>(user.email);

    const [roles, setRoles] = React.useState<Set<string>>(
        new Set(user.active_roles.map((role: TUserRoleLog) => role.role_uuid)),
    );

    const placeholder = (text: string) => (isEmpty ? `Select a user` : text);
    const multiDisabledPlaceholder = (text: string) =>
        isMultiple ? `Disabled for batch edit` : placeholder(text);

    return (
        <Form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 lg:flex">
            <Input
                type="text"
                label="UUID"
                name="uuid"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("UUID")}
                // UUID is not editable
                isDisabled
                // If the user exists, prefill the input with the user's uuid
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
                label="College ID"
                name="college_id"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("ID #")}
                // Disable the input if there are multiple or no users are
                // selected, or if users are loading
                isDisabled={isEmpty || isMultiple}
                // ID must not be empty
                isRequired
                // If the user exists, prefill the input with the user's id
                value={collegeID}
                onValueChange={setCollegeID}
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
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("Firstname Lastname")}
                // Disable the input if there are multiple or no users are
                // selected, or if users are loading
                isDisabled={isEmpty || isMultiple}
                // Name must not be empty
                isRequired
                // If the user exists, prefill the input with the user's name
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
                label="Email"
                name="email"
                // If no user is selected, show a different placeholder
                placeholder={multiDisabledPlaceholder("user@college.edu")}
                // Disable the input if there are multiple or no users are
                // selected, or if users are loading
                isDisabled={isEmpty || isMultiple}
                // Email must not be empty
                isRequired
                // If the user exists, prefill the input with the user's email
                value={email}
                onValueChange={setEmail}
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
            <Select></Select>
        </Form>
    );
}
