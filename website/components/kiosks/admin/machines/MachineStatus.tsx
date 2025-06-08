import { Button, Chip } from "@heroui/react";
import {
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_TYPE,
    TMachine,
} from "../../../../../common/machine";
import clsx from "clsx";

const status_colors = {
    [MACHINE_STATUS_TYPE.OFFLINE]: "danger",
    [MACHINE_STATUS_TYPE.ONLINE]: "success",
    [MACHINE_STATUS_TYPE.FLAGGED_FOR_REPAIR]: "secondary",
    [MACHINE_STATUS_TYPE.IN_REPAIR]: "warning",
} as const;

export default function MachineStatus({ machine }: { machine: TMachine }) {
    const max_count = 24;
    return (
        <Button
            className={clsx(
                "w-full h-[110px] flex flex-col",
                "rounded-md justify-between items-start",
                "bg-default-100 py-2 px-2 mt-2 gap-1",
            )}
            size="lg"
        >
            <div className="font-semibold text-default-600">Statuses</div>

            <div
                className={clsx(
                    "w-full grid p-2 gap-4 grid-cols-12 grid-rows-2",
                    machine.count > max_count && "hidden",
                )}
            >
                {machine.current_statuses.map((status) => (
                    <Chip
                        color={status_colors[status.status]}
                        size="sm"
                        className="rounded-sm min-h-4 min-w-4 max-h-4 max-w-4"
                    />
                ))}
            </div>
            {/* Count >max_count */}
            <div
                className={clsx(
                    "w-full grid grid-rows-2 grid-cols-2 h-full gap-2",
                    machine.count <= max_count && "hidden",
                )}
            >
                {MACHINE_STATUS_LABELS.map((status) => (
                    <Chip
                        radius="md"
                        color={status_colors[status.key]}
                        className="max-w-full"
                        classNames={{
                            content: "flex flex-row justify-around",
                        }}
                    >
                        <span className="hidden lg:block">{`${status.short_label}: `}</span>
                        {`${machine.current_statuses.filter((l) => l.status === status.key).length} / ${machine.count}`}
                    </Chip>
                ))}
            </div>
        </Button>
    );
}
