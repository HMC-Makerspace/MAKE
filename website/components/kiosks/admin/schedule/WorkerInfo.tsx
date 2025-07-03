import { ScheduleUUID } from "common/schedule";
import { TShift } from "common/shift";
import { TUser, TUserRole } from "common/user";
import { getUserRoleHierarchy } from "../../../../utils";
import UserRole from "../../../user/UserRole";
import clsx from "clsx";

export default function WorkerInfo({
    worker,
    roles,
    shifts,
    schedule_uuid,
}: {
    worker?: TUser;
    roles: TUserRole[];
    shifts: TShift[];
    schedule_uuid: ScheduleUUID;
}) {
    const statHierarchicalRoles = worker
        ? getUserRoleHierarchy(worker, roles)
        : [];

    const statUserScheduledShifts = shifts.filter(
        (s) => s.assignee === worker?.uuid,
    ).length;

    const statUserMinRequestedShifts = worker?.work_schedules?.find(
        (a) => a.schedule == schedule_uuid,
    )?.min_shift_count;
    const statUserMaxRequestedShifts = worker?.work_schedules?.find(
        (a) => a.schedule == schedule_uuid,
    )?.max_shift_count;

    let statUserShiftStatusColor;
    if (!statUserMinRequestedShifts && !statUserMaxRequestedShifts) {
        statUserShiftStatusColor = "text-secondary-300";
    } else if (
        !statUserMinRequestedShifts ||
        statUserMinRequestedShifts <= statUserScheduledShifts
    ) {
        // Over min requested shift count

        if (
            !statUserMaxRequestedShifts ||
            statUserMaxRequestedShifts >= statUserScheduledShifts
        ) {
            // Over min and under max requested shift count, optimal
            statUserShiftStatusColor = "text-primary-300";
        } else {
            // Over min and also over max requested shift count, bad
            statUserShiftStatusColor = "text-danger-300";
        }
    } else {
        // Under min requested shift count
        if (
            !statUserMaxRequestedShifts ||
            statUserMaxRequestedShifts >= statUserScheduledShifts
        ) {
            // Under min and over max... something is wrong
            statUserShiftStatusColor = "text-warning-300";
        } else {
            // Under min and under max, not the end of the world
            statUserShiftStatusColor = "text-danger-200";
        }
    }

    return worker ? (
        <div className="p-1 pr-0 flex flex-col gap-1">
            <div className="flex flex-row gap-4 justify-between items-center">
                <span key="name" className="font-bold text-medium">
                    {worker.name}
                </span>
                <UserRole role_uuid={statHierarchicalRoles[0].uuid} />
            </div>
            <div
                className={clsx(
                    "flex flex-row gap-1 font-bold",
                    statUserShiftStatusColor,
                )}
            >
                {statUserScheduledShifts}
                <span>scheduled shifts</span>
            </div>
            <div className="flex flex-row gap-1">
                <span>Requested shift range:</span>
                <span
                    className={clsx(
                        "font-semibold",
                        statUserMinRequestedShifts
                            ? "text-primary-300"
                            : "text-secondary-300",
                    )}
                >
                    {statUserMinRequestedShifts ?? "?"}
                </span>
                <span className="font-thin">-</span>
                <span
                    className={clsx(
                        "font-semibold",
                        statUserMaxRequestedShifts
                            ? "text-primary-300"
                            : "text-secondary-300",
                    )}
                >
                    {statUserMaxRequestedShifts ?? "?"}
                </span>
            </div>
        </div>
    ) : (
        <></>
    );
}
