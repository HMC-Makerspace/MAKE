import axios, { AxiosError } from "axios";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import InventoryTable from "../components/kiosks/admin/inventory/InventoryTable";
import DefaultLayout from "../layouts/Default";
import { TPublicUser, TUserRole } from "common/user";
import { CertificationUUID, TCertification } from "common/certification";
import { TInventoryItem } from "common/inventory";
import { Skeleton, Spinner, user, Selection } from "@heroui/react";
import { TSchedule } from "common/schedule";
import { TConfig } from "common/config";
import Schedule from "../components/kiosks/admin/schedule/Schedule";
import ScheduleCertSelector from "../components/public/schedule/ScheduleCertSelector";
import clsx from "clsx";
import { StatusCodes } from "http-status-codes";

export default function SchedulePage() {
    const {
        data: schedule,
        isLoading: scheduleLoading,
        isError: scheduleUnauthorized,
        error
    } = useQuery<TSchedule, AxiosError>({
        queryKey: ["schedule", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: false,
    });
    const { data: publicUsers, isLoading: usersLoading } = useQuery<
        TPublicUser[]
    >({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        },
    );
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const workers = useMemo(
        () =>
            publicUsers
                ? publicUsers.filter((u) =>
                      u.active_roles.some((r) =>
                          config?.schedule.worker_roles.includes(r.role_uuid),
                      ),
                  )
                : [],
        [publicUsers, config],
    );

    const isLoading = scheduleLoading;

    const [selectedShifts, setSelectedShifts] = useState<Set<string>>();
    const [selectedUsers, setSelectedUsers] = useState<Selection>(new Set([]));
    const [selectedCerts, setSelectedCerts] = useState<CertificationUUID[]>([]);

    const selectCert = useCallback(
        (cert_uuid: string) => {
            console.log("Selecting cert", cert_uuid);
            setSelectedCerts([cert_uuid]);
            if (!workers) return;
            // Select users with the cert
            const certified_workers = workers
                .filter((w) =>
                    w.active_certificates?.some(
                        (c) => c.certification_uuid === cert_uuid,
                    ),
                )
                .map((w) => w.uuid);

            console.log(certified_workers);
            const certified_shifts = schedule?.shifts
                .filter((s) => certified_workers.includes(s.assignee))
                .map(
                    (shift) =>
                        `${shift.day},${shift.sec_start},${shift.sec_end}`,
                );
            setSelectedShifts(new Set(certified_shifts));
            // setSelectedUsers(new Set(certified_workers.map((u) => u.uuid)));
        },
        [selectedUsers, workers, setSelectedUsers],
    );

    const selectShift = useCallback(
        (users: Selection) => {
            console.log("Selecting users on shift", users);
            setSelectedUsers(users);
            if (!workers) return;
            let selected_workers = workers;
            if (users !== "all") {
                selected_workers = workers.filter((w) => users.has(w.uuid));
            }
            console.log("Selected workers:", selected_workers);
            // Select certs held by workers
            setSelectedCerts(
                selected_workers
                    .flatMap((w) =>
                        w.active_certificates?.map((c) => c.certification_uuid),
                    )
                    .filter((c) => c !== undefined),
            );
        },
        [selectedUsers, workers, setSelectedUsers],
    );

    return (
        <DefaultLayout className="p-4 lg:px-8" pageHref="/schedule">
            <div
                className="w-full h-full"
                onClick={() => {
                    setSelectedCerts([]);
                    setSelectedUsers(new Set());
                    setSelectedShifts(new Set());
                }}
            >
                {isLoading && <Spinner />}
                {scheduleUnauthorized &&
                    (error.status === StatusCodes.UNAUTHORIZED ? (
                        <div className="w-full h-full relative">
                            <div
                                className={clsx(
                                    "flex w-full h-full items-center justify-center",
                                    "bg-default-100 rounded-lg blur-md",
                                )}
                            ></div>
                            <div className="absolute left-0 right-0 bottom-[50%] text-center">
                                Please login to view our weekly schedule.
                            </div>
                        </div>
                    ) : error.status === StatusCodes.FORBIDDEN ? (
                        <div className="w-full h-full relative">
                            <div
                                className={clsx(
                                    "flex w-full h-full items-center justify-center",
                                    "bg-default-100 rounded-lg blur-md",
                                )}
                            ></div>
                            <div className="absolute left-0 right-0 bottom-[50%] text-center">
                                To view our weekly schedule, please verify your
                                account.
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full relative">
                            <div
                                className={clsx(
                                    "flex w-full h-full items-center justify-center",
                                    "bg-default-100 rounded-lg blur-md",
                                )}
                            ></div>
                            <div className="absolute left-0 right-0 bottom-[50%] text-center">
                                Our weekly schedule is in the works! Please
                                check back later.
                            </div>
                        </div>
                    ))}
                {schedule &&
                    !scheduleUnauthorized &&
                    publicUsers &&
                    roles &&
                    config &&
                    certs && (
                        <div className="flex flex-col gap-4 h-full w-full">
                            <ScheduleCertSelector
                                scheduled_users={publicUsers}
                                certs={certs}
                                selectedCerts={selectedCerts}
                                onCertSelect={selectCert}
                            />
                            <Schedule
                                schedule={schedule}
                                // @ts-ignore Public user data is not type-convertible to regular
                                // user data, but it contains all the information needed to
                                // display a type="view" schedule.
                                users={publicUsers}
                                roles={roles}
                                config={config}
                                type="view"
                                selectedShifts={selectedShifts}
                                setSelectedShifts={setSelectedShifts}
                                // selectedUser={selectedUsers}
                                setSelectedUsers={selectShift}
                            />
                        </div>
                    )}
            </div>
        </DefaultLayout>
    );
}
