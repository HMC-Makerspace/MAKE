import {
    Button,
    Card,
    Chip,
    Input,
    Link,
    Selection,
    Table,
    TableRow,
    Textarea,
} from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import { TUser, TUserRole, UserUUID } from "common/user";
import clsx from "clsx";
import React, { useState } from "react";
import { TMachine } from "common/machine";
import { TCertification } from "common/certification";
import ImageCarousel from "../../../ImageCarousel";
import { FILE_RESOURCE_TYPE } from "../../../../../common/file";
import MachineStatus from "./MachineStatus";

export default function Machine({
    machine,
    roles,
    certifications,
    editable = false,
}: {
    machine: TMachine;
    roles: TUserRole[];
    certifications: TCertification[];
    editable?: boolean;
}) {
    return (
        <Card
            className="bg-default-200 w-full h-full p-2 flex-col lg:flex-row gap-2"
            shadow="sm"
        >
            <div className="w-full lg:w-2/5 h-full bg-default-300 rounded-md ">
                <ImageCarousel
                    resource_type={FILE_RESOURCE_TYPE.MACHINE}
                    resource_uuid={machine.uuid}
                    editable={editable}
                />
            </div>
            <div className="flex flex-col w-full lg:w-3/5 justify-between">
                <span>
                    {editable ? (
                        <Input
                            placeholder="Machine Name"
                            defaultValue={machine.name}
                            onBlur={(blurEvent) => {
                                // Get input value
                                const value = blurEvent.target.value;
                                if (value == machine.name || !value) {
                                    return; // no update
                                }
                                // Update name of schedule
                                console.log("Updating name to", value);
                                // patchMutation.mutate({
                                //     schedule_uuid: schedule.uuid,
                                //     partial_schedule: { name: value },
                                // });
                            }}
                            type="text"
                            size="lg"
                            color="primary"
                            variant="underlined"
                            className="w-full"
                            classNames={{
                                input: "placeholder:text-default-400 font-bold text-xl text-default-800 ",
                            }}
                            isRequired
                            minLength={1}
                            errorMessage={
                                "Unsaved changes: please enter a name"
                            }
                        />
                    ) : (
                        <div className="w-full font-bold text-xl p-1 pb-3 text-default-800">
                            {machine.name}
                        </div>
                    )}
                    {editable ? (
                        <Textarea
                            placeholder="Machine description..."
                            defaultValue={machine.description}
                            onBlur={(blurEvent) => {
                                // Get input value
                                const value = blurEvent.target.value;
                                if (value == machine.name || !value) {
                                    return; // no update
                                }
                                // Update name of schedule
                                console.log("Updating description to", value);
                                // patchMutation.mutate({
                                //     schedule_uuid: schedule.uuid,
                                //     partial_schedule: { name: value },
                                // });
                            }}
                            color="primary"
                            variant="bordered"
                            className="w-full"
                            size="lg"
                            maxRows={12}
                            classNames={{
                                input: "placeholder:text-default-400 text-lg text-default-700",
                                inputWrapper: "p-1",
                            }}
                        />
                    ) : (
                        <div className="w-full text-lg p-1 text-default-700 min-h-24">
                            {machine.description}
                        </div>
                    )}
                </span>
                <MachineStatus machine={machine} />
                {machine.documents && (
                    <div className="mt-3 self-center w-4/5 gap-3 flex flex-row">
                        {machine.documents.length <= 2 ? (
                            machine.documents.map((doc) => (
                                <Button
                                    color="primary"
                                    className="w-full"
                                    href={doc.link}
                                    as={Link}
                                >
                                    {doc.name}
                                </Button>
                            ))
                        ) : (
                            <Button color="primary" className="w-full">
                                View Documents
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
