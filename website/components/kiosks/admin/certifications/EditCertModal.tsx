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
    Select,
    SelectSection,
    SelectItem,
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    CheckIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import { CertificationUUID, TCertification } from "common/certification";
import Fuse from "fuse.js";
import React from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { TUser, TUserRole, UserRoleUUID } from "common/user";
import { CERTIFICATION_VISIBILITY } from "../../../../../common/certification";
import { TDocument } from "common/file";
import UserRole from "../../../user/UserRole";
import CertificationTag from "./CertificationTag";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import CVisibilityIcon from "./CVisibilityIcon";

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

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [name, setName] = React.useState<string>(cert?.name ?? "");
    const [description, setDescription] = React.useState<string>(cert?.description ?? "");
    const [color, setColor] = React.useState<string>(cert?.color ?? "");
    const [uuid, setUUID] = React.useState<string>(cert?.uuid || crypto.randomUUID());
    
    const [visibility, setVisibility] = React.useState<CERTIFICATION_VISIBILITY>(cert?.visibility || CERTIFICATION_VISIBILITY.PUBLIC);

    const [maxLevel, setMaxLevel] = React.useState<number>(cert?.max_level ?? 0); // 0: no max level
    const [secondsValidFor, setSVF] = React.useState<number>(cert?.seconds_valid_for ?? 0); // 0: no limit

    const [prereqs, setPrereqs] = React.useState<CertificationUUID[]>(cert?.prerequisites ?? []);
    const [authRoles, setAuthRoles] = React.useState<UserRoleUUID[]>(cert?.authorized_roles ?? []);
    const [documents, setDocuments] = React.useState<TDocument[]>(cert?.documents ?? []);

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
                name: name, //data.get("name") as string,
                description: description, //data.get("description") as string,
                visibility: visibility,
                color: color, //data.get("color") as string,
                max_level: maxLevel, //parseInt(data.get("max_level") as string ?? ""),
                seconds_valid_for: secondsValidFor,// parseInt(data.get("svf") as string ?? ""),
                documents: documents, // drops all documents
                authorized_roles: authRoles,
                prerequisites: prereqs
            };

            // if (new_cert.max_level == 0) {
            //     delete new_cert.max_level; // if 0, don't specify
            // }
            // if (new_cert.seconds_valid_for == 0) {
            //     delete new_cert.seconds_valid_for; // v.s.
            // }

            // Reset the mutation (clears any previous errors)
            mutation.reset();
            // Run the mutation
            mutation.mutate({ data: new_cert, isNew: isNew });
        },
        [uuid, name, description, visibility, color, maxLevel, secondsValidFor, documents, authRoles, prereqs, hasEdits],
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
                            isDisabled
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
                                    // If no scopes are selected, show the placeholder
                                    return "";
                                } else {
                                    return (
                                        // Otherwise, show the selected scopes in a flexbox
                                        <div className="flex flex-wrap gap-1 p-2">
                                            {selectedKeys.map(
                                                (cert) => {
                                                    return cert.key &&
                                                        cert.textValue ? (
                                                        <CertificationTag cert_uuid={cert.key as string} key={cert.key} />
                                                    ) : null;
                                                },
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        >
                            {allCerts.data.map((cert) => (
                                <SelectItem
                                    key={
                                        cert.uuid
                                    }
                                    textValue={
                                        cert.name
                                    }
                                    value={
                                        cert.uuid
                                    }
                                    className="h-[45px]"
                                >
                                    <CertificationTag cert_uuid={cert.uuid} />
                                </SelectItem>
                            ))}
                        </Select>))}

                        <UserRoleSelect selectedKeys={authRoles} onSelectionChange={wrapSetEdit(setAuthRoles)} />

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
                )}
            </ModalContent>
        </Modal>
    );
}