import {
    Input,
    Button,
    useDisclosure,
    Modal,
    Form,
    ModalContent,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Select,
    SelectItem,
} from "@heroui/react";
import { TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";

import { CertificationUUID, TCertification } from "common/certification";
import { CERTIFICATION_VISIBILITY } from "../../../../../common/certification";

import CertificationTag from "./CertificationTag";
import CVisibilityIcon from "./CVisibilityIcon";
import DeleteCertModal from "./DelCertModal";

import { UserRoleUUID } from "common/user";
import { UserRoleSelect } from "../../../user/UserRoleSelect";

const createUpdateCert = async ({
    data,
    isNew,
}: {
    data: TCertification;
    isNew: boolean;
}) => {
    if (isNew) {
        return (
            await axios.post<TCertification>("/api/v3/certification", { certification_obj: data })
        ).data;
    } else {
        return (
            await axios.put<TCertification>("/api/v3/certification", { certification_obj: data })
        ).data;
    }
};

export default function EditCertModal({
    cert,
    isNew,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    cert: TCertification;
    isNew: boolean;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();

    // Get all certs in order to display possible prereqs
    const allCerts = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    const mutation = useMutation({
        mutationFn: createUpdateCert,
        onSuccess: (result: TCertification) => {
            queryClient.setQueryData(["certification", uuid], result);
            queryClient.setQueryData(["certification"], (old: TCertification[]) => {
                if (isNew) {
                    return [...old, result];
                } else {
                    return old.map((cert) =>
                        cert.uuid === uuid ? result : cert,
                    );
                }
            });
            onSuccess(
                `Successfully ${isNew ? "created" : "updated"} certification ${result.name}`,
            );
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const {
        isOpen: isDeleting,
        onOpen: onDelete,
        onOpenChange: onDeleteChange,
    } = useDisclosure();

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    // certification properties
    const [uuid, setUUID] = React.useState<string>(cert?.uuid || crypto.randomUUID());
    const [name, setName] = React.useState<string>(cert?.name ?? "");
    const [visibility, setVisibility] = React.useState<CERTIFICATION_VISIBILITY>(cert?.visibility || CERTIFICATION_VISIBILITY.PUBLIC);
    const [description, setDescription] = React.useState<string>(cert?.description ?? "");
    const [maxLevel, setMaxLevel] = React.useState<number>(cert?.max_level ?? 0); // 0: no max level
    const [secondsValidFor, setSVF] = React.useState<number>(cert?.seconds_valid_for ?? 0); // 0: no limit
    const [prereqs, setPrereqs] = React.useState<CertificationUUID[]>(cert?.prerequisites ?? []);
    const [authRoles, setAuthRoles] = React.useState<UserRoleUUID[]>(cert?.authorized_roles ?? []);
    const [color, setColor] = React.useState<string>(cert?.color ?? "");

    // Cycle through valid visibilities
    const getNextVisibility = function(vis: CERTIFICATION_VISIBILITY) : CERTIFICATION_VISIBILITY {
        let vs = Object.values(CERTIFICATION_VISIBILITY);
        let oldVisIndex = vs.indexOf(vis);
        return vs[(oldVisIndex + 1) % vs.length]; // will set to public if previously invalid vis
    }

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Check if there are any edits to save
            if (!hasEdits) return;

            // Get form data as an object.
            // const data = new FormData(e.currentTarget);

            const new_cert: TCertification = {
                uuid: uuid,
                name: name,
                description: description,
                visibility: visibility,
                color: color,
                max_level: maxLevel,
                seconds_valid_for: secondsValidFor,
                documents: cert?.documents, // edit documents in separate modal
                authorized_roles: authRoles,
                prerequisites: prereqs
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_cert, isNew: isNew });
        },
        [uuid, name, description, visibility, color, maxLevel, secondsValidFor, authRoles, prereqs, hasEdits],
    );

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    }, []);

    // Wrap effects for numbers specifically (e.g. validity checking)
    const wrapNumberEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            let num = parseInt(value || 0);

            if ((isNaN(num) && value != "") || // not actually a number
                (num < 0 || num > 999999999999999)) // not in the valid range of numbers
                return;
            
            wrapEdit(fn)(num);
        };
    }, []);

    const wrapSetEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            wrapEdit(fn)(Array.from(value));
        };
    }, []);

    const isValid = React.useMemo(() => {
        return hasEdits && name.length > 0 && color.length > 0;
    }, [hasEdits, name, color]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (<>
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">{`${isNew ? "Create" : "Edit"} Certification`}</div>
                        <div className="flex flex-row w-full gap-2 items-center">
                            <Input
                                type="text"
                                label="UUID"
                                name="uuid"
                                placeholder={uuid}
                                // UUID is not editable
                                isDisabled
                                value={uuid}
                                onValueChange={wrapEdit(setUUID)}
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

                            { // Delete button
                            !isNew && (
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={onDelete}
                                    isIconOnly
                                >
                                    <TrashIcon className="size-6" />
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-row w-full gap-2 items-center">
                            <Input
                                type="text"
                                label="Name"
                                name="name"
                                placeholder="Certification Name"
                                isRequired
                                value={name}
                                onValueChange={wrapEdit(setName)}
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

                            <motion.div
                                initial={{
                                    color: "hsl(var(--heroui-default-500))",
                                }}
                                whileHover={{
                                    color: "hsl(var(--heroui-primary-600))"
                                }}
                                onClick={() => {
                                    wrapEdit(setVisibility)(getNextVisibility);
                                }}
                            >
                                <CVisibilityIcon
                                    visibility={visibility}
                                    className="size-7 cursor-pointer"
                                />
                            </motion.div>
                        </div>
                        <Input
                            type="text"
                            label="Description"
                            name="description"
                            placeholder="A description of the certification"
                            value={description}
                            onValueChange={wrapEdit(setDescription)}
                            variant="faded"
                            color="primary"
                            size="md"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700 text-ellipsis",
                                ]),
                            }}
                        />

                        <div className="flex flex-row w-full gap-2 items-center">
                            <Input
                                type="text"
                                label="Max Level"
                                name="max_level"
                                placeholder="Maximum level"
                                value={maxLevel == 0 ? "" : `${maxLevel}`}
                                onValueChange={wrapNumberEdit(setMaxLevel)}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700 text-ellipsis",
                                    ]),
                                }}
                            />

                            <Input
                                type="text"
                                label="Seconds Valid For"
                                name="svf"
                                placeholder="Expiration time"
                                value={secondsValidFor == 0 ? "" : `${secondsValidFor}`}
                                onValueChange={wrapNumberEdit(setSVF)}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700 text-ellipsis",
                                    ]),
                                }}
                            />
                        </div>

                        {(allCerts.data && (<Select<TCertification>
                            name="prereqs"
                            selectedKeys={prereqs}
                            disabledKeys={cert?.uuid}
                            onSelectionChange={wrapSetEdit(setPrereqs)}
                            selectionMode="multiple"
                            isMultiline
                            placeholder="Select prerequisite certifications"
                            size="lg"
                            variant="faded"
                            color="primary"
                            label="Prerequisites"
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
                                                        <CertificationTag cert_uuid={c.key as string} key={cert.uuid + "-prereq-" + c.key} />
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
                                    <CertificationTag cert_uuid={c.uuid} />
                                </SelectItem>
                            ))}
                        </Select>))}

                        <UserRoleSelect
                            selectedKeys={authRoles}
                            onSelectionChange={wrapSetEdit(setAuthRoles)}
                            placeholder="Select authorized roles"
                            label="Authorized Roles"
                            labelPlacement="inside"
                            classNames={{
                                value: "text-default-500",
                            }}
                        />

                        <div className="grid grid-flow-col gap-2 items-center w-full">
                            <Input
                                type="text"
                                label="Color"
                                name="color"
                                placeholder="Certification Color"
                                isRequired
                                value={color}
                                onValueChange={wrapEdit(setColor)}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                        "uppercase",
                                    ]),
                                }}
                            />
                            <Popover
                                showArrow
                                offset={10}
                                placement="right"
                                shouldCloseOnBlur={false}
                                triggerScaleOnOpen={false}
                            >
                                <PopoverTrigger>
                                    <Button
                                        size="md"
                                        isIconOnly
                                        className="rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                </PopoverTrigger>
                                <PopoverContent className="p-2.5">
                                    <HexColorPicker
                                        color={color}
                                        onChange={wrapEdit(setColor)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-row justify-between w-full">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={mutation.isPending}
                            >
                                Submit
                            </Button>
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>

                    <DeleteCertModal
                        key={"del-" + cert.uuid}
                        cert={cert}
                        isOpen={isDeleting}
                        onOpenChange={onDeleteChange}
                        onSuccess={(message) => {
                            onSuccess(message);
                            onClose();
                        }}
                        onError={(message) => {
                            onError(message);
                            onClose();
                        }}
                    />
                </>)}
            </ModalContent>
        </Modal>
    );
}