import { Button, Modal, Form, ModalContent, addToast } from "@heroui/react";
import { LinkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";
import { ScheduleUUID, TAlert, TSchedule } from "common/schedule";

import { TConfig } from "common/config";
import EditableAlert from "./EditableAlert";

export default function AlertEditorModal({
    schedule,
    patchMutation,
    config,
    isOpen,
    onOpenChange,
}: {
    schedule: TSchedule;
    patchMutation: UseMutationResult<
        TSchedule,
        Error,
        {
            schedule_uuid: ScheduleUUID;
            partial_schedule: Partial<TSchedule>;
        }
    >;
    config: TConfig;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const [alerts, setAlerts] = React.useState<TAlert[]>(schedule.alerts);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            // Check if there are any edits to save
            if (!hasEdits) return;

            // Reset the mutation (clears any previous errors)
            patchMutation.reset();
            // Run the mutation
            patchMutation.mutate({
                schedule_uuid: schedule.uuid,
                partial_schedule: { alerts: alerts },
            });
            onOpenChange(false);
            addToast({
                title: `Successfully updated alerts.`,
                color: "success",
            });
        },
        [
            hasEdits,
            patchMutation,
            schedule.uuid,
            alerts,
            onOpenChange,
        ],
    );

    function wrapEdit<P extends keyof TAlert>(uuid: string, prop: P) {
        return (val: TAlert[P]) => {
            const i = alerts.findIndex((a) => a.uuid === uuid);
            if (i < 0) {
                addToast({
                    title: `Could not find alert with uuid: ${uuid} (index: ${i})`,
                    color: "danger",
                });
            }
            if (!alerts[i]) {
                alerts[i] = {
                    uuid: crypto.randomUUID(),
                    header: "",
                    content: "",
                };
            }
            alerts[i][prop] = val;
            setAlerts([...alerts]); // update the instance list
            setHasEdits(true);
        };
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(value) => {
                setHasEdits(false);
                onOpenChange(value);
            }}
            backdrop="blur"
            size="5xl"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <Form
                            onSubmit={onSubmit}
                            className="flex flex-col gap-4 p-4"
                        >
                            <div className="text-2xl font-semibold">
                                Edit Alerts
                            </div>
                            <div className="text-default-500">
                                Add front-page alerts for all users to see.
                                Alerts always have a header text and either a
                                hyperlink or an additional info dropdown.
                                <br />
                                If no alert is active at the current date, a
                                random default (unscheduled) alert will be
                                displayed every hour.
                            </div>
                            <div
                                className={clsx(
                                    "rounded-lg bg-default-100 p-2",
                                    "border-default-200 border-2",
                                    "flex flex-col gap-2 w-full ",
                                )}
                            >
                                <Button
                                    key="button"
                                    className="w-full"
                                    size="sm"
                                    onPress={() => {
                                        setAlerts([
                                            {
                                                uuid: crypto.randomUUID(),
                                                header: "",
                                                content: "",
                                            },
                                            ...alerts,
                                        ]); // add a blank alert
                                        setHasEdits(true);
                                    }}
                                >
                                    <PlusIcon
                                        className="size-5"
                                        strokeWidth={2}
                                    />
                                </Button>
                                <div className="flex flex-col overflow-auto max-h-[50vh] gap-2">
                                    {alerts.map((alert) => (
                                        <EditableAlert
                                            key={alert.uuid}
                                            alert={alert}
                                            deleteAlert={() => {
                                                const a_index =
                                                    alerts.findIndex(
                                                        (a) =>
                                                            a.uuid ===
                                                            alert.uuid,
                                                    );
                                                alerts.splice(a_index, 1); // remove that alert
                                                setAlerts([...alerts]);
                                                setHasEdits(true);
                                            }}
                                            wrapEdit={(prop) =>
                                                wrapEdit(alert.uuid, prop)
                                            }
                                            timezone={config.schedule.timezone}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-row justify-between w-full">
                                <Button
                                    variant="shadow"
                                    type="submit"
                                    color="primary"
                                    className="w-full sm:w-auto"
                                    isDisabled={!hasEdits}
                                    isLoading={patchMutation.isPending}
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
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
