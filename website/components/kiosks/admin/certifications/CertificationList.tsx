import {
    TCertificate,
    TCertification,
    TRequiredCertificate,
} from "common/certification";
import { useMemo } from "react";
import CertificationTag from "./CertificationTag";
import clsx from "clsx";

export function CertificationList({
    size,
    certifications,
    list,
    max = 3,
    anchor = false,
    placeholder,
}: {
    size: "sm" | "md" | "lg" | "xl";
    certifications: TCertification[];
    list: TCertificate[] | TRequiredCertificate[] | null | undefined;
    max?: number;
    anchor?: boolean;
    placeholder?: React.ReactNode;
}) {
    const filteredCerts = useMemo(
        () =>
            certifications
                .map((cert) => ({
                    ...cert,
                    listItem: list?.find(
                        (item) => item.certification_uuid === cert.uuid,
                    ),
                }))
                .filter(
                    (
                        cert,
                    ): cert is TCertification & {
                        listItem: TCertificate | TRequiredCertificate;
                    } => !!cert.listItem,
                )
                .toSorted((a, b) => {
                    if (
                        "required_level" in a.listItem &&
                        "required_level" in b.listItem
                    ) {
                        return (
                            b.listItem.required_level -
                            a.listItem.required_level
                        );
                    } else if ("required_level" in a.listItem) {
                        return -1;
                    } else if ("required_level" in b.listItem) {
                        return 1;
                    } else {
                        return a.name.localeCompare(b.name);
                    }
                }),
        [certifications, list],
    );

    const placeholderNode =
        typeof placeholder === "string" ? (
            <div className="text-default-400 text-center w-full">
                {placeholder}
            </div>
        ) : (
            placeholder
        );

    if (size === "sm") {
        return (
            <div className="flex flex-row flex-wrap items-center">
                {filteredCerts.slice(0, max).map((cert) => (
                    <CertificationTag
                        key={cert.uuid}
                        cert_uuid={cert.uuid}
                        certifications={certifications}
                        level={
                            "required_level" in cert.listItem
                                ? cert.listItem.required_level
                                : cert.listItem.level
                        }
                        anchor={anchor}
                        size="sm"
                    />
                ))}
                {filteredCerts.length > max && (
                    <span className="pl-1 text-medium">
                        +{filteredCerts.length - max}
                    </span>
                )}

                {filteredCerts.length === 0 && placeholderNode}
            </div>
        );
    }

    if (size === "md") {
        return (
            <div className="flex flex-row flex-wrap">
                {filteredCerts?.map((cert) => (
                    <CertificationTag
                        key={cert.uuid}
                        cert_uuid={cert.uuid}
                        certifications={certifications}
                        level={
                            "required_level" in cert.listItem
                                ? cert.listItem.required_level
                                : cert.listItem.level
                        }
                        anchor={anchor}
                        size="sm"
                    />
                ))}
                {filteredCerts.length === 0 && placeholderNode}
            </div>
        );
    }

    return (
        <div
            className={
                size === "lg"
                    ? "flex flex-col gap-1 overflow-auto max-w-1/2"
                    : clsx(
                          "rounded-lg bg-default-100 border-2 border-default-200 p-2",
                          "col-span-full flex flex-wrap gap-2 overflow-auto max-h-[30vh]",
                      )
            }
        >
            {filteredCerts?.map((cert) => (
                <CertificationTag
                    key={cert.uuid}
                    cert_uuid={cert.uuid}
                    certifications={certifications}
                    level={
                        "required_level" in cert.listItem
                            ? cert.listItem.required_level
                            : cert.listItem.level
                    }
                    anchor={anchor}
                />
            ))}
            {filteredCerts.length === 0 && placeholderNode}
        </div>
    );
}
