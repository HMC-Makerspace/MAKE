import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";

import { UUID } from "common/global";
import { InventoryItemUUID, ITEM_ROLE, TInventoryItem } from "../../../../../common/inventory";

export default function KitEditorModal<
    // Allow any type that has a uuid and optional required_certs list
    T extends { uuid: UUID; kit_contents?: InventoryItemUUID[] },
>({
    element,
    items,
    isOpen,
    onOpenChange,
    kitPatchMutation,
    contentPatchMutation,
}: {
    element: T;
    items: TInventoryItem[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    kitPatchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                kit_contents?: InventoryItemUUID[];
            };
        }
    >;
    contentPatchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                parent_kit?: InventoryItemUUID;
            };
        }
    >;
}) {
    items = items.filter(itm => 
        itm.role == ITEM_ROLE.MATERIAL ||
        itm.role == ITEM_ROLE.TOOL ||
        itm.role == ITEM_ROLE.MACHINE
    );

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [currentContents, setCurrentContents] = React.useState<
        InventoryItemUUID[]
    >(element.kit_contents || []);
    const [removedContents, setRemovedContents] = React.useState<InventoryItemUUID[]>([]);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            // Update "parent_kit" attribute of each (added or removed) item

            for (const content of currentContents) {
                contentPatchMutation.reset();
                contentPatchMutation.mutate({
                    uuid: content,
                    patch: { parent_kit: element.uuid },
                });
            }

            for (const content of removedContents) {
                contentPatchMutation.reset();
                contentPatchMutation.mutate({
                    uuid: content,
                    patch: { parent_kit: "" },
                });
            }

            kitPatchMutation.reset();

            // Run the mutation
            kitPatchMutation.mutate({
                uuid: element.uuid,
                patch: { kit_contents: currentContents },
            });

            onOpenChange(false);
            setHasEdits(false);
        },
        [kitPatchMutation, contentPatchMutation, hasEdits, currentContents, removedContents, element.uuid],
    );

    function wrapEdit( i: number ) {
        return (val: any) => {
            let oldContent = currentContents[i];
            currentContents[i] = val as InventoryItemUUID;
            setCurrentContents([...currentContents]); // update the instance list

            // if not being set for the first time
            if (oldContent != "") {
                removedContents.push(oldContent); // old item has been removed from the kit
                setRemovedContents(removedContents.filter(c => !currentContents.includes(c))); // if a prev removed item was added back, it shouldn't be marked removed
            }

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
                                    <Autocomplete
                                        label="Item"
                                        name={`item-${i}`}
                                        placeholder="Search for an item..."
                                        defaultSelectedKey={content}
                                        onSelectionChange={wrapEdit(i)}
                                        disabledKeys={[...currentContents.filter((c, j) => j != i), ...(items.filter(itm => itm.parent_kit != "" && itm.parent_kit != element.uuid) as any[])]}
                                        variant="faded"
                                        color="primary"
                                        size="md"
                                        isRequired={true}
                                        
                                        // classNames={{
                                        //     input: clsx([
                                        //         "placeholder:text-default-500",
                                        //         "placeholder:italic",
                                        //         "text-default-700",
                                        //     ]),
                                        // }}
                                    >
                                        {items.map((itm) => (
                                            <AutocompleteItem key={itm.uuid}>{itm.name}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>

                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={() => {
                                            removedContents.push(currentContents[i]);
                                            setRemovedContents([...removedContents]);
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
                                isLoading={kitPatchMutation.isPending || contentPatchMutation.isPending}
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
