import {
    Spinner,
    Card,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Link,
    useDisclosure,
    Tooltip,
    addToast
} from "@heroui/react";
import { TUserRole } from "common/user";
import Machine from "../../../../components/kiosks/admin/machines/Machine";
import { TCertification } from "common/certification";
import { TMachine, MACHINE_EDIT_LEVEL } from "../../../../../common/machine";
import clsx from "clsx";
import { AreaUUID, TArea } from "common/area";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EditDocsModal from "../../../EditDocsModal";
import {
    EyeIcon,
    EyeSlashIcon,
    LinkSlashIcon,
    MapPinIcon,
    ShoppingCartIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import VisibilityModal from "./VisibilityModal";
import ReservableAreaModal from "./ReservableAreaModal";
import DeleteModal from "../../../DeleteModal";

const patchArea = async ({
    uuid,
    patch,
}: {
    uuid: AreaUUID;
    patch: Partial<TArea>;
}) => {
    return (
        await axios.patch<TArea>(`/api/v3/area/${uuid}`, {
            partial_area_obj: patch,
        })
    ).data;
};

const deleteArea = async ({ uuid }: { uuid: AreaUUID }) => {
    await axios.delete(`/api/v3/area/${uuid}`);
};

export default function Area({
    area,
    machines,
    certifications,
    roles,
    editable = MACHINE_EDIT_LEVEL.FULL,
}: {
    area: TArea;
    machines: TMachine[];
    certifications: TCertification[];
    roles: TUserRole[];
    editable: MACHINE_EDIT_LEVEL;
}) {
    const queryClient = useQueryClient();
    const patchMutation = useMutation({
        mutationFn: patchArea,
        onSuccess: (obj: TArea) => {
            queryClient.setQueryData(["area", area.uuid], obj);
            queryClient.setQueryData(["area"], (old: TArea[]) => {
                return (old ?? []).map((area) =>
                    area.uuid === obj.uuid ? obj : area,
                );
            });
            editDocsClose();
            addToast({
                title: `Successfully edited area`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteArea,
        onSuccess: (_, variables) => {       
            // queryClient.removeQueries({
            //     queryKey: ["area", variables.uuid],
            // });
            queryClient.setQueryData(["area"], (old: TArea[]) => {
                return (old ?? []).filter(
                    (area) => area.uuid !== variables.uuid,
                );
            });
            addToast({
                title: `Successfully deleted area`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const {
        isOpen: editDocs,
        onOpenChange: editDocsModalOpenChange,
        onOpen: editDocsOpen,
        onClose: editDocsClose,
    } = useDisclosure();

    const {
        isOpen: visibilityModal,
        onOpenChange: visibilityModalOpenChange,
        onOpen: visibilityModalOpen,
    } = useDisclosure();

    const {
        isOpen: reservableModal,
        onOpenChange: reservableModalOpenChange,
        onOpen: reservableModalOpen,
    } = useDisclosure();

    const {
        isOpen: deleteModal,
        onOpenChange: deleteModalOpenChange,
        onOpen: deleteModalOpen,
    } = useDisclosure();

    const fullEdit = editable === MACHINE_EDIT_LEVEL.FULL;
    return (
        <Card
            className={clsx("w-full min-h-fit h-fit p-4 gap-4 relative")}
            shadow="none"
        >
            {!fullEdit && area.reserved && (
                <div
                    className={clsx(
                        "flex gap-1 text-secondary-400 items-center",
                        "ml-auto -mb-4 text-lg",
                        "md:absolute md:top-4 md:right-4",
                    )}
                >
                    <MapPinIcon className="size-5" />
                    Currently Reserved
                </div>
            )}
            <div
                className={clsx(
                    "flex gap-4 flex-col",
                    area.reserved ? "opacity-75" : "",
                )}
            >
                {fullEdit ? (
                    <>
                        <Input
                            placeholder="Area Name"
                            defaultValue={area.name}
                            onBlur={(blurEvent) => {
                                // Get input value
                                const value = blurEvent.target.value;
                                if (value == area.name || !value) {
                                    return; // no update
                                }
                                // Update name of area
                                patchMutation.mutate({
                                    uuid: area.uuid,
                                    patch: {
                                        name: value,
                                    },
                                });
                            }}
                            type="text"
                            size="lg"
                            color="primary"
                            variant="underlined"
                            className="w-full"
                            classNames={{
                                input: clsx(
                                    "placeholder:text-default-400 font-bold",
                                    "text-3xl text-primary-400",
                                ),
                            }}
                            isRequired
                            minLength={1}
                            errorMessage={
                                "Unsaved changes: please enter a name"
                            }
                            endContent={
                                <div className="flex gap-2 sm:gap-3">
                                    <Tooltip
                                        color={
                                            area.visible_to === null
                                                ? "success"
                                                : area.visible_to &&
                                                    area.visible_to.length === 0
                                                  ? "danger"
                                                  : "primary"
                                        }
                                        content={
                                            area.visible_to === null
                                                ? "Visible"
                                                : area.visible_to &&
                                                    area.visible_to.length === 0
                                                  ? "Not Visible"
                                                  : "Partially Visible"
                                        }
                                        placement="bottom-end"
                                    >
                                        <Button
                                            isIconOnly
                                            startContent={
                                                area.visible_to &&
                                                area.visible_to.length === 0 ? (
                                                    <EyeSlashIcon
                                                        className="size-6"
                                                        strokeWidth={1.5}
                                                    />
                                                ) : (
                                                    <EyeIcon
                                                        className="size-6"
                                                        strokeWidth={1.5}
                                                    />
                                                )
                                            }
                                            color={
                                                area.visible_to === null
                                                    ? "success"
                                                    : area.visible_to &&
                                                        area.visible_to
                                                            .length === 0
                                                      ? "danger"
                                                      : "primary"
                                            }
                                            variant="bordered"
                                            onPress={visibilityModalOpen}
                                        />
                                    </Tooltip>
                                    <VisibilityModal
                                        area={area}
                                        roles={roles}
                                        isOpen={visibilityModal}
                                        onOpenChange={visibilityModalOpenChange}
                                        patchMutation={patchMutation}
                                    />
                                    <Tooltip
                                        color={
                                            area.reservable
                                                ? "success"
                                                : "danger"
                                        }
                                        content={
                                            area.reservable
                                                ? "Reservable"
                                                : "Not reservable"
                                        }
                                        placement="bottom-end"
                                    >
                                        <Button
                                            isIconOnly
                                            className="-mr-1"
                                            startContent={
                                                area.reservable ? (
                                                    <ShoppingCartIcon
                                                        className="size-6 text-success"
                                                        strokeWidth={1.5}
                                                    />
                                                ) : (
                                                    <LinkSlashIcon
                                                        className="size-6 text-danger"
                                                        strokeWidth={1.5}
                                                    />
                                                )
                                            }
                                            color={
                                                area.reservable
                                                    ? "success"
                                                    : "danger"
                                            }
                                            variant="bordered"
                                            onPress={reservableModalOpen}
                                        />
                                    </Tooltip>
                                    <ReservableAreaModal
                                        area={area}
                                        roles={roles}
                                        certifications={certifications}
                                        isOpen={reservableModal}
                                        onOpenChange={reservableModalOpenChange}
                                        patchMutation={patchMutation}
                                    />
                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={deleteModalOpen}
                                        isIconOnly
                                    >
                                        <TrashIcon className="size-6" />
                                    </Button>
                                    <DeleteModal
                                        itemType="area"
                                        itemName={area.name}
                                        onSubmit={() =>
                                            deleteMutation.mutate({
                                                uuid: area.uuid,
                                            })
                                        }
                                        isOpen={deleteModal}
                                        onOpenChange={deleteModalOpenChange}
                                        isLoading={deleteMutation.isPending}
                                    />
                                </div>
                            }
                        />
                    </>
                ) : (
                    <h1 className="w-full text-3xl font-bold text-primary-400 p-1 break-words">
                        {area.name}
                    </h1>
                )}
                {fullEdit ? (
                    <Textarea
                        placeholder="Area description..."
                        defaultValue={area.description}
                        onBlur={(blurEvent) => {
                            // Get input value
                            const value = blurEvent.target.value;
                            if (value == area.description) {
                                return; // no update
                            }
                            // Update description
                            patchMutation.mutate({
                                uuid: area.uuid,
                                patch: {
                                    description: value,
                                },
                            });
                        }}
                        color="primary"
                        variant="bordered"
                        className="w-full"
                        size="lg"
                        minRows={1}
                        classNames={{
                            input: clsx(
                                "placeholder:text-default-400 text-lg",
                                "text-default-700 p-1",
                            ),
                            inputWrapper: "p-1",
                        }}
                    />
                ) : (
                    area.description && (
                        <div className="w-full text-lg grow p-1 text-default-700 break-words">
                            {area.description}
                        </div>
                    )
                )}
                {fullEdit ? (
                    <>
                        <Button
                            variant="shadow"
                            className={clsx(
                                "bg-content2 h-[64px] text-lg",
                                "font-semibold md:mx-8",
                            )}
                            onPress={editDocsOpen}
                        >
                            Edit Documents
                            {area.documents
                                ? ` (${area.documents.length})`
                                : " (0)"}
                        </Button>
                        <EditDocsModal
                            key={"areaDocEdit-" + area.uuid}
                            element={area}
                            isOpen={editDocs}
                            onOpenChange={editDocsModalOpenChange}
                            patchMutation={patchMutation}
                        />
                    </>
                ) : (
                    area.documents &&
                    area.documents.length > 0 && (
                        <div
                            className={clsx(
                                "md:mx-8 p-3 md:p-5 gap-3 rounded-lg bg-content2",
                                "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                            )}
                        >
                            {area.documents!.map((doc, i) => (
                                <Button
                                    key={`area-${area.uuid}-doc-${i}`}
                                    color="primary"
                                    variant="shadow"
                                    className=""
                                    href={doc.link}
                                    as={Link}
                                    isExternal
                                >
                                    {doc.name}
                                </Button>
                            ))}
                        </div>
                    )
                )}
                {fullEdit ? (
                    <Select<TMachine>
                        name="equipment"
                        defaultSelectedKeys={area.equipment}
                        onSelectionChange={(keys) => {
                            if (!keys) {
                                patchMutation.mutate({
                                    uuid: area.uuid,
                                    patch: {
                                        equipment: [],
                                    },
                                });
                            }
                            if (keys === "all") {
                                patchMutation.mutate({
                                    uuid: area.uuid,
                                    patch: {
                                        equipment: machines.map((m) => m.uuid),
                                    },
                                });
                            } else {
                                patchMutation.mutate({
                                    uuid: area.uuid,
                                    patch: {
                                        equipment: Array.from(keys) as string[],
                                    },
                                });
                            }
                        }}
                        selectionMode="multiple"
                        isMultiline
                        placeholder="Select equipment..."
                        size="lg"
                        variant="faded"
                        color="primary"
                        label="Equipment"
                        aria-label={"Certification Selection"}
                        labelPlacement="inside"
                        className=""
                        classNames={{
                            value: "text-default-500 min-h-[48px] content-center",
                        }}
                        itemHeight={45}
                        renderValue={(selectedKeys) => {
                            if (selectedKeys.length === 0) {
                                // If no machines are selected, show the placeholder
                                return "";
                            } else {
                                return (
                                    // Otherwise, show the selected machines in a flexbox
                                    <div className="flex flex-wrap gap-1 p-2">
                                        {selectedKeys.map((m, i) => {
                                            if (!m.key || !m.textValue) return;
                                            const machine = machines.find(
                                                (mach) => mach.uuid === m.key,
                                            );
                                            if (!machine)
                                                return (
                                                    <div
                                                        key={`area-${area.uuid}-machine-${i}`}
                                                        className="flex flex-col h-[45px] w-full py-1"
                                                    >
                                                        <div className="flex flex-row gap-2 items-center">
                                                            <h1 className="text-md font-bold text-danger-500">
                                                                Unknown Machine
                                                            </h1>
                                                        </div>
                                                        <p className="text-sm text-foreground-300">
                                                            {m.textValue}
                                                        </p>
                                                    </div>
                                                );
                                            return (
                                                <div
                                                    key={`area-${area.uuid}-machine-${i}`}
                                                    className="flex flex-col h-[50px] w-full py-1"
                                                >
                                                    <div className="w-full flex flex-row gap-2 items-center">
                                                        <h1 className="text-md font-bold text-foreground-500">
                                                            {machine.name}
                                                        </h1>
                                                    </div>
                                                    <p className="text-sm text-foreground-300 truncate">
                                                        {machine.description}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            }
                        }}
                    >
                        {machines.map((m) => (
                            <SelectItem
                                key={m.uuid}
                                textValue={m.name}
                                classNames={{
                                    wrapper: "w-11/12",
                                    title: "text-medium font-semibold text-default-700",
                                    description: "text-default-600",
                                }}
                                title={m.name}
                                description={m.description}
                            >
                                {/* <div className="flex flex-col h-[45px] w-11/12 py-1">
                                <div className="w-full flex flex-row gap-2 items-center">
                                    <h1 className="text-md font-bold text-foreground-500">
                                        {m.name}
                                    </h1>
                                </div>
                                <p className="w-full text-sm text-foreground-300 text-ellipsis truncate">
                                    {m.description}
                                </p>
                            </div> */}
                            </SelectItem>
                        ))}
                    </Select>
                ) : (
                    <div
                        className={clsx(
                            "w-full min-h-fit overflow-auto",
                            "gap-4 grid grid-cols-1",
                            "md:grid-cols-2 3xl:grid-cols-3",
                        )}
                    >
                        {area.equipment &&
                            area.equipment.map((machine_uuid, i) => {
                                const machine = machines.find(
                                    (m) => m.uuid === machine_uuid,
                                );
                                if (machine) {
                                    return (
                                        <Machine
                                            key={`area-${area.uuid}-machine-${i}-${machine_uuid}`}
                                            machine={machine}
                                            roles={roles}
                                            certifications={certifications}
                                            editable={editable}
                                        />
                                    );
                                } else {
                                    return <div key={machine_uuid}></div>;
                                }
                            })}
                    </div>
                )}
            </div>
        </Card>
    );
}
