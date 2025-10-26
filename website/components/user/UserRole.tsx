import { Card } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TUserRole } from "common/user";
import { StarIcon } from "@heroicons/react/24/outline";
import { getForegroundColor } from "../../utils";

export default function UserRole({
    role_uuid,
    role,
    size = "sm",
}: {
    role_uuid: string;
    role?: TUserRole;
    size?: "sm" | "md";
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
                className={`w-5 h-5 rounded-full`}
                style={{backgroundColor: color}}
            
            ></div>
        );
    } else {
        return (
            
            <Card
                className="p-1.5 flex flex-row gap-1 w-fit px-2.5"
                style={{ backgroundColor: color }}
                isBlurred={!isSuccess}
                shadow="none"
            >
                {isDefault ? (
                    <StarIcon
                        className={`size-4 mt-[1.5px] -ml-0.5`}
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
