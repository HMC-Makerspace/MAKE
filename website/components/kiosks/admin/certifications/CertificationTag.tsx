import { Card, Tooltip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

import { TCertification } from "common/certification";
import CVisibilityIcon from "./CVisibilityIcon";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { getForegroundColor } from "../../../../utils";
import { Link } from "react-router-dom";
import { TUser } from "common/user";

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
}: {
    cert_uuid: string;
    certifications?: TCertification[];
    showVisibility?: boolean;
    level?: number;
    onPress?: () => void;
    highlight?: boolean;
    anchor?: boolean;
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
    const hasCert = !anchor
        ? undefined
        : (self?.active_certificates?.some(
              (c) => c.certification_uuid === cert?.uuid,
          ) ?? undefined);
    const highlight_ = (anchor && hasCert) || highlight;

    return (
        <Tooltip
            content={
                hasCert
                    ? "You are certified!"
                    : "You are missing this certification"
            }
            isDisabled={!anchor}
            color="warning"
        >
            <Card
                className={clsx(
                    "p-1.5 flex flex-row gap-1 w-fit px-2.5 rounded-sm",
                    "content-center items-center min-w-fit border-2",
                    "transition-colors-opacity",
                    highlight_ === true && "shadow-md",
                )}
                style={{
                    backgroundColor:
                        highlight_ === true
                            ? color
                            : highlight_ === false
                              ? color + "44"
                              : color + "aa",
                    borderColor: highlight_ === false ? color + "33" : color,
                }}
                isBlurred={!isLoading}
                onPress={onPress}
                isPressable={!!onPress || !!anchor}
                shadow="none"
                as={anchor ? Link : undefined}
                to={
                    anchor && !hasCert
                        ? `/certifications/${cert?.uuid}`
                        : undefined
                }
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
        </Tooltip>
    );
}
