import { TrashIcon, PlusIcon, LinkIcon } from "@heroicons/react/24/outline";
import {
    Input,
    Select,
    SelectItem,
    Button,
    Modal,
    ModalContent,
    Form,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@heroui/react";
import clsx from "clsx";
import {
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_TYPE,
    MachineUUID,
    TMachine,
    TMachineInstance,
    MACHINE_EDIT_LEVEL,
} from "../../../../../common/machine";
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

function InstanceRow({
    machine,
    instance,
    index,
    wrapEdit,
    deleteIndex,
    editable,
    styles,
}: {
    machine: TMachine;
    instance: TMachineInstance;
    index: number;
    wrapEdit<P extends keyof TMachineInstance>(
        i: number,
        prop: P,
    ): (val: TMachineInstance[P]) => void;
    deleteIndex: (index: number) => void;
    editable: MACHINE_EDIT_LEVEL;
    styles: { [key in MACHINE_STATUS_TYPE]: string };
}) {
    const fullEdit = editable == MACHINE_EDIT_LEVEL.FULL;
    const statusEdit =
        editable == MACHINE_EDIT_LEVEL.FULL ||
        editable == MACHINE_EDIT_LEVEL.STATUS_ALL;

    return (
        <div
            className={clsx(
                "bg-default-200 p-2 rounded-md",
                instance.reserved && !statusEdit && "bg-secondary-100/50",
            )}
        >
            {instance.reserved && (
                <span className="text-secondary-300 text-xs">
                    Currently Reserved
                </span>
            )}
            <div
                className={clsx(
                    "grid grid-flow-dense grid-cols-6",
                    "md:flex md:flex-row w-full gap-2",
                    "items-center relative -mt-1",
                )}
            >
                <Input
                    type="text"
                    label="Name"
                    name="name"
                    placeholder={`${machine.name} ${index + 1}`}
                    value={instance.name}
                    onValueChange={wrapEdit(index, "name")}
                    isDisabled={!fullEdit}
                    variant="underlined"
                    color="primary"
                    size="md"
                    className="md:w-1/2 col-span-3 opacity-100"
                    classNames={{
                        input: clsx([
                            fullEdit && "placeholder:text-default-500",
                            fullEdit && "placeholder:italic",
                            "text-default-700",
                        ]),
                    }}
                />

                <Select
                    items={MACHINE_STATUS_LABELS}
                    label="Status"
                    labelPlacement="inside"
                    placeholder="Select a status"
                    className="md:w-1/2 opacity-100 col-span-3"
                    defaultSelectedKeys={[
                        MACHINE_STATUS_LABELS[instance.status].short_label,
                    ]}
                    isRequired
                    isDisabled={!statusEdit}
                    selectorIcon={statusEdit ? undefined : <span />}
                    variant="underlined"
                    onSelectionChange={(keys) => {
                        console.log(keys);
                        if (keys === "all") {
                            return;
                        } else {
                            const selectionLabel = Array.from(
                                keys,
                            )[0] as string;
                            const key = MACHINE_STATUS_LABELS.find(
                                (l) => l.short_label === selectionLabel,
                            );
                            if (key) wrapEdit(index, "status")(key.key);
                        }
                    }}
                    renderValue={(selected) =>
                        selected.map((item) => (
                            <div
                                key={item.textValue}
                                className={clsx(
                                    "rounded-md h-fit w-[90%] p-0.5 text-center mb-1",
                                    styles[item.data?.key ?? 0],
                                )}
                            >
                                {item.textValue}
                            </div>
                        ))
                    }
                >
                    {(status_type) => (
                        <SelectItem
                            key={status_type.short_label}
                            textValue={status_type.short_label}
                        >
                            <div
                                className={clsx(
                                    "rounded-md h-fit w-full p-0.5 text-center",
                                    styles[status_type.key],
                                )}
                            >
                                {status_type.short_label}
                            </div>
                        </SelectItem>
                    )}
                </Select>

                <Input
                    type="text"
                    label={
                        !statusEdit && !instance.message
                            ? "No Message"
                            : "Message"
                    }
                    name="message"
                    placeholder=""
                    value={instance.message}
                    onValueChange={wrapEdit(index, "message")}
                    variant="underlined"
                    color="primary"
                    size="md"
                    className={clsx(
                        "col-span-5 opacity-100",
                        !statusEdit && !instance.message && "hidden md:flex",
                    )}
                    isDisabled={
                        editable != MACHINE_EDIT_LEVEL.FULL &&
                        editable != MACHINE_EDIT_LEVEL.STATUS_ALL
                    }
                    classNames={{
                        input: clsx([
                            "placeholder:text-default-500",
                            "placeholder:italic",
                            "text-default-700",
                        ]),
                        label: !statusEdit && "text-default-600",
                    }}
                />

                {fullEdit && (
                    <Button
                        variant="flat"
                        color="danger"
                        onPress={() => deleteIndex(index)}
                        isIconOnly
                    >
                        <TrashIcon className="size-6" />
                    </Button>
                )}
            </div>
        </div>
    );
}

async function updateMachineInstances({
    machine_uuid,
    instances,
}: {
    machine_uuid: MachineUUID;
    instances: TMachineInstance[];
}) {
    return (
        await axios.patch(`/api/v3/machine/${machine_uuid}/instances`, {
            instances: instances,
        })
    ).data;
}

export default function EditStatusModal({
    machine,
    isOpen,
    onOpenChange,
    editable,
    styles,
}: {
    machine: TMachine;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    editable: MACHINE_EDIT_LEVEL;
    styles: { [key in MACHINE_STATUS_TYPE]: string };
}) {
    const [hasEdits, setHasEdits] = useState<boolean>(false);
    const [localInstances, setLocalInstances] = useState<TMachineInstance[]>(
        machine.instances,
    );

    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: updateMachineInstances,
        onSuccess: (obj: TMachine) => {
            queryClient.setQueryData(["machine", obj.uuid], obj);
            queryClient.setQueryData(["machine"], (old: TMachine[]) => {
                return (old ?? []).map((m) => (m.uuid === obj.uuid ? obj : m));
            });
            queryClient.setQueryData(
                ["machine", "public"],
                (old: TMachine[]) => {
                    return (old ?? []).map((m) =>
                        m.uuid === obj.uuid ? obj : m,
                    );
                },
            );

            onOpenChange(false);
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        },
    });

    const onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            updateMutation.reset();

            // Run the mutation
            updateMutation.mutate({
                machine_uuid: machine.uuid,
                instances: localInstances,
            });
        },
        [hasEdits, updateMutation, localInstances],
    );

    function wrapEdit<P extends keyof TMachineInstance>(i: number, prop: P) {
        return (val: TMachineInstance[P]) => {
            if (!localInstances[i]) {
                localInstances[i] = {
                    uuid: crypto.randomUUID(),
                    name: "",
                    status: MACHINE_STATUS_TYPE.ONLINE,
                    reserved: machine.reservable ? false : undefined,
                };
            }

            localInstances[i][prop] = val;
            setLocalInstances([...localInstances]); // update the instance list
            setHasEdits(true);
        };
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="5xl"
            className="overflow-y-auto max-h-[80%]"
        >
            <ModalContent className="max-h-[80%] overflow-y-auto">
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4 overflow-auto"
                    >
                        <div className="flex text-lg gap-5 font-semibold">
                            {editable == MACHINE_EDIT_LEVEL.FULL ||
                            editable == MACHINE_EDIT_LEVEL.STATUS_ALL
                                ? `Edit Statuses:`
                                : "Statuses:"}
                            <span className="text-primary-300">
                                {machine.name}
                            </span>
                        </div>
                        <div className="flex flex-col gap-4 overflow-auto h-full w-full">
                            {localInstances.map((instance, i) => (
                                <InstanceRow
                                    key={instance.uuid}
                                    machine={machine}
                                    instance={instance}
                                    index={i}
                                    wrapEdit={wrapEdit}
                                    deleteIndex={(i) => {
                                        localInstances.splice(i, 1); // remove the instance
                                        setLocalInstances([...localInstances]);
                                        setHasEdits(true);
                                    }}
                                    editable={editable}
                                    styles={styles}
                                />
                            ))}
                        </div>

                        {(editable == MACHINE_EDIT_LEVEL.STATUS_ALL ||
                            editable == MACHINE_EDIT_LEVEL.FULL) && (
                            <div className="flex flex-row gap-2 justify-between w-full">
                                <Button
                                    variant="shadow"
                                    type="submit"
                                    color="primary"
                                    className="w-full sm:w-auto"
                                    isDisabled={!hasEdits}
                                    isLoading={updateMutation.isPending}
                                >
                                    Submit
                                </Button>
                                <span className="flex gap-2">
                                    {editable == MACHINE_EDIT_LEVEL.FULL && (
                                        <Button
                                            color="primary"
                                            className="p-2 min-w-fit sm:w-1/3"
                                            isLoading={false}
                                            onPress={() => {
                                                setLocalInstances([
                                                    ...localInstances,
                                                    {
                                                        uuid: crypto.randomUUID(),
                                                        name: "",
                                                        status: MACHINE_STATUS_TYPE.ONLINE,
                                                        reserved:
                                                            machine.reservable
                                                                ? false
                                                                : undefined,
                                                    },
                                                ]); // add an empty instance
                                                setHasEdits(true);
                                            }}
                                        >
                                            <PlusIcon className="size-6" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={onClose}
                                    >
                                        Cancel
                                    </Button>
                                </span>
                            </div>
                        )}
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}
