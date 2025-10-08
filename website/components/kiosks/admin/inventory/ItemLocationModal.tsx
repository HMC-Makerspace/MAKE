import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
    Select,
    SelectItem,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";

import { UUID } from "common/global";
import { TArea } from "common/area";
import { TInventoryItemLocation } from "common/inventory";

export default function ItemLocationModal<
    // Allow any type that has a uuid and optional required_certs list
    T extends { uuid: UUID; locations?: TInventoryItemLocation[] },
>({
    element,
    areas,
    isOpen,
    onOpenChange,
    patchMutation,
}: {
    element: T;
    areas: TArea[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                locations?: TInventoryItemLocation[];
            };
        }
    >;
}) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [currentAreas, setCurrentAreas] = React.useState<
        TInventoryItemLocation[]
    >(element.locations || []);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            // Run the mutation
            patchMutation.mutate({
                uuid: element.uuid,
                patch: { locations: currentAreas },
            });
            onOpenChange(false);
            setHasEdits(false);
        },
        [patchMutation, hasEdits, currentAreas, element.uuid],
    );

    function wrapEdit<P extends keyof TInventoryItemLocation>(
        i: number,
        prop: P,
    ) {
        return (val: TInventoryItemLocation[P]) => {
            if (!currentAreas[i]) {
                currentAreas[i] = {
                    area: "",
                    container: "",
                    specific: ""
                };
            }

            const area = {...currentAreas[i]};
            area[prop] = val;
            const eareas = [...currentAreas];
            eareas[i] = area;
            setCurrentAreas(eareas); // update the instance list
            setHasEdits(true);
        };
    }

    const isValid = React.useMemo(() => {
        for (let i = 0; i < currentAreas.length; i++) {
            if (currentAreas[i].area == "") {
                return false; // invalid edit if either field is empty
            }
        }

        return hasEdits; // otherwise, invalid iff no edits made
    }, [hasEdits, currentAreas]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="xl"
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">
                            Edit Locations
                        </div>

                        {currentAreas.map((area, i) => (
                            <div
                                className="flex flex-col sm:flex-row w-full gap-2 items-top"
                                key={element.uuid + "-area-" + area.area}
                            >
                                <Select<TArea> // this should probably be a separate component
                                    label="Area"
                                    name={"area_" + i}
                                    placeholder="Area"
                                    onSelectionChange={(s) => {
                                        if (s == "all") return;
                                        wrapEdit(
                                            i,
                                            "area",
                                        )(Array.from(s)[0] as string);
                                    }}
                                    defaultSelectedKeys={[
                                        area.area
                                    ]}
                                    isRequired
                                    size="lg"
                                    variant="faded"
                                    color="primary"
                                    labelPlacement="inside"
                                    classNames={{
                                        value: "text-default-500",
                                    }}
                                    itemHeight={45}
                                >
                                    {areas.map((a) => (
                                        <SelectItem
                                            key={a.uuid}
                                            textValue={a.name}
                                            className="h-[45px]"
                                        >
                                            <div>
                                                {
                                                    a.uuid /* todo cert tag here */
                                                }
                                            </div>
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div className="w-full h-full flex gap-2 items-center">
                                    <Input
                                        type="text"
                                        label="Container"
                                        name="container"
                                        placeholder="Container"
                                        defaultValue={(element?.locations || [])[i]?.container}
                                        onValueChange={wrapEdit(i, "container")}
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

                                    <Input
                                        type="text"
                                        label="Specific"
                                        name="specific"
                                        placeholder="Specific"
                                        defaultValue={(element?.locations || [])[i]?.specific}
                                        onValueChange={wrapEdit(i, "specific")}
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
                                            currentAreas.splice(i, 1); // remove that cert
                                            setCurrentAreas([...currentAreas]);
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
                                        setCurrentAreas([
                                            ...currentAreas,
                                            {
                                                area: "",
                                                container: "",
                                                specific: ""
                                            },
                                        ]); // add a copy of the emptyCert template
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
