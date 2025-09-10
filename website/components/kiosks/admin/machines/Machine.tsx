import {
    Button,
    Card,
    Input,
    Link,
    Textarea,
    Tooltip,
    useDisclosure,
} from "@heroui/react";
import { TUserRole } from "common/user";
import clsx from "clsx";
import {
    MachineUUID,
    TMachine,
    MACHINE_EDIT_LEVEL,
} from "../../../../../common/machine";
import { TCertification } from "common/certification";
import ImageCarousel from "../../../ImageCarousel";
import { FILE_RESOURCE_TYPE } from "../../../../../common/file";
import MachineStatus from "./MachineStatus";
import EditDocsModal from "../../../EditDocsModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    DocumentIcon,
    LinkSlashIcon,
    PencilSquareIcon,
    ShoppingCartIcon,
    TrashIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";
import CertificationTag from "../certifications/CertificationTag";
import ReservableConfirmationModal from "./ReservableConfirmationModal";
import RequiredCertsModal from "../certifications/RequiredCertsModal";
import AuthorizedRolesModal from "../certifications/AuthorizedRolesModal";
import DeleteModal from "../../../DeleteModal";

const patchMachine = async ({
    uuid,
    patch,
}: {
    uuid: MachineUUID;
    patch: Partial<TMachine>;
}) => {
    return (
        await axios.patch<TMachine>(`/api/v3/machine/${uuid}`, {
            partial_machine_obj: patch,
        })
    ).data;
};

const deleteMachine = async ({ uuid }: { uuid: MachineUUID }) => {
    await axios.delete(`/api/v3/machine/${uuid}`);
};

export default function Machine({
    machine,
    roles,
    certifications,
    editable = MACHINE_EDIT_LEVEL.STATIC,
}: {
    machine: TMachine;
    roles: TUserRole[];
    certifications: TCertification[];
    editable?: MACHINE_EDIT_LEVEL;
}) {
    const {
        isOpen: editDocs,
        onOpenChange: editDocsModalOpenChange,
        onOpen: editDocsOpen,
        onClose: editDocsClose,
    } = useDisclosure();

    const {
        isOpen: reservableModal,
        onOpenChange: reservableModalOpenChange,
        onOpen: reservableModalOpen,
        onClose: reservableModalClose,
    } = useDisclosure();

    const {
        isOpen: certModal,
        onOpenChange: certModalOpenChange,
        onOpen: certModalOpen,
    } = useDisclosure();

    const {
        isOpen: roleModal,
        onOpenChange: roleModalOpenChange,
        onOpen: roleModalOpen,
    } = useDisclosure();

    const {
        isOpen: deleteModal,
        onOpenChange: deleteModalOpenChange,
        onOpen: deleteModalOpen,
    } = useDisclosure();

    const queryClient = useQueryClient();
    const patchMutation = useMutation({
        mutationFn: patchMachine,
        onSuccess: (obj: TMachine) => {
            queryClient.setQueryData(["machine", machine.uuid], obj);
            queryClient.setQueryData(["machine"], (old: TMachine[]) => {
                return (old ?? []).map((machine) =>
                    machine.uuid === obj.uuid ? obj : machine,
                );
            });

            editDocsClose();
            reservableModalClose();
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMachine,
        onSuccess: (_, variables) => {
            queryClient.removeQueries({
                queryKey: ["machine", variables.uuid],
            });
            queryClient.setQueryData(["machine"], (old: TMachine[]) => {
                return (old ?? []).filter((m) => m.uuid !== variables.uuid);
            });
        },
        onError: (error) => {
            alert(`Error: ${error.message}`);
        },
    });

    const fullEdit = editable == MACHINE_EDIT_LEVEL.FULL;

    return (
        <Card
            className="bg-default-200 w-full h-full p-2 flex-col gap-2"
            shadow="sm"
        >
            <div className="w-full h-fit flex flex-col sm:flex-row gap-2 flex-1">
                <div
                    className={clsx(
                        "w-full h-full min-h-[250px] bg-default-300 rounded-md relative",
                        !fullEdit &&
                            (!machine.required_certifications ||
                                machine.required_certifications.length == 0) &&
                            (!machine.images || machine.images.length == 0) &&
                            "hidden md:inline",
                    )}
                >
                    <ImageCarousel
                        resource_type={FILE_RESOURCE_TYPE.MACHINE}
                        resource_uuid={machine.uuid}
                        editable={fullEdit}
                    />

                    <div className="absolute w-full h-fit top-0 box-border border-4 border-transparent z-20">
                        <div className="w-full h-fit p-1 overflow-auto">
                            {fullEdit ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="bordered"
                                        color="primary"
                                        startContent={
                                            <PencilSquareIcon className="size-6" />
                                        }
                                        className="text-md bg-primary-200/30 backdrop-blur-[8px] rounded-sm gap-1 px-1.5"
                                        onPress={certModalOpen}
                                    >
                                        Required Certifications
                                        {machine.required_certifications &&
                                        machine.required_certifications.length >
                                            0
                                            ? ` (${machine.required_certifications.length})`
                                            : ""}
                                    </Button>
                                    <RequiredCertsModal
                                        element={machine}
                                        certifications={certifications}
                                        isOpen={certModal}
                                        onOpenChange={certModalOpenChange}
                                        patchMutation={patchMutation}
                                    />
                                </>
                            ) : (
                                <div className="min-w-max flex flex-row gap-2">
                                    {machine.required_certifications &&
                                        machine.required_certifications.map(
                                            (cert) => (
                                                <CertificationTag
                                                    key={
                                                        cert.certification_uuid
                                                    }
                                                    cert_uuid={
                                                        cert.certification_uuid
                                                    }
                                                    certifications={
                                                        certifications
                                                    }
                                                    level={
                                                        cert.required_level > 0
                                                            ? cert.required_level
                                                            : undefined
                                                    }
                                                />
                                            ),
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-full justify-between">
                    {fullEdit ? (
                        <>
                            <Input
                                placeholder="Machine Name"
                                defaultValue={machine.name}
                                onBlur={(blurEvent) => {
                                    // Get input value
                                    const value = blurEvent.target.value;
                                    if (value == machine.name || !value) {
                                        return; // no update
                                    }
                                    // Update name of machine
                                    patchMutation.mutate({
                                        uuid: machine.uuid,
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
                                    input: "placeholder:text-default-400 font-bold text-xl text-default-800 ",
                                }}
                                isRequired
                                minLength={1}
                                errorMessage={
                                    "Unsaved changes: please enter a name"
                                }
                                endContent={
                                    <div className="flex gap-3">
                                        <Tooltip
                                            color={
                                                machine.reservable
                                                    ? "success"
                                                    : "danger"
                                            }
                                            content={
                                                machine.reservable
                                                    ? "Reservable"
                                                    : "Not reservable"
                                            }
                                            placement="left"
                                        >
                                            <Button
                                                isIconOnly
                                                className="-mr-1"
                                                startContent={
                                                    machine.reservable ? (
                                                        <ShoppingCartIcon
                                                            className="size-6"
                                                            strokeWidth={1.5}
                                                        />
                                                    ) : (
                                                        <LinkSlashIcon
                                                            className="size-6"
                                                            strokeWidth={1.5}
                                                        />
                                                    )
                                                }
                                                color={
                                                    machine.reservable
                                                        ? "success"
                                                        : "danger"
                                                }
                                                variant="bordered"
                                                onPress={reservableModalOpen}
                                            />
                                        </Tooltip>
                                        <Button
                                            variant="flat"
                                            color="danger"
                                            onPress={deleteModalOpen}
                                            isIconOnly
                                        >
                                            <TrashIcon className="size-6" />
                                        </Button>
                                        <DeleteModal
                                            itemType="machine"
                                            itemName={machine.name}
                                            onSubmit={() =>
                                                deleteMutation.mutate({
                                                    uuid: machine.uuid,
                                                })
                                            }
                                            isOpen={deleteModal}
                                            onOpenChange={deleteModalOpenChange}
                                            isLoading={deleteMutation.isPending}
                                        />
                                    </div>
                                }
                            />
                            <ReservableConfirmationModal
                                key={"machineReservableModal-" + machine.uuid}
                                machine={machine}
                                reservable={machine.reservable ?? false}
                                isOpen={reservableModal}
                                onOpenChange={reservableModalOpenChange}
                                patchMutation={patchMutation}
                            />
                        </>
                    ) : (
                        <div className="w-full font-bold text-xl p-1 pb-3 text-default-800">
                            {machine.name}
                        </div>
                    )}
                    {fullEdit ? (
                        <Textarea
                            placeholder="Machine description..."
                            defaultValue={machine.description}
                            onBlur={(blurEvent) => {
                                // Get input value
                                const value = blurEvent.target.value;
                                if (value == machine.description || !value) {
                                    return; // no update
                                }
                                // Update description
                                patchMutation.mutate({
                                    uuid: machine.uuid,
                                    patch: {
                                        description: value,
                                    },
                                });
                            }}
                            color="primary"
                            variant="bordered"
                            className="w-full h-full"
                            size="lg"
                            maxRows={12}
                            classNames={{
                                input: "placeholder:text-default-400 text-lg text-default-700",
                                inputWrapper: "p-1",
                            }}
                        />
                    ) : (
                        <div className="w-full text-lg grow p-1 text-default-700 min-h-24 break-words">
                            {machine.description}
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full h-fit flex flex-col items-center">
                <MachineStatus machine={machine} editable={editable} />
                {fullEdit ? (
                    <div className="flex flex-row gap-2 w-full self-center mt-2">
                        <Button
                            color="primary"
                            className="w-4/5 sm:w-full md:w-4/5 lg:w-full self-center"
                            startContent={<DocumentIcon className="size-6" />}
                            onPress={editDocsOpen}
                        >
                            Documents
                            {machine.documents && machine.documents.length > 0
                                ? ` (${machine.documents.length})`
                                : ""}
                        </Button>
                        <Button
                            color="warning"
                            className="w-full px-2"
                            startContent={<UserCircleIcon className="size-7" />}
                            onPress={roleModalOpen}
                        >
                            Authorized Roles
                            {machine.authorized_roles
                                ? ` (${machine.authorized_roles.length})`
                                : ""}
                        </Button>
                        <EditDocsModal
                            key={"machineDocEdit-" + machine.uuid}
                            element={machine}
                            isOpen={editDocs}
                            onOpenChange={editDocsModalOpenChange}
                            patchMutation={patchMutation}
                        />
                        <AuthorizedRolesModal
                            element={machine}
                            roles={roles}
                            isOpen={roleModal}
                            onOpenChange={roleModalOpenChange}
                            patchMutation={patchMutation}
                        />
                    </div>
                ) : (
                    machine.documents && (
                        <div
                            className={clsx(
                                "self-center w-4/5 gap-3 flex flex-row",
                                !machine.documents ||
                                    machine.documents.length == 0
                                    ? ""
                                    : "mt-2",
                            )}
                        >
                            {machine.documents.length <= 2 ? (
                                machine.documents.map((doc, i) => (
                                    <Button
                                        key={`machine-${machine.uuid}-doc-${i}`}
                                        color="primary"
                                        className="w-full"
                                        href={doc.link}
                                        as={Link}
                                        isExternal
                                    >
                                        {doc.name}
                                    </Button>
                                ))
                            ) : (
                                // TODO: Show all documents
                                <Button color="primary" className="w-full">
                                    View Documents
                                </Button>
                            )}
                        </div>
                    )
                )}
            </div>
        </Card>
    );
}
