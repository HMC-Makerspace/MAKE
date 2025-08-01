import { Card } from "@heroui/react";
import { TCertification } from "common/certification";
import { BookmarkIcon, CogIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { getForegroundColor } from "../../../utils";
import CertificationTag from "../../kiosks/admin/certifications/CertificationTag";

// A certification tag similar (but with less rounded edges) to user role tags (see UserRole)
export default function CertificationCard({ cert }: { cert: TCertification }) {
    const foregroundColor = getForegroundColor(cert.color);
    return (
        <Card
            className={clsx(
                "p-4 flex flex-row gap-6 rounded-lg min-h-60",
                // "border-2 border-default-400/60 bg-default-200",
                "text-default-800 border-2 text-lg",
                "justify-between",
            )}
            style={{
                backgroundColor: cert.color + "44",
                borderColor: cert.color + "55",
            }}
        >
            <div className="flex flex-col gap-3">
                <div className="min-h-fit">
                    <CertificationTag
                        cert_uuid={cert.uuid}
                        certifications={[cert]}
                        // highlight
                    />
                </div>
                <div>{cert.description}</div>
                <div className="flex flex-row gap-2">
                    {cert.documents?.map((d) => d.name)}
                </div>
            </div>
        </Card>
    );
}
