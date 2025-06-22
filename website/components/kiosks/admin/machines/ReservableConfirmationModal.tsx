import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Select,
    SelectItem,
    ModalFooter,
    Button,
} from "@heroui/react";
import { UseMutationResult } from "@tanstack/react-query";
import {
    ITEM_ACCESS_DESCRIPTORS,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import { TMachine, MachineUUID } from "common/machine";
import { useState } from "react";

export default function ReservableConfirmationModal({
    machine,
    reservable,
    patchMutation,
    isOpen,
    onOpenChange,
}: {
    machine: TMachine;
    reservable: boolean;
    patchMutation: UseMutationResult<
        TMachine,
        Error,
        {
            uuid: MachineUUID;
            patch: Partial<TMachine>;
        }
    >;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [reservationType, setReservationType] = useState(
        machine.reservation_type,
    );

    const relevantDescriptors = ITEM_ACCESS_DESCRIPTORS.filter(
        (d) =>
            d.type === ITEM_ACCESS_TYPE.CHECKOUT_IN_SPACE ||
            d.type == ITEM_ACCESS_TYPE.CHECKOUT_TAKE_HOME,
    ) as {
        type:
            | ITEM_ACCESS_TYPE.CHECKOUT_IN_SPACE
            | ITEM_ACCESS_TYPE.CHECKOUT_TAKE_HOME;
        label: string;
        description: string;
    }[];

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader className="text-danger-300">
                    Reservable Change Confirmation
                </ModalHeader>
                <ModalBody>
                    {reservable ? (
                        <>
                            Are you sure you want to make this machine
                            non-reservable? The items associated with each
                            instance of this machine will be deleted forever.
                        </>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <span>
                                Are you sure you want to make this machine
                                reservable? This will automatically generate
                                inventory items for each instance of the
                                machine, which can be checked out by users with
                                all required certifications.
                            </span>
                            <span>
                                To continue, please select the availability
                                level to apply to the instances of this machine.
                            </span>
                            <Select
                                items={relevantDescriptors}
                                label="Status"
                                labelPlacement="inside"
                                placeholder="Select a status"
                                className="opacity-100 col-span-3"
                                defaultSelectedKeys={
                                    machine.reservation_type && [
                                        ITEM_ACCESS_DESCRIPTORS[
                                            machine.reservation_type
                                        ].label,
                                    ]
                                }
                                isRequired
                                variant="bordered"
                                color="primary"
                                onSelectionChange={(keys) => {
                                    console.log(keys);
                                    if (keys === "all" || keys.size === 0) {
                                        setReservationType(undefined);
                                        return;
                                    } else {
                                        const selected = Array.from(
                                            keys,
                                        )[0] as string;
                                        const key = relevantDescriptors.find(
                                            (d) => d.label === selected,
                                        );
                                        if (key) setReservationType(key.type);
                                    }
                                }}
                            >
                                {(descriptor) => (
                                    <SelectItem
                                        key={descriptor.label}
                                        textValue={descriptor.label}
                                    >
                                        {descriptor.label}
                                    </SelectItem>
                                )}
                            </Select>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button color="danger" onPress={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        color="success"
                        isDisabled={!reservable && !reservationType}
                        onPress={() =>
                            patchMutation.mutate({
                                uuid: machine.uuid,
                                patch: {
                                    reservable: !!!reservable,
                                    reservation_type: reservationType,
                                },
                            })
                        }
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
