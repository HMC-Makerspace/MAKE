import {
    Button,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    useDisclosure,
} from "@heroui/react";
import {
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_TYPE,
    TMachine,
    MACHINE_EDIT_LEVEL,
} from "../../../../../common/machine";
import clsx from "clsx";
import MAKETable from "../../../Table";
import EditStatusModal from "./EditStatusModal";

/**
 * Styles for machine statuses
 */
const MACHINE_STATUS_STYLES = {
    [MACHINE_STATUS_TYPE.OFFLINE]: "bg-danger-300 text-danger-foreground",
    [MACHINE_STATUS_TYPE.ONLINE]: "bg-success-300 text-success-foreground",
    [MACHINE_STATUS_TYPE.FLAGGED_FOR_REPAIR]:
        "bg-secondary-300 text-secondary-foreground",
    [MACHINE_STATUS_TYPE.IN_REPAIR]: "bg-warning-300 text-warning-foreground",
} as const;

function StatusModal({
    machine,
    editable,
    isOpen,
    onOpenChange,
}: {
    machine: TMachine;
    editable: MACHINE_EDIT_LEVEL;
    isOpen: boolean;
    onOpenChange: () => void;
}) {
    const instance_columns = [
        {
            name: "Name",
            id: "name",
        },
        {
            name: "Status",
            id: "status",
        },
        {
            name: "Available",
            id: "available",
        },
        {
            name: "Message",
            id: "message",
        },
        {
            name: "Associated Item",
            id: "associated_item",
            hidden: editable != "full",
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            classNames={{
                base: "max-w-full w-fit",
            }}
        >
            <ModalContent>
                <ModalHeader className="gap-5">
                    {editable == "full" || editable == "statusAll"
                        ? `Edit Statuses:`
                        : "Statuses:"}
                    <span className="text-primary-300">{machine.name}</span>
                </ModalHeader>
                <ModalBody>
                    <MAKETable
                        content={machine.instances}
                        columns={instance_columns}
                        visibleColumns={
                            new Set(instance_columns.map((ic) => ic.id))
                        }
                        multiSelect={false}
                        isLoading={false}
                        customColumnComponents={{
                            name: (instance) => (
                                <span className="font-semibold text-foreground-300">
                                    {instance.name}
                                </span>
                            ),
                            status: (instance) => (
                                <Chip
                                    radius="md"
                                    className={clsx(
                                        "max-w-full w-full",
                                        MACHINE_STATUS_STYLES[instance.status],
                                    )}
                                    classNames={{
                                        content: "flex flex-row justify-around",
                                    }}
                                >
                                    <span className="hidden lg:block">
                                        {
                                            MACHINE_STATUS_LABELS[
                                                instance.status
                                            ].short_label
                                        }
                                    </span>
                                </Chip>
                            ),
                        }}
                        color="primary"
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default function MachineStatus({
    machine,
    editable,
}: {
    machine: TMachine;
    editable: MACHINE_EDIT_LEVEL;
}) {
    // Failsafe for if the machine has no statuses
    if (editable != MACHINE_EDIT_LEVEL.FULL && machine.count <= 0) {
        return <></>;
    }
    const max_count = 24; // best limit for display purposes

    // const [isOpen, setIsOpen] = useState(false);

    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Button
                className={clsx(
                    "w-full h-[110px] flex flex-col opacity-100",
                    "rounded-md justify-start items-start",
                    "bg-default-100 py-2 px-2 mt-2 gap-1",
                    (!machine.documents || machine.documents.length == 0) &&
                        editable != MACHINE_EDIT_LEVEL.FULL &&
                        "md:h-[158px]",
                )}
                size="lg"
                isDisabled={editable === MACHINE_EDIT_LEVEL.STATIC}
                onPress={onOpen}
            >
                <div className="font-semibold text-default-600">
                    {machine.count > 1 ? "Statuses" : "Status"}
                </div>
                {machine.count == 0 && (
                    <div className="w-full h-full text-default-500 content-center -mt-5">
                        Click to add statuses
                    </div>
                )}
                {machine.count == 1 && (
                    <Chip
                        radius="sm"
                        className={clsx(
                            "min-w-full h-full text-xl",
                            MACHINE_STATUS_STYLES[machine.instances[0].status],
                        )}
                    >
                        {
                            MACHINE_STATUS_LABELS[machine.instances[0].status]
                                .label
                        }
                    </Chip>
                )}
                {/* If count > 1 and <= max_count, show status as a grid of colored boxes */}
                {machine.count > 1 && machine.count <= max_count && (
                    <div className="w-full grid p-2 gap-4 grid-cols-12 grid-rows-2">
                        {machine.instances.map((instance, i) => (
                            <span
                                key={`machine-${machine.uuid}-big-status-${i}-${machine.uuid}`}
                                className={clsx(
                                    "size-4 rounded-sm",
                                    MACHINE_STATUS_STYLES[instance.status],
                                )}
                            />
                        ))}
                    </div>
                )}
                {/* If count > max_count, show statuses as bin counts */}
                {machine.count > max_count && (
                    <div
                        className={clsx(
                            "w-full grid grid-rows-2 grid-cols-2 h-full gap-2",
                            machine.count <= max_count && "hidden",
                        )}
                    >
                        {MACHINE_STATUS_LABELS.map((status) => (
                            <Chip
                                key={`machine-${machine.uuid}-status-${status.key}`}
                                radius="md"
                                className={clsx(
                                    "max-w-full",
                                    MACHINE_STATUS_STYLES[status.key],
                                )}
                                classNames={{
                                    content: "flex flex-row justify-around",
                                }}
                            >
                                <span className="hidden lg:block">{`${status.short_label}: `}</span>
                                {`${machine.instances.filter((l) => l.status === status.key).length} / ${machine.count}`}
                            </Chip>
                        ))}
                    </div>
                )}
            </Button>
            <EditStatusModal
                machine={machine}
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                editable={editable}
                styles={MACHINE_STATUS_STYLES}
            />
        </>
    );
}
