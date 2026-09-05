import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TUserRole } from "common/user";
import { StarIcon } from "@heroicons/react/24/outline";
import { getForegroundColor } from "../../utils";
import clsx from "clsx";

export function UserRoleChip({
    role_uuid,
    role,
    size = "md",
    className,
    zIndex,
}: {
    role_uuid: string;
    role?: TUserRole;
    size?: "sm" | "md";
    className?: string;
    zIndex?: number;
}) {
    const { data, isSuccess, isError } = useQuery<TUserRole>({
        queryKey: ["user", "role", role_uuid],
        refetchOnWindowFocus: false,
        // If the role is given use that, otherwise fetch the role
        enabled: !role,
    });
    // Default to gray if not yet successful
    const color = role?.color ?? (isSuccess ? data.color : "gray");
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isSuccess
    const title =
        role?.title ?? (isSuccess ? data.title : isError ? "Error" : "Loading");
    const foregroundColor = getForegroundColor(color);
    const isDefault = role?.default ?? data?.default;
    if (size == "sm") {
        return (
            <div
                className={clsx(
                    "size-6 rounded-full flex justify-center items-center",
                    className,
                )}
                style={{ backgroundColor: color, zIndex: zIndex }}
            >
                {isDefault && (
                    <StarIcon
                        className="size-4"
                        strokeWidth={2.5}
                        color={foregroundColor}
                        fill={foregroundColor}
                    />
                )}
            </div>
        );
    } else {
        return (
            <Card
                className={clsx(
                    "p-1.5 flex flex-row gap-1 w-fit px-2.5",
                    className,
                )}
                style={{ backgroundColor: color, zIndex: zIndex }}
                isBlurred={!isSuccess}
                shadow="none"
            >
                {isDefault ? (
                    <StarIcon
                        className="size-4 mt-[1.5px] -ml-0.5"
                        strokeWidth={2.5}
                        color={foregroundColor}
                    />
                ) : null}
                <h1
                    className="text-sm font-semibold text-nowrap"
                    style={{
                        color: foregroundColor,
                    }}
                >
                    {title}
                </h1>
            </Card>
        );
    }
}
