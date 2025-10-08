import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    addToast
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { TArea } from "common/area";
import { useState } from "react";

const setAreas = async ({ areas }: { areas: TArea[] }) => {
    return (
        await axios.put<TArea[]>(`/api/v3/area/all`, {
            area_objs: areas,
        })
    ).data;
};

export default function RearrangeAreasModal({
    areas,
    isOpen,
    onOpenChange,
}: {
    areas: TArea[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [orderedAreas, setOrderedAreas] = useState(areas);

    const queryClient = useQueryClient();
    const rearrangeMutation = useMutation({
        mutationFn: setAreas,
        onSuccess: (obj: TArea[]) => {
            queryClient.setQueryData(["area"], obj);
            onOpenChange(false);
            addToast({
                title: `Successfully rearranged areas`,
                timeout: 3000,
                color: "success",
                severity: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                timeout: 3000,
                color: "danger",
                severity: "danger"
            });
        },
    });

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
            <ModalContent>
                <ModalHeader>Areas</ModalHeader>
                <ModalBody>
                    {orderedAreas.map((area, i) => (
                        <div
                            key={`rearrange-${area.uuid}`}
                            className={clsx(
                                "bg-default-200 p-2 w-full rounded-md",
                                "text-lg font-semibold flex flex-row",
                                "gap-3 items-center",
                            )}
                        >
                            <div className="flex flex-col gap-1 w-min">
                                <Button
                                    variant="faded"
                                    isIconOnly
                                    size="sm"
                                    disableRipple
                                    className="size-4 rounded-md border-0"
                                    isDisabled={i === 0}
                                    onPress={() => {
                                        if (i === 0) return;
                                        const newAreas = [...orderedAreas];
                                        newAreas.splice(i, 1);
                                        newAreas.splice(i - 1, 0, area);
                                        setOrderedAreas(newAreas);
                                    }}
                                >
                                    <ChevronUpIcon className="size-3" />
                                </Button>
                                <Button
                                    variant="faded"
                                    isIconOnly
                                    size="sm"
                                    disableRipple
                                    className="size-4 rounded-md border-0"
                                    isDisabled={i === orderedAreas.length - 1}
                                    onPress={() => {
                                        if (i === orderedAreas.length - 1)
                                            return;
                                        const newAreas = [...orderedAreas];
                                        newAreas.splice(i, 1);
                                        newAreas.splice(i + 1, 0, area);
                                        setOrderedAreas(newAreas);
                                    }}
                                >
                                    <ChevronDownIcon className="size-3" />
                                </Button>
                            </div>
                            {area.name}
                        </div>
                    ))}
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        color="primary"
                        isDisabled={orderedAreas.every(
                            (a, i) => a.uuid === areas[i].uuid,
                        )}
                        onPress={() =>
                            rearrangeMutation.mutate({
                                areas: orderedAreas,
                            })
                        }
                    >
                        Submit
                    </Button>
                    <Button
                        color="secondary"
                        variant="flat"
                        onPress={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
