import { Card, Input, Selection, Table, TableRow } from "@heroui/react";
import { TConfig } from "common/config";
import { TSchedule } from "common/schedule";
import { TUser, TUserRole, UserUUID } from "common/user";
import clsx from "clsx";
import { useState } from "react";
import { TMachine } from "common/machine";
import { TCertification } from "common/certification";
import ImageCarousel from "../../../ImageCarousel";
import { FILE_RESOURCE_TYPE } from "../../../../../common/file";

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
            className="bg-default-200 w-full h-[200px] p-2 flex-row gap-2"
            shadow="sm"
        >
            <div className="w-1/2 h-full bg-default-300 rounded-md">
                <ImageCarousel
                    resource_type={FILE_RESOURCE_TYPE.MACHINE}
                    resource_uuid={machine.uuid}
                    editable={editable}
                />
            </div>
            <div className="flex flex-col w-1/2">
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
                            input: "placeholder:text-default-400 font-bold text-xl  ",
                        }}
                        isRequired
                        minLength={1}
                        errorMessage={"Unsaved changes: please enter a name"}
                    />
                ) : (
                    <div className="w-full font-bold text-xl p-1 pb-2">
                        {machine.name}
                    </div>
                )}
            </div>
        </Card>
    );
}
