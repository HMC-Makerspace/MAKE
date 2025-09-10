import { As, Card, Link } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import CVisibilityIcon from "./CVisibilityIcon";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { getForegroundColor } from "../../../../utils";

// A certification tag similar (but with less rounded edges) to user role tags (see UserRole)
export default function CertificationTag({
    cert_uuid,
    certifications,
    showVisibility = false,
    level,
    href,
    onPress,
    highlight,
}: {
    cert_uuid: string;
    certifications?: TCertification[];
    showVisibility?: boolean;
    level?: number;
    href?: string;
    onPress?: () => void;
    highlight?: boolean;
}) {
    const { data, isLoading, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
        enabled: !certifications,
    });

    const cert = certifications
        ? certifications.find((c) => c.uuid === cert_uuid)
        : data;

    // Default to gray if not yet successful
    const color = cert ? cert.color : "gray";
    // Set the title to "Error" if isError, "Loading" if isLoading, or the title if isLoading
    const title = cert ? cert.name : isError ? "Error" : "Loading";
    const baseForegroundColor = getForegroundColor(color);
    const foregroundColor =
        highlight === false ? baseForegroundColor + "88" : baseForegroundColor;

    return (
        <Card
            className={clsx(
                "p-1.5 flex flex-row gap-1 w-fit px-2.5 rounded-sm",
                "content-center items-center min-w-fit border-2",
                "transition-colors-opacity",
                highlight === true && "shadow-md",
            )}
            style={{
                backgroundColor:
                    highlight === true
                        ? color
                        : highlight === false
                          ? color + "44"
                          : color + "aa",
                borderColor: highlight === false ? color + "33" : color,
            }}
            isBlurred={!isLoading}
            onPress={onPress}
            isPressable={!!onPress || !!href}
            as={href ? Link : undefined}
            href={href}
            shadow="none"
        >
            {showVisibility ? (
                <CVisibilityIcon
                    visibility={cert?.visibility}
                    color={foregroundColor}
                    className="size-5 -ml-0.5"
                />
            ) : (
                <BookmarkIcon
                    color={foregroundColor}
                    strokeWidth={2}
                    className="size-5 -ml-0.5"
                />
            )}
            <h1
                className={clsx("text-sm text-nowrap font-semibold")}
                style={{
                    color: foregroundColor,
                }}
            >
                {title}
            </h1>
            {level !== undefined && level !== 0 && (
                <div
                    className="text-sm font-semibold"
                    style={{
                        color: foregroundColor,
                    }}
                >
                    {level}
                </div>
            )}
        </Card>
    );
}
