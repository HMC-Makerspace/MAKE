import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import {
    Card,
    CardFooter,
    Button,
    ToastProvider,
    closeToast,
    addToast,
    CardBody,
    CardHeader,
    Tabs,
    Tab,
} from "@heroui/react";
import { CalendarBoldIcon } from "@heroui/shared-icons";
import { TWorkshop } from "../../common/workshop.ts";
import ImageCarousel from "../components/ImageCarousel.tsx";
import { FILE_RESOURCE_TYPE } from "../../common/file.ts";
import { TUser } from "common/user.js";
import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import CertificationTag from "../components/kiosks/admin/certifications/CertificationTag.tsx";
import clsx from "clsx";
import { useTheme } from "next-themes";
import {
    CalendarDateRangeIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { TCertificate, TCertification } from "common/certification.ts";

export const calendar_date_range_icon = (
    props: React.ComponentProps<typeof CalendarDateRangeIcon>,
) => <CalendarDateRangeIcon {...props} className="w-6 h-6" />;

export const calendar_days_icon = (
    props: React.ComponentProps<typeof CalendarDaysIcon>,
) => <CalendarDaysIcon {...props} className="w-6 h-6" />;

// cancel means cancel_rsvp
async function rsvp({
    workshop_uuid,
    cancel,
}: {
    workshop_uuid: string;
    cancel: boolean;
}) {
    if (!cancel) {
        return (
            await axios.patch<TWorkshop>(
                `api/v3/workshop/${workshop_uuid}/rsvp`,
            )
        ).data;
    } else {
        return (
            await axios.patch<TWorkshop>(
                `api/v3/workshop/${workshop_uuid}/cancel_rsvp`,
            )
        ).data;
    }
}

export default function WorkshopPage() {
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState("current-workshops");
    const {
        data: workshops,
        isLoading: workshopsLoading,
        isError: workshopsError,
    } = useQuery<TWorkshop[]>({
        queryKey: ["workshop"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: users,
        isLoading: usersLoading,
        isError: usersError,
    } = useQuery<TUser[]>({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: certifications,
        isLoading: certsLoading,
        isError: certsError,
    } = useQuery<TCertification[]>({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: self,
        isLoading: selfLoading,
        isError: selfError,
    } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    const rsvpMutation = useMutation({
        mutationFn: rsvp,
        onSuccess: (data) => {
            const cancel = data.rsvp_list.every(
                (rsvp_record) => rsvp_record.user_uuid !== self?.uuid,
            );
            addToast({
                title: cancel
                    ? `Withdrew RSVP for ${data.title}`
                    : `RSVP'd for ${data.title}`,
                timeout: 3000,
                color: cancel ? "warning" : "success",
                severity: "success",
            });
            queryClient.setQueryData(
                ["workshop"],
                (old_workshops: TWorkshop[]) =>
                    old_workshops.map((old_workshop) =>
                        old_workshop.uuid === data.uuid ? data : old_workshop,
                    ),
            );
        },
        onError: (error: AxiosError<{ error: string }>) => {
            addToast({
                title:
                    error.response?.data.error ??
                    `Unknown error: ${error.message}`,
                timeout: 5000,
                color: "danger",
            });
        },
    });

    return (
        <DefaultLayout className="p-8" pageHref="/workshops">
            <ToastProvider />
            {!workshops ||
                (workshops.length == 0 && (
                    <div className="size-full flex items-center justify-center">
                        We're still finalizing our workshops for the semester,
                        please check back soon!
                    </div>
                ))}
            <div
                id="master"
                className="flex gap-4 flex-col h-full items-center"
            >
                {workshops && workshops.length > 0 && (
                    <Tabs
                        aria-label="past-present-workshop-toggle"
                        color="primary"
                        variant="bordered"
                        selectedKey={selected}
                        onSelectionChange={(key) => setSelected(String(key))}
                        className="justify-self-center"
                    >
                        <Tab
                            key="current-workshops"
                            title={
                                <div className="flex items-center space-x-2">
                                    {calendar_date_range_icon({})}
                                    <span>Current Workshops</span>
                                </div>
                            }
                        />
                        <Tab
                            key="past-workshops"
                            title={
                                <div className="flex items-center space-x-2">
                                    {calendar_days_icon({})}
                                    <span>Past Workshops</span>
                                </div>
                            }
                        />
                    </Tabs>
                )}
                <div
                    id="card-container"
                    className="grid grid-cols-2 gap-4 h-full w-full"
                >
                    {workshops
                        ?.filter((workshop) => {
                            const isFuture =
                                workshop.timestamp_end > Date.now() / 1000;
                            return selected === "past-workshops"
                                ? !isFuture
                                : isFuture;
                        })
                        .map((workshop) => (
                            <Card
                                id={workshop.title}
                                key={workshop.title}
                                className=""
                            >
                                <CardHeader className="flex-col items-start">
                                    <p className="text-2xl font-light">
                                        <div
                                        className="flex">
                                            {workshop.title}
                                            <CalendarBoldIcon className="text-primary-300 size-4"></CalendarBoldIcon>
                                        </div>
                                    </p>
                                    <div>
                                        bleh
                                    </div>
                                    {/* <small className="text-default-500">
                                        {workshop.capacity &&
                                        workshop.capacity > 0 ? (
                                            <div>
                                                Capacity:{" "}
                                                {workshop.rsvp_list.length} /{" "}
                                                {workshop.capacity}
                                            </div>
                                        ) : (
                                            <div>No RSVP Limit !</div>
                                        )}
                                    </small> */}
                                    <h4 className="font-bold text-small">
                                        {"Taught By: "}
                                        {users
                                            ?.filter((user) =>
                                                workshop.instructors.includes(
                                                    user.uuid,
                                                ),
                                            )
                                            .map((user) => user.name)
                                            .join(", ")}
                                        {", "}
                                        {users
                                            ?.filter((user) =>
                                                workshop.support_instructors?.includes(
                                                    user.uuid,
                                                ),
                                            )
                                            .map((user) => user.name)
                                            .join(", ")}
                                    </h4>
                                </CardHeader>
                                <CardBody className="p-0 pb-0 h-full flex-grow-0">
                                    <ImageCarousel
                                        resource_uuid={workshop.uuid}
                                        resource_type={
                                            FILE_RESOURCE_TYPE.WORKSHOP
                                        }
                                        editable={false}
                                        className=""
                                    />
                                    <div
                                        id="certification-tags"
                                        className="absolute w-full h-fit top-2 box-border border-4 border-transparent p-1 overflow-auto flex gap-2"
                                    >
                                        {workshop.required_certifications &&
                                            workshop.required_certifications.map(
                                                (cert) => (
                                                    <CertificationTag
                                                        key={
                                                            cert.certification_uuid
                                                        }
                                                        cert_uuid={
                                                            cert.certification_uuid
                                                        }
                                                        // certifications={
                                                        //     certifications
                                                        // }
                                                        level={
                                                            cert.required_level >
                                                            0
                                                                ? cert.required_level
                                                                : undefined
                                                        }
                                                    />
                                                ),
                                            )}
                                    </div>
                                    <div className="absolute w-full h-fit bottom-3 flex justify-center">
                                        <Button
                                            className="text-small font-bold text-white bg-primary hover:bg-primary/50 hover:outline"
                                            color="default"
                                            radius="lg"
                                            size="sm"
                                            variant="flat"
                                            onPress={() => {
                                                rsvpMutation.mutate({
                                                    workshop_uuid:
                                                        workshop.uuid,
                                                    cancel: workshop.rsvp_list.some(
                                                        (rsvp_record) =>
                                                            rsvp_record.user_uuid ===
                                                            self?.uuid,
                                                    ),
                                                });
                                            }}
                                            isDisabled={
                                                rsvpMutation.isPending ||
                                                workshop.rsvp_list.length ==
                                                    workshop.capacity ||
                                                !self
                                            }
                                        >
                                            {workshop.rsvp_list.some(
                                                (rsvp_record) =>
                                                    rsvp_record.user_uuid ===
                                                    self?.uuid,
                                            )
                                                ? "Cancel"
                                                : "RSVP"}
                                        </Button>
                                    </div>
                                </CardBody>
                                <CardFooter>
                                    {"Starts: "}
                                    {new Date(
                                        workshop.timestamp_start * 1000,
                                    ).toLocaleString()}
                                    {" Ends: "}
                                    {new Date(
                                        workshop.timestamp_end * 1000,
                                    ).toLocaleString()}
                                </CardFooter>
                            </Card>
                        ))}
                </div>
            </div>
        </DefaultLayout>
    );
}
3;
