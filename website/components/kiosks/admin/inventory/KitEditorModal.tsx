import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";

import { UUID } from "common/global";
import { InventoryItemUUID } from "common/inventory";

export default function KitEditorModal<
    // Allow any type that has a uuid and optional required_certs list
    T extends { uuid: UUID; kit_contents?: InventoryItemUUID[] },
>({
    element,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    element: T;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                kit_contents?: InventoryItemUUID[];
            };
        }
    >;
}) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [currentContents, setCurrentContents] = React.useState<
        InventoryItemUUID[]
    >(element.kit_contents || []);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            // Run the mutation
            patchMutation.mutate({
                uuid: element.uuid,
                patch: { kit_contents: currentContents },
            });
            onOpenChange(false);
            setHasEdits(false);
        },
        [patchMutation, hasEdits, currentContents, element.uuid],
    );

    function wrapEdit( i: number ) {
        return (val: InventoryItemUUID) => {
            currentContents[i] = val;
            setCurrentContents([...currentContents]); // update the instance list
            setHasEdits(true);
        };
    }

    const isValid = React.useMemo(() => {
        for (let i = 0; i < currentContents.length; i++) {
            if (currentContents[i] == "") {
                return false; // invalid edit if either field is empty
            }
        }

        return hasEdits; // otherwise, valid iff edits made
    }, [hasEdits, currentContents]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="3xl"
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">
                            Edit Kit Contents
                        </div>

                        {currentContents.map((content, i) => (
                            <div
                                className="flex flex-col sm:flex-row w-full gap-2 items-top"
                                key={element.uuid + "-item-" + i + "-oo-" + currentContents.length}
                            >

                                <div className="w-full h-full flex flex-row gap-2 items-center">
                                    <Input
                                        type="text"
                                        label="UUID"
                                        name="uuid"
                                        placeholder="UUID"
                                        defaultValue={content}
                                        onValueChange={wrapEdit(i)}
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

                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={() => {
                                            currentContents.splice(i, 1); // remove that cert
                                            setCurrentContents([...currentContents]);
                                            setHasEdits(true);
                                        }}
                                        isIconOnly
                                    >
                                        <TrashIcon className="size-6" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={patchMutation.isPending}
                            >
                                Submit
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    className="p-2 min-w-fit sm:w-1/3"
                                    onPress={() => {
                                        setCurrentContents([...currentContents, ""]); // add a copy of the emptyCert template
                                        setHasEdits(true);
                                    }}
                                >
                                    <PlusIcon className="size-6" />
                                </Button>
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}
