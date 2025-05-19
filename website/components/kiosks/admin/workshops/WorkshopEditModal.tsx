import React, { useEffect } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Select,
    SelectItem,
    SelectedItems,
    Form,
    Textarea,
    Input,
    DateInput,
    NumberInput,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TWorkshop } from "../../../../../common/workshop";
import { UserRoleUUID, UserUUID } from "../../../../../common/user";
import { CertificationUUID } from "../../../../../common/certification";
import { UnixTimestamp } from "../../../../../common/global";
import { FileUUID } from "../../../../../common/file";
import { timestampToZonedDateTime } from "../../../../utils";
import { useQuery } from "@tanstack/react-query";
import { TUser } from "../../../../../common/user";
import { TCertification } from "../../../../../common/certification";
import CertificationTag from "../certifications/CertificationTag";

import clsx from "clsx";

export default function WorkshopEditModal({
    workshop,
    users,
    certs,
    isNew,
    isOpen,
    onOpenChange,
}:{
    workshop: TWorkshop;
    users: TUser[];
    certs: TCertification[];
    isNew: boolean;
    isOpen: boolean;
    onOpenChange: () => void;
}) {

    // filtering for stewards
    const [stewards, setStewards] = React.useState<TUser[]>([]);
    const [certifications, setCertifications] = React.useState<TCertification[]>([]);

    useEffect(() => {
        if (users) {
            const stewards = users.filter((user) => {
                return user.active_roles.some((role) => {
                    return !(role.role_uuid === "5ff61ecc-30db-45e8-88d5-2db406fe5e06");
                });
            });
            stewards.sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            })
            setStewards(stewards);
        }
    }, [users]);

    useEffect(() => {
        if (certs) {
            setCertifications(certs);
        }
    }, [certs]);

	//workshop properties 

    const [requiredCertifications, setRequiredCertifications] = React.useState<CertificationUUID[]>(workshop.required_certifications ?? []);

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const isEmpty = !workshop?.uuid && !isNew;

    // A function that wraps a setter to also update the hasEdits state
    const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            fn(value);
            setHasEdits(true);
        };
    }, []);

    const wrapSetEdit = React.useCallback((fn: (arg0: any) => void) => {
        return (value: any) => {
            wrapEdit(fn)(Array.from(value));
        };
    }, []);

    return (
    <Modal
        isOpen={isOpen}
        placement="top-center"
        onOpenChange={onOpenChange}
        className="flex flex-col justify-center align-center"
        size="2xl"
    >
        <ModalContent>
            <ModalHeader>
            <h1 className="text-2xl font-bold">Create/Edit Workshop</h1>
            </ModalHeader>
            <ModalBody>
                <Form>
                    <div className='flex flex-col w-full gap-2'>
                        <div className='flex flex-row gap-4 '>
                            <Input 
                                type="text"
                                label="UUID"
                                name="uuid"
                                placeholder={workshop.uuid}
                                // UUID is not editable
                                isDisabled
                                defaultValue={workshop.uuid}
                                variant="faded"
                                color="primary"
                                size="md"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                        "w-[50%]"
                                    ]),
                                }}
                            />
                            <Button
                            // Create button to copy the UUID to the clipboard
                            size="md"
                            radius="lg"
                            className="my-auto"
                            isIconOnly
                            onPress={() => {
                                // Copy the UUID to the clipboard
                                navigator.clipboard.writeText(workshop.uuid);
                            }}
                            >
                                <ClipboardIcon className="size-6 text-primary-300" />
                            </Button>
                        </div>
                        
                        <Input 
                            type="text"
                            label="Workshop Title"
                            name="title"
                            isRequired
                            placeholder="Enter workshop title"
                            defaultValue={workshop.title}
                            variant="faded"
                            color="primary"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }}
                        />

                        <Textarea
                            label="Description"
                            name="description"
                            placeholder="Enter workshop description"
                            defaultValue={workshop.description}
                            variant="faded"
                            color="primary"
                            classNames={{
                                input: clsx([
                                    "placeholder:text-default-500",
                                    "placeholder:italic",
                                    "text-default-700",
                                ]),
                            }} 
                        />

                        <div className="flex flex-row gap-2">
                            <Select 
                                label="Instructors" 
                                selectionMode="multiple"
                                isRequired
                                placeholder="Enter workshop instructors"
                                defaultSelectedKeys={workshop.instructors}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    value: clsx([
                                        "text-default-500",
                                        "italic",
                                        "group-data-[has-value=true]:text-default-700",
                                        "group-data-[has-value=true]:not-italic	"
                                    ]),
                                }} 
                            >
                                {stewards.map((steward) => (
                                    <SelectItem key={steward.uuid}>{steward.name}</SelectItem>
                                ))}
                            </Select>
                            <Select 
                                label="Support Instructors" 
                                selectionMode="multiple"
                                placeholder="Enter workshop support instructors"
                                defaultSelectedKeys={workshop.support_instructors}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    value: clsx([
                                        "text-default-500",
                                        "italic",
                                        "group-data-[has-value=true]:text-default-700",
                                        "group-data-[has-value=true]:not-italic	"
                                    ]),
                                }} 
                            >
                                {stewards.map((steward) => (
                                    <SelectItem key={steward.uuid}>{steward.name}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="flex flex-row gap-2">
                            <DateInput 
                                label="Public On Make"
                                name="public_timestamp"
                                isRequired
                                granularity="minute"
                                hideTimeZone
                                defaultValue={timestampToZonedDateTime(workshop.timestamp_public)}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    segment: clsx([
                                        "text-default-700",
                                        "data-[editable=true]:text-default-700 ",
                                        "data-[editable=true]:data-[placeholder=true]:text-default-500",
                                        "data-[editable=true]:data-[placeholder=true]:italic",
                                        "focus:text-default-700",
                                        "data-[editable=true]:focus:text-default-700",
                                    ]),
                                }} 
                            />
                            <DateInput 
                                label="Workshop Start"
                                name="timestamp_start"
                                isRequired
                                granularity="minute"
                                hideTimeZone
                                defaultValue={timestampToZonedDateTime(workshop.timestamp_start)}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    segment: clsx([
                                        "text-default-700",
                                        "data-[editable=true]:text-default-700 ",
                                        "data-[editable=true]:data-[placeholder=true]:text-default-500",
                                        "data-[editable=true]:data-[placeholder=true]:italic",
                                        "focus:text-default-700",
                                        "data-[editable=true]:focus:text-default-700",
                                    ]),
                                }} 
                            />
                            <DateInput 
                                label="Workshop End"
                                name="timestamp_end"
                                isRequired
                                granularity="minute"
                                hideTimeZone
                                defaultValue={timestampToZonedDateTime(workshop.timestamp_end)}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    segment: clsx([
                                        "text-default-700",
                                        "data-[editable=true]:text-default-700 ",
                                        "data-[editable=true]:data-[placeholder=true]:text-default-500",
                                        "data-[editable=true]:data-[placeholder=true]:italic",
                                        "focus:text-default-700",
                                        "data-[editable=true]:focus:text-default-700",
                                    ]),
                                }} 
                            />
                        </div>

                        <div className="flex flex-row gap-2">
                            <NumberInput 
                                minValue={0}
                                label="Capacity"
                                name="capacity"
                                isRequired
                                placeholder="Enter workshop capacity"
                                defaultValue={workshop.capacity}
                                variant="faded"
                                color="primary"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                    ]),
                                }} 
                            />
                            <Select<TCertification>
                                label="Required Certifications" 
                                labelPlacement="inside"
                                selectionMode="multiple"
                                placeholder="Enter required certifications"
                                selectedKeys={requiredCertifications}
                                onSelectionChange={wrapSetEdit(setRequiredCertifications)}
                                isMultiline
                                variant="faded"
                                color="primary"
                                classNames={{
                                    value: clsx([
                                        "text-default-500",
                                        "italic",
                                        "group-data-[has-value=true]:text-default-700",
                                        "group-data-[has-value=true]:not-italic	"
                                    ]),
                                }}
                                renderValue={(selectedKeys) => {
                                    console.log(selectedKeys)

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
                                                            <CertificationTag cert_uuid={c.key as string} key={workshop.uuid} />
                                                        ) : null;
                                                    },
                                                )}
                                            </div>
                                        );
                                    }
                                }

                                }
                            >
                                {certifications.map((cert) => (
                                    <SelectItem key={cert.uuid}>
                                        <CertificationTag 
                                            cert_uuid={cert.uuid} 
                                            
                                            />
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    </div>
                </Form>
            </ModalBody>
            <ModalFooter className='flex flex-row justify-between items-center'>
                <Button
                color="primary"
                onPress={() => {
                    onOpenChange();
                }}
                >
                Submit
                </Button>
                <Button
                color="danger"
                onPress={() => {
                    onOpenChange();
                }}
                >
                Cancel
                </Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
    )
}