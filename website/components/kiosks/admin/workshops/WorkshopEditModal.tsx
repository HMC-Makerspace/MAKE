import React, { useEffect, useState } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Select,
    useDisclosure,
    SelectItem,
    SelectedItems,
    Form,
    Textarea,
    Input,
    DatePicker,
    DateRangePicker,
    NumberInput,
    Autocomplete,
    AutocompleteItem,
    addToast,
} from "@heroui/react";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TWorkshop } from "../../../../../common/workshop";
import { UserRoleUUID, UserUUID } from "../../../../../common/user";
import { CertificationUUID } from "../../../../../common/certification";
import { UnixTimestamp, UUID } from "../../../../../common/global";
import { FileUUID } from "../../../../../common/file";
import { timestampToZonedDateTime } from "../../../../utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TUser } from "../../../../../common/user";
import { TCertification } from "../../../../../common/certification";
import CertificationTag from "../certifications/CertificationTag";
import { parseZonedDateTime, ZonedDateTime } from "@internationalized/date";
import WorkshopImagesModal from "./WorkshopImagesModal.tsx";
import RequiredCertsModal from "../certifications/RequiredCertsModal.tsx";


import clsx from "clsx";
import { TConfig } from "common/config";
import axios from "axios";

const updateCreateWorkshop = async ({
    workshop,
    isNew,
}: {
    workshop: TWorkshop;
    isNew: boolean;
}) => {
    console.log("Creating", workshop);
    if (isNew) {
        // Add the user to the shift
        return (
            await axios.post<TWorkshop>("/api/v3/workshop/", {
                workshop_obj: workshop,
            })
        ).data;
    } else {
        return (
            await axios.put<TWorkshop>("/api/v3/workshop/", {
                workshop_obj: workshop,
            })
        ).data;
    }
};

const updateBatchCreateWorkshop = async ({
    workshops,
}: {
    workshops: TWorkshop[];
}) => {
    console.log("Creating", workshops);

    return await Promise.all(
        workshops.map((workshop) => {
            return updateCreateWorkshop({ workshop: workshop, isNew: true });
        }),
    );
};

async function patchWorkshop({
    uuid,
    patch,
}: {
    uuid: UUID;
    patch: Partial<TWorkshop>;
}) {
    return (
        await axios.patch<TWorkshop>(`/api/v3/workshop/${uuid}`, {
            partial_workshop_obj: patch,
        })
    ).data;
}

const patchBatchWorkshop = async ({
    uuids,
    patch
}: {
    uuids: UUID[];
    patch: Partial<TWorkshop>;
}) => {
    console.log("Updating", uuids);

    return await Promise.all(
        uuids.map((uuid) => {
            return patchWorkshop({ uuid: uuid, patch });
        }),
    );
};

export default function WorkshopEditModal({
    workshop,
    users,
    certs,
    config,
    isNew,
    isOpen,
    onOpenChange,
    batchEdit = false,
}: {
    workshop: TWorkshop;
    users: TUser[];
    certs: TCertification[];
    config: TConfig;
    isNew: boolean;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
    batchEdit: boolean;
}) {
    // batch workshops storage
    const [batchWorkshopsUUIDS, setBatchWorkshopsUUIDS] = useState<UUID[]>([]);
    const workshops: TWorkshop[] = [];

    const queryClient = useQueryClient();
    const updateCreateMutation = useMutation({
        mutationFn: updateCreateWorkshop,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["workshop", data.uuid], data);
            if (variables.isNew) {
                queryClient.setQueryData(["workshop"], (old: TWorkshop[]) => [
                    data,
                    ...old,
                ]);
                addToast({
                    title: `Successfully created workshop`,
                    color: "success",
                });
            } else {
                queryClient.setQueryData(["workshop"], (old: TWorkshop[]) =>
                    old.map((w) => (w.uuid === data.uuid ? data : w)),
                );
                addToast({
                    title: `Successfully updated workshop`,
                    color: "success",
                });
            }
            onOpenChange(false);
        },
        onError: (e) => {
            addToast({
                title: `Error: ${e.message}`,
                color: "danger",
            });
        },
    });

    const updateBatchCreateMutation = useMutation({
        mutationFn: updateBatchCreateWorkshop,
        onSuccess: (data, variables) => {
            data.forEach((workshop) => {
                queryClient.setQueryData(["workshop", workshop.uuid], workshop);
            });
            setBatchWorkshopsUUIDS(data.map((w) => w.uuid));

            queryClient.setQueryData(["workshop"], (old: TWorkshop[]) => [
                ...data,
                ...old,
            ]);

            addToast({
                title: `Successfully created workshops`,
                color: "success",
            });
            onOpenChange(false);
            imagesOnOpen();
            
        },
        onError: (e) => {
            addToast({
                title: `Error: ${e.message}`,
                color: "danger",
            });
        },
    });

    const patchBatchMutation = useMutation({
            mutationFn: patchBatchWorkshop,
            onSuccess: (data) => {
                data.forEach((workshop) => {
                    queryClient.setQueryData(["workshop", workshop.uuid], workshop);
                });
                queryClient.setQueryData(["workshop"], (old: TWorkshop[]) =>
                    old.map((w) => data.find((d) => d.uuid === w.uuid) ?? w )
                );
                addToast({
                    title: `Successfully updated workshops`,
                    color: "success",
                });
            },
            onError: (e) => {
                addToast({
                    title: `Error: ${e.message}`,
                    color: "danger",
                });
            },
        });

    const sortedFilteredWorkers = users
        .filter((user) =>
            user.active_roles.some((role) =>
                config.schedule.worker_roles.includes(role.role_uuid),
            ),
        )
        .toSorted((a, b) => a.name.localeCompare(b.name));

    //workshop properties
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const {
        isOpen: imagesIsOpen,
        onOpen: imagesOnOpen,
        onOpenChange: imagesOnOpenChange,
    } = useDisclosure();

    const {
        isOpen: certsIsOpen,
        onOpen: certsOnOpen,
        onOpenChange: certsOnOpenChange,
    } = useDisclosure();
    

    function wrapEdit<P extends keyof TWorkshop>(prop: P) {
        return (val: TWorkshop[P]) => {
            setHasEdits(hasEdits || (val && val != workshop[prop]));
        };
    }

    function shiftTime(
        timestamp_start: ZonedDateTime,
        repeat_interval: number,
        repeats: number,
        offset = 0,
    ): ZonedDateTime {
        const shift = Number(repeat_interval) * repeats - offset;
        const shifted_date = timestamp_start.add({ days: shift });
        return shifted_date;
    }

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            const repeated_days: number = batchEdit
                ? Number(formData.get("repeats"))
                : 0;

            const repeat_interval: number = batchEdit
                ? Number(formData.get("repeat_interval"))
                : 0;

            for (let i = 0; i < repeated_days; i++) {
                const new_workshop: TWorkshop = {
                    uuid: batchEdit ? crypto.randomUUID() : workshop.uuid, // never changes
                    title: (formData.get("title") as string) || workshop.title,
                    description:
                        (formData.get("description") as string) ??
                        workshop.description,
                    rsvp_disclaimer:
                        (formData.get("rsvp_disclaimer") as string) ??
                        workshop.rsvp_disclaimer,
                    instructors:
                        (formData.getAll("instructors") as string[]) ||
                        workshop.instructors,
                    support_instructors:
                        (formData.getAll("support_instructors") as string[]) ||
                        workshop.support_instructors,
                    capacity:
                        parseInt(formData.get("capacity") as string) ||
                        workshop.capacity,
                    timestamp_start: batchEdit
                        ? shiftTime(
                              parseZonedDateTime(
                                  formData.get("timestamp_start") as string,
                              ),
                              repeat_interval,
                              i,
                          )
                              .toDate()
                              .getTime() / 1000
                        : parseZonedDateTime(
                              formData.get("timestamp_start") as string,
                          )
                              .toDate()
                              .getTime() / 1000 || workshop.timestamp_start,
                    timestamp_end: batchEdit
                        ? shiftTime(
                              parseZonedDateTime(
                                  formData.get("timestamp_end") as string,
                              ),
                              repeat_interval,
                              i,
                          )
                              .toDate()
                              .getTime() / 1000
                        : parseZonedDateTime(
                              formData.get("timestamp_end") as string,
                          )
                              .toDate()
                              .getTime() / 1000 || workshop.timestamp_end,
                    timestamp_public: batchEdit
                        ? shiftTime(
                              parseZonedDateTime(
                                  formData.get("timestamp_start") as string,
                              ),
                              repeat_interval,
                              i,
                              Number(formData.get("timestamp_public")),
                          )
                              .toDate()
                              .getTime() / 1000
                        : parseZonedDateTime(
                              formData.get("timestamp_public") as string,
                          )
                              .toDate()
                              .getTime() / 1000 || workshop.timestamp_public,
                    required_certifications: workshop.required_certifications,
                    rsvp_list: workshop.rsvp_list,
                    reminder_emails_sent: workshop.reminder_emails_sent,
                    sign_in_list: workshop.sign_in_list,
                    images: workshop.images,
                    authorized_roles: workshop.authorized_roles,
                };

                workshops.push(new_workshop);

                if (!batchEdit) {
                    updateCreateMutation.reset();

                    updateCreateMutation.mutate({
                        workshop: new_workshop,
                        isNew: isNew,
                    });
                }
            }

            if (batchEdit) {
                updateBatchCreateMutation.reset();

                updateBatchCreateMutation.mutate({
                    workshops: workshops,
                });
            }
        },
        [isNew, workshop, batchEdit],
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                placement="top-center"
                onOpenChange={onOpenChange}
                className="flex flex-col justify-center align-center"
                size="2xl"
            >
                <ModalContent>
                    <ModalHeader>
                        <h1 className="text-2xl font-bold">
                            {batchEdit
                                ? "Batch Create Workshop"
                                : "Create/Edit Workshop"}
                        </h1>
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={onSubmit}>
                            <div className="flex flex-col w-full gap-2">
                                {batchEdit ? null : (
                                    <div className="flex flex-row gap-4 ">
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
                                                    "w-[50%]",
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
                                                navigator.clipboard.writeText(
                                                    workshop.uuid,
                                                );
                                            }}
                                        >
                                            <ClipboardIcon className="size-6 text-primary-300" />
                                        </Button>
                                    </div>
                                )}

                                <div className="flex flex-row gap-2">
                                    <Input
                                        type="text"
                                        label="Workshop Title"
                                        name="title"
                                        isRequired
                                        placeholder="Enter workshop title"
                                        defaultValue={workshop.title}
                                        onValueChange={wrapEdit("title")}
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
                                    <NumberInput
                                        minValue={0}
                                        label="Capacity"
                                        name="capacity"
                                        placeholder="0 for no limit"
                                        defaultValue={workshop.capacity}
                                        onValueChange={wrapEdit("capacity")}
                                        variant="faded"
                                        color="primary"
                                        className="w-1/2"
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
                                    label="Description"
                                    name="description"
                                    placeholder="Enter workshop description"
                                    defaultValue={workshop.description}
                                    onValueChange={wrapEdit("description")}
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
                                <Input
                                    type="text"
                                    label="RSVP Disclaimer"
                                    name="rsvp_disclaimer"
                                    placeholder="Enter RSVP disclaimer here"
                                    defaultValue={workshop.rsvp_disclaimer}
                                    onValueChange={wrapEdit("rsvp_disclaimer")}
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Select
                                        label="Instructors"
                                        selectionMode="multiple"
                                        name="instructors"
                                        isRequired
                                        placeholder="Enter workshop instructors"
                                        defaultSelectedKeys={
                                            workshop.instructors
                                        }
                                        onSelectionChange={(keys) => {
                                            if (keys === "all") {
                                                wrapEdit("instructors")(
                                                    sortedFilteredWorkers.map(
                                                        (u) => u.uuid,
                                                    ),
                                                );
                                            } else {
                                                wrapEdit("instructors")(
                                                    Array.from(
                                                        keys,
                                                    ) as string[],
                                                );
                                            }
                                        }}
                                        variant="faded"
                                        color="primary"
                                        isMultiline
                                        classNames={{
                                            value: clsx([
                                                "text-default-500",
                                                "italic",
                                                "group-data-[has-value=true]:text-default-700",
                                                "group-data-[has-value=true]:not-italic	",
                                            ]),
                                        }}
                                    >
                                        {sortedFilteredWorkers.map((u) => (
                                            <SelectItem key={u.uuid}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    <Select
                                        label="Support Instructors"
                                        name="support_instructors"
                                        selectionMode="multiple"
                                        placeholder="Enter workshop support instructors"
                                        defaultSelectedKeys={
                                            workshop.support_instructors
                                        }
                                        onSelectionChange={(keys) => {
                                            if (keys === "all") {
                                                wrapEdit("support_instructors")(
                                                    sortedFilteredWorkers.map(
                                                        (u) => u.uuid,
                                                    ),
                                                );
                                            } else {
                                                wrapEdit("support_instructors")(
                                                    Array.from(
                                                        keys,
                                                    ) as string[],
                                                );
                                            }
                                        }}
                                        variant="faded"
                                        color="primary"
                                        isMultiline
                                        classNames={{
                                            value: clsx([
                                                "text-default-500",
                                                "italic",
                                                "group-data-[has-value=true]:text-default-700",
                                                "group-data-[has-value=true]:not-italic	",
                                            ]),
                                        }}
                                    >
                                        {sortedFilteredWorkers.map((u) => (
                                            <SelectItem key={u.uuid}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* <Select<TCertification>
                                    label="Required Certifications"
                                    labelPlacement="inside"
                                    selectionMode="multiple"
                                    placeholder="Enter required certifications"
                                    defaultSelectedKeys={
                                        workshop.required_certifications
                                    }
                                    onSelectionChange={(keys) => {
                                        if (keys === "all") {
                                            wrapEdit("required_certifications")(
                                                sortedFilteredWorkers.map(
                                                    (u) => u.uuid,
                                                ),
                                            );
                                        } else {
                                            wrapEdit("required_certifications")(
                                                Array.from(keys) as string[],
                                            );
                                        }
                                    }}
                                    // selectedKeys={requiredCertifications}
                                    // onSelectionChange={wrapSetEdit(
                                    //     setRequiredCertifications,
                                    // )}
                                    isMultiline
                                    variant="faded"
                                    color="primary"
                                    classNames={{
                                        value: clsx([
                                            "text-default-500",
                                            "italic",
                                            "group-data-[has-value=true]:text-default-700",
                                            "group-data-[has-value=true]:not-italic	",
                                        ]),
                                    }}
                                    renderValue={(selectedKeys) => {
                                        if (selectedKeys.length === 0) {
                                            // If no prereqs are selected, show the placeholder
                                            return "";
                                        } else {
                                            return (
                                                // Otherwise, show the selected prereqs in a flexbox
                                                <div className="flex flex-wrap gap-1 p-2">
                                                    {selectedKeys.map((c) => {
                                                        return c.key ? (
                                                            <CertificationTag
                                                                cert_uuid={
                                                                    c.key as string
                                                                }
                                                                key={c.key}
                                                            />
                                                        ) : null;
                                                    })}
                                                </div>
                                            );
                                        }
                                    }}
                                >
                                    {certs.map((cert) => (
                                        <SelectItem key={cert.uuid}>
                                            <CertificationTag
                                                cert_uuid={cert.uuid}
                                            />
                                        </SelectItem>
                                    ))}
                                </Select> */}

                                {batchEdit ? (
                                    <>
                                        <DateRangePicker
                                            label="First Workshop Time"
                                            aria-label="Workshop Time"
                                            startName="timestamp_start"
                                            endName="timestamp_end"
                                            isRequired
                                            granularity="minute"
                                            hideTimeZone
                                            defaultValue={
                                                workshop.timestamp_start &&
                                                workshop.timestamp_end
                                                    ? {
                                                          start: timestampToZonedDateTime(
                                                              workshop.timestamp_start,
                                                              config.schedule
                                                                  .timezone,
                                                          ),
                                                          end: timestampToZonedDateTime(
                                                              workshop.timestamp_end,
                                                              config.schedule
                                                                  .timezone,
                                                          ),
                                                      }
                                                    : undefined
                                            }
                                            onChange={() => setHasEdits(true)}
                                            variant="faded"
                                            color="primary"
                                            className="w-full"
                                            classNames={{
                                                segment: clsx([
                                                    "text-xs sm:text-small",
                                                    "text-default-700",
                                                    "data-[editable=true]:text-default-700 ",
                                                    "data-[editable=true]:data-[placeholder=true]:text-default-500",
                                                    "data-[editable=true]:data-[placeholder=true]:italic",
                                                    "focus:text-default-700",
                                                    "data-[editable=true]:focus:text-default-700",
                                                ]),
                                            }}
                                        />                                       
                                        <div className="flex flex-row gap-2">
                                            <NumberInput
                                                label="Public Announcement Date"
                                                name="timestamp_public"
                                                isRequired
                                                minValue={1}
                                                maxValue={365}
                                                placeholder="Days before workshop"
                                                variant="faded"
                                                color="primary"
                                                classNames={{
                                                    input: clsx([
                                                        "placeholder:text-default-500",
                                                        "placeholder:italic",
                                                        "text-default-700",
                                                    ]),
                                                    innerWrapper:
                                                        "endcontent:text-default-500",
                                                }}
                                            />

                                            <NumberInput
                                                label="Repeated Interval"
                                                name="repeat_interval"
                                                placeholder="Repeat every x days"
                                                isRequired
                                                minValue={1}
                                                maxValue={365}
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
                                            <NumberInput
                                                className="w-3/4"
                                                label="Total Repeats"
                                                name="repeats"
                                                placeholder="Repeat x times"
                                                isRequired
                                                minValue={1}
                                                maxValue={365}
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
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DatePicker<ZonedDateTime>
                                            label="Public Announcement Date"
                                            name="timestamp_public"
                                            isRequired
                                            granularity="minute"
                                            hideTimeZone
                                            defaultValue={
                                                workshop.timestamp_public
                                                    ? timestampToZonedDateTime(
                                                          workshop.timestamp_public,
                                                          config.schedule
                                                              .timezone,
                                                      )
                                                    : timestampToZonedDateTime(
                                                          Date.now() / 1000,
                                                      )
                                            }
                                            onChange={() => setHasEdits(true)}
                                            variant="faded"
                                            color="primary"
                                            className="w-full"
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
                                        <DateRangePicker
                                            label="Workshop Date Range"
                                            aria-label="Workshop Time"
                                            startName="timestamp_start"
                                            endName="timestamp_end"
                                            isRequired
                                            granularity="minute"
                                            hideTimeZone
                                            defaultValue={
                                                workshop.timestamp_start &&
                                                workshop.timestamp_end
                                                    ? {
                                                          start: timestampToZonedDateTime(
                                                              workshop.timestamp_start,
                                                              config.schedule
                                                                  .timezone,
                                                          ),
                                                          end: timestampToZonedDateTime(
                                                              workshop.timestamp_end,
                                                              config.schedule
                                                                  .timezone,
                                                          ),
                                                      }
                                                    : undefined
                                            }
                                            onChange={() => setHasEdits(true)}
                                            variant="faded"
                                            color="primary"
                                            className="w-full"
                                            classNames={{
                                                segment: clsx([
                                                    "text-xs sm:text-small",
                                                    "text-default-700",
                                                    "data-[editable=true]:text-default-700 ",
                                                    "data-[editable=true]:data-[placeholder=true]:text-default-500",
                                                    "data-[editable=true]:data-[placeholder=true]:italic",
                                                    "focus:text-default-700",
                                                    "data-[editable=true]:focus:text-default-700",
                                                ]),
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex flex-row gap-2 justify-between w-full pt-4">
                                <Button
                                    color="primary"
                                    isDisabled={!hasEdits}
                                    type="submit"
                                >
                                    Submit
                                </Button>
                                <Button
                                    color="danger"
                                    onPress={() => {
                                        onOpenChange(true);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Form>
                    </ModalBody>
                    <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
                </ModalContent>
            </Modal>
            <WorkshopImagesModal
                key={`${workshop.uuid}-images`}
                workshop={batchWorkshopsUUIDS}
                isOpen={imagesIsOpen}
                onOpenChange={imagesOnOpenChange}
                certsOnOpen={certsOnOpen}
                firstTime={true}
            />
            <RequiredCertsModal
                key={workshop.uuid}
                mode="batch"
                element={batchWorkshopsUUIDS}
                certifications={certs}
                isOpen={certsIsOpen}
                onOpenChange={certsOnOpenChange}
                patchMutation={patchBatchMutation}
            />
        </>
    );
}
