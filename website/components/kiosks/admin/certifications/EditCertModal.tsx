import {
    Input,
    Selection,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    Checkbox,
    useDisclosure,
    Modal,
    Form,
    ModalContent,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    CheckIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import { TCertification } from "common/certification";
//import { CERTIFICATION_VISIBILITY } from "common/certification";
import Fuse from "fuse.js";
import React from "react";
import { API_SCOPE } from "common/global";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";

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

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [name, setName] = React.useState<string>(cert?.name ?? "");
    const [description, setDescription] = React.useState<string>(
        cert?.description ?? "",
    );
    const [color, setColor] = React.useState<string>(cert?.color ?? "");
    const [uuid, setUUID] = React.useState<string>(cert?.uuid ?? "");
    
    // const [scopes, setScopes] = React.useState<Selection>(
    //     new Set<API_SCOPE>(role?.scopes ?? []),
    // );
    // const [isDefault, setIsDefault] = React.useState<boolean>(
    //     role?.default ?? false,
    // );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Check if there are any edits to save
            if (!hasEdits) return;

            // Get form data as an object.
            const data = new FormData(e.currentTarget);

            // TODO if not editable, keep old version!!!
            const new_cert: TCertification = {
                uuid: uuid,
                name: data.get("name") as string,
                description: data.get("description") as string,
                visibility: "a",
                color: data.get("color") as string,
                max_level: 0,
                seconds_valid_for: 0,
                documents: [], // drops all documents
                authorized_roles: []
            };

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_cert, isNew: isNew });
        },
        [uuid, hasEdits],
    );

    // temporarily dropped; this instacloses modal fsr
    // React.useEffect(() => {
    //     if (!mutation.isPending) {
    //         onOpenChange(false);
    //     }
    // }, [mutation.isPending]);

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    }, []);

    const isValid = React.useMemo(() => {
        return true; // hasEdits && name.length > 0 && color.length > 0; //TODO
    }, [hasEdits]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">{`${isNew ? "Create" : "Edit"} Certification`}</div>
                        <Input
                            type="text"
                            label="UUID"
                            name="uuid"
                            // If no user is selected, show a different placeholder
                            placeholder={uuid}
                            // UUID is not editable
                            isDisabled={!isNew}
                            isRequired={isNew}
                            // If the user exists, prefill the input with the user's uuid
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
                        <div className="flex flex-row w-full gap-2 items-center">
                            <Input
                                type="text"
                                label="Name"
                                name="name"
                                // If no user is selected, show a different placeholder
                                placeholder="Certification Name"
                                isRequired
                                // If the user exists, prefill the input with the user's uuid
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

                            {/* <motion.div
                                initial={{
                                    color: "hsl(var(--heroui-default-500))",
                                }}
                                animate={{
                                    color: isDefault
                                        ? "hsl(var(--heroui-primary-500))"
                                        : "hsl(var(--heroui-default-500))",
                                }}
                                whileHover={{
                                    color: isDefault
                                        ? "hsl(var(--heroui-primary-600))"
                                        : "hsl(var(--heroui-default-600))",
                                }}
                                onClick={() => {
                                    setIsDefault(!isDefault);
                                    setHasEdits(true);
                                }}
                            >
                                <Tooltip
                                    content={
                                        "Whether or not this role should be granted" +
                                        " to all newly created users by default"
                                    }
                                    className="w-56 p-2"
                                    delay={500}
                                    closeDelay={150}
                                >
                                    <StarIcon
                                        className="size-7 cursor-pointer"
                                        strokeWidth={2.5}
                                    />
                                </Tooltip>
                            </motion.div> */}
                        </div>
                        <Input
                            type="text"
                            label="Description"
                            name="description"
                            // If no user is selected, show a different placeholder
                            placeholder="A description of the certification"
                            // If the user exists, prefill the input with the user's uuid
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
                        <div className="grid grid-flow-col gap-2 items-center w-full">
                            <Input
                                type="text"
                                label="Color"
                                name="color"
                                // If no user is selected, show a different placeholder
                                placeholder="Certification Color"
                                isRequired
                                // If the user exists, prefill the input with the user's uuid
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
                                        style={{ backgroundColor: cert.color }}
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
                )}
            </ModalContent>
        </Modal>
    );
}