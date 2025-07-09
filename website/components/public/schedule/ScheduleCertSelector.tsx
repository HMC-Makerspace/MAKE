import axios from "axios";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TPublicUser, UserUUID } from "common/user";
import {
    CERTIFICATION_VISIBILITY,
    CertificationUUID,
    TCertification,
} from "../../../../common/certification";
import { Selection } from "@heroui/react";
import clsx from "clsx";
import CertificationTag from "../../kiosks/admin/certifications/CertificationTag";

export default function ScheduleCertSelector({
    scheduled_users,
    certs,
    selectedCerts,
    onCertSelect,
}: {
    scheduled_users: TPublicUser[];
    certs: TCertification[];
    selectedCerts: CertificationUUID[];
    onCertSelect: (cert: CertificationUUID) => void;
}) {
    const scheduleCerts = certs.filter(
        (c) => c.visibility === CERTIFICATION_VISIBILITY.SCHEDULE,
    );
    return (
        <div className="px-6 py-4 rounded-lg bg-content1">
            <div className="flex flex-row flex-wrap gap-4">
                {scheduleCerts.map((c) => (
                    <CertificationTag
                        key={c.uuid}
                        cert_uuid={c.uuid}
                        certifications={certs}
                        onPress={() => onCertSelect(c.uuid)}
                        highlight={selectedCerts.includes(c.uuid)}
                    />
                ))}
            </div>
            <div className="pt-4">
                Select a certification above to highlight shifts with a
                certified steward.
            </div>
            <div>
                Select a shift below to highlight certification expertise
                available at that time.
            </div>
        </div>
    );
}
