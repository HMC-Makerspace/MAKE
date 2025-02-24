import clsx from "clsx";
import { TShift } from "common/shift";

const backgroudColors = [
    "bg-secondary-50",
    "bg-secondary-100",
    "bg-secondary-200",
    "bg-secondary-300",
    "bg-secondary-400",
];

export default function Shift({
    shifts,
    day,
    sec_start,
    sec_end,
}: {
    shifts: TShift[];
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
    const foregroundColor =
        backgroudColors[(assignees.length + 1) % backgroudColors.length];
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
                <div
                    key={assignee}
                    className={clsx(
                        "text-default-800 text-sm text-center",
                        "px-2 py-0.5 rounded-full border-2 border-default-800",
                        // foregroundColor,
                    )}
                >
                    {assignee}
                </div>
            ))}
        </div>
    );
}
