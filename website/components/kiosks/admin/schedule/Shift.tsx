import clsx from "clsx";
import { TShift } from "common/shift";
import { TUser } from "common/user";
import { MAKEUser } from "../../../user/User";

const backgroudColors = [
    "bg-secondary-50",
    "bg-secondary-100",
    "bg-secondary-200",
    "bg-secondary-300",
    "bg-secondary-400",
];

export default function Shift({
    shifts,
    users,
    day,
    sec_start,
    sec_end,
}: {
    shifts: TShift[];
    users: TUser[];
    day: number;
    sec_start: number;
    sec_end: number;
}) {
    const assignees = shifts
        .filter(
            (shift) =>
                shift.day === day &&
                shift.sec_start <= sec_start &&
                shift.sec_end >= sec_end,
        )
        .map((shift) => shift.assignee);
    const backgroundColor =
        backgroudColors[Math.min(assignees.length, backgroudColors.length - 1)];
    return (
        <div
            className={clsx(
                "min-h-full w-full",
                "flex flex-col",
                "items-center justify-center",
                "gap-1 p-2 rounded-md",
                backgroundColor,
            )}
        >
            {assignees.map((assignee) => (
                <MAKEUser
                    key={assignee}
                    user_uuid={assignee}
                    user={users.find((u) => u.uuid === assignee)}
                    size="sm"
                    className="border-2 border-default-400 rounded-full"
                />
            ))}
            {assignees.length === 0 && (
                <div
                    className={clsx(
                        "w-full h-full",
                        "flex flex-row",
                        "items-center justify-center",
                        "text-default-400",
                        "text-sm",
                    )}
                >
                    Unassigned
                </div>
            )}
        </div>
    );
}
