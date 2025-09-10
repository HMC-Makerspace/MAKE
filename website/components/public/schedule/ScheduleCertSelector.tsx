import axios, { AxiosError } from "axios";
import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TPublicUser, TUser, UserUUID } from "common/user";
import {
    CERTIFICATION_VISIBILITY,
    CertificationUUID,
    TCertification,
} from "../../../../common/certification";
import { Button, Selection } from "@heroui/react";
import clsx from "clsx";
import CertificationTag from "../../kiosks/admin/certifications/CertificationTag";
import { API_SCOPE } from "../../../../common/global";
import { verifyScopes } from "../../../utils";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { StatusCodes } from "http-status-codes";

async function grantRevokeCert({
    user_uuid,
    cert_uuid,
    grant = true,
    level = 1,
}: {
    user_uuid: UserUUID;
    cert_uuid: CertificationUUID;
    grant?: boolean;
    level?: number;
}) {
    if (grant) {
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/grant/certification/${cert_uuid}/${level}`,
            )
        ).data;
    } else {
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/revoke/certification/${cert_uuid}`,
            )
        ).data;
    }
}

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

    const user_query = useQuery<TUser, AxiosError>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });

    const loggedOut =
        user_query.isPending ||
        user_query.error?.status === StatusCodes.UNAUTHORIZED;

    // Get the current users scopes
    const { data: scopes, isLoading: scopesLoading } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        enabled: !loggedOut,
        refetchOnMount: false,
    });

    const canGrantCerts =
        scopes &&
        verifyScopes(scopes, [
            API_SCOPE.GRANT_CERTIFICATION,
            API_SCOPE.GRANT_SCHEDULE_CERT,
        ]);

    const [editMode, setEditMode] = useState(false);

    const isHighlighted = (cert_uuid: string) => {
        if (!editMode) {
            return selectedCerts.length === 0
                ? undefined
                : selectedCerts.includes(cert_uuid);
        } else {
            return (
                user_query.data?.active_certificates?.some(
                    (c) => c.certification_uuid === cert_uuid,
                ) ?? false
            );
        }
    };

    const queryClient = useQueryClient();

    const grantRevokeMutation = useMutation({
        mutationFn: grantRevokeCert,
        onSuccess: (new_user) => {
            queryClient.setQueryData(["user", "self"], new_user);
        },
        onError: (data) => {
            alert("Error!"), console.log("error data", data);
        },
    });

    return (
        <div className="px-6 py-4 rounded-lg bg-content1">
            <div className="flex flex-row flex-wrap gap-4">
                {scheduleCerts.map((c) => {
                    const highlight = isHighlighted(c.uuid);
                    return (
                        <CertificationTag
                            key={c.uuid}
                            cert_uuid={c.uuid}
                            certifications={certs}
                            onPress={() =>
                                editMode && user_query.data
                                    ? grantRevokeMutation.mutate({
                                          user_uuid: user_query.data.uuid,
                                          cert_uuid: c.uuid,
                                          grant: !highlight,
                                      })
                                    : onCertSelect(c.uuid)
                            }
                            highlight={highlight}
                        />
                    );
                })}
            </div>
            <div className="pt-4 flex flex-row gap-2 justify-between">
                <div className="flex flex-col gap-1">
                    <div>
                        Select a certification above to highlight shifts with a
                        certified steward.
                    </div>
                    <div>
                        Select a shift below to highlight certification
                        expertise available at that time.
                    </div>
                </div>
                {canGrantCerts && (
                    <Button
                        startContent={<CheckBadgeIcon className="size-6" />}
                        color="warning"
                        variant="shadow"
                        onPress={() => setEditMode(!editMode)}
                        className="min-w-28"
                    >
                        {!editMode ? "Self-Assign" : "Done"}
                    </Button>
                )}
            </div>
        </div>
    );
}
