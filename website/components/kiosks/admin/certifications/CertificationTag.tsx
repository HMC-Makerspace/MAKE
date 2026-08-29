import { Card, Tooltip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import CVisibilityIcon from "./CVisibilityIcon";
import {
    BookmarkIcon,
    CheckIcon,
    MinusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
    getForegroundColor,
    relativeTimestampToString,
} from "../../../../utils";
import { Link } from "react-router-dom";
import { TUser } from "common/user";
import { useMemo, useState } from "react";

// A certification tag similar (but with less rounded edges) to user role tags (see UserRole)
export default function CertificationTag({
    cert_uuid,
    certifications,
    showVisibility = false,
    level,
    onPress,
    highlight,
    // Whether the cert should anchor (link) to the /certifications page on click/hover
    anchor = false,
    size = "md",
    className,
}: {
    cert_uuid: string;
    certifications?: TCertification[];
    showVisibility?: boolean;
    level?: number;
    onPress?: () => void;
    highlight?: boolean;
    anchor?: boolean;
    size?: "sm" | "md";
    className?: string;
}) {
    const { data, isLoading, isError } = useQuery<TCertification>({
        queryKey: ["certification", cert_uuid],
        enabled: !certifications,
    });

    const { data: self } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: anchor,
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

    // If this cert is an anchor, highlight if the user has the given cert
    const userHasCert = !anchor
        ? undefined
        : (self?.active_certificates?.find(
              (c) => c.certification_uuid === cert?.uuid,
          ) ?? undefined);
    const hasLevel = level !== undefined && level !== 0;
    const userHasLevel =
        userHasCert && (!hasLevel || userHasCert.level >= level);
    const highlight_ = (anchor && !!userHasLevel) || highlight;
    const initialTimestamp = useMemo(() => Date.now(), []);
    const activeValidTime =
        !!userHasCert && userHasCert.timestamp_expires !== undefined
            ? relativeTimestampToString(
                  userHasCert.timestamp_expires - initialTimestamp / 1000,
              ).split(", ")[0]
            : undefined;

    const [tooltipOpen, setTooltipOpen] = useState<true | undefined>(undefined);

    return (
        <Tooltip
            content={
                anchor ? (
                    <div className="size-full flex flex-col">
                        <span
                            className={clsx(
                                "font-semibold text-xs p-1",
                                "text-default-500",
                            )}
                        >
                            Required:
                        </span>
                        <CertificationTag
                            size="md"
                            cert_uuid={cert_uuid}
                            certifications={certifications}
                            level={level}
                        />
                        <div className="flex flex-row gap-1 justify-between w-full pt-1">
                            <span
                                className={clsx(
                                    "font-semibold text-xs p-1",
                                    "text-default-500",
                                )}
                            >
                                Yours:
                            </span>
                            <span
                                className={clsx(
                                    "font-semibold text-xs p-1",
                                    "whitespace-nowrap",
                                    userHasLevel
                                        ? "text-success-500"
                                        : "text-danger-500",
                                )}
                            >
                                {userHasLevel ? (
                                    <>
                                        Valid{" "}
                                        {activeValidTime &&
                                            `for ${activeValidTime}`}
                                    </>
                                ) : userHasCert ? (
                                    "Insufficient Level"
                                ) : (
                                    "Not Certified"
                                )}
                            </span>
                        </div>
                        {userHasCert ? (
                            <CertificationTag
                                size="md"
                                cert_uuid={cert_uuid}
                                certifications={certifications}
                                level={userHasCert?.level}
                                highlight={userHasLevel ? true : undefined}
                            />
                        ) : (
                            <div className="-mb-2"></div>
                        )}
                    </div>
                ) : undefined
            }
            classNames={{
                content: clsx(
                    "bg-default-100 border-3 p-2 pt-0.5 pb-3",
                    userHasLevel ? "border-success-300" : "border-danger-300",
                ),
                base: clsx(
                    "before:bg-default-100 before:z-10",
                    "before:border-3",
                    userHasLevel
                        ? "before:border-success-300"
                        : "before:border-danger-300",
                ),
            }}
            radius="sm"
            delay={600}
            isDisabled={!anchor}
            showArrow
            isOpen={anchor && tooltipOpen}
            onClose={() => setTooltipOpen(undefined)}
        >
            {size === "md" ? (
                <Card
                    className={clsx(
                        "py-1.5 px-2.5 gap-1",
                        "flex flex-row w-fit rounded-sm",
                        "content-center items-center min-w-fit border-2",
                        "transition-colors-opacity",
                        highlight_ === true && "shadow-md",
                        className,
                    )}
                    style={{
                        backgroundColor:
                            highlight_ === true
                                ? color
                                : highlight_ === false
                                  ? color + "44"
                                  : color + "aa",
                        borderColor:
                            highlight_ === false ? color + "33" : color,
                    }}
                    isBlurred={!isLoading}
                    onPress={() => {
                        onPress?.();
                        setTooltipOpen(true);
                    }}
                    isPressable={!!onPress || !!anchor}
                    shadow="none"
                    as={anchor ? Link : undefined}
                    to={
                        anchor && !userHasCert
                            ? `/certifications/${cert?.uuid}`
                            : undefined
                    }
                >
                    {showVisibility ? (
                        <CVisibilityIcon
                            visibility={cert?.visibility}
                            color={foregroundColor}
                            className="flex-shrink-0 size-5 -ml-0.5"
                        />
                    ) : (
                        <BookmarkIcon
                            color={foregroundColor}
                            strokeWidth={2}
                            className="flex-shrink-0 size-5 -ml-0.5"
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
                    {hasLevel && (
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
            ) : (
                <div
                    className={clsx(
                        "relative min-w-fit",
                        anchor && "cursor-help",
                        className,
                    )}
                    onPointerDown={() => {
                        onPress?.();
                        setTooltipOpen(true);
                    }}
                >
                    <BookmarkIcon
                        fill={
                            highlight_ === true
                                ? color
                                : highlight_ === false
                                  ? color + "44"
                                  : color + "aa"
                        }
                        color={highlight_ === false ? color + "33" : color}
                        strokeWidth={1.5}
                        className="size-9 -mx-0.5 -my-[1px]"
                    />

                    <div
                        className={clsx(
                            "text-medium font-semibold absolute -top-[2.5px]",
                            "size-full flex items-center justify-center z-10",
                        )}
                        style={{
                            color: foregroundColor,
                        }}
                    >
                        {!userHasLevel ? (
                            hasLevel && level
                        ) : (
                            <CheckIcon
                                className="size-4"
                                strokeWidth={3}
                                color={foregroundColor}
                            />
                        )}
                    </div>
                </div>
            )}
        </Tooltip>
    );
}
