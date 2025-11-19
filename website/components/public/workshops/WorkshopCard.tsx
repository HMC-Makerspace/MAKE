import {
    Card,
    CardHeader,
    CardBody,
    Tooltip,
    Button,
    CardFooter,
    addToast,
} from "@heroui/react";
import clsx from "clsx";
import { FILE_RESOURCE_TYPE } from "../../../../common/file";
import { TWorkshop } from "common/workshop";
import ImageCarousel from "../../ImageCarousel";
import CertificationTag from "../../kiosks/admin/certifications/CertificationTag";
import { CalendarBoldIcon } from "@heroui/shared-icons";
import { TUser } from "common/user";
import axios, { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timestampToZonedDateTime } from "../../../utils";
import { TConfig } from "common/config";
import { DateFormatter } from "@internationalized/date";
import { TCertificate, TCertification } from "common/certification";
import { useMemo } from "react";

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

export default function WorkshopCard({
    workshop,
    self,
    users,
    config,
    certifications,
}: {
    workshop: TWorkshop;
    self?: TUser;
    users?: TUser[];
    config?: TConfig;
    certifications?: TCertification[];
}) {
    const queryClient = useQueryClient();
    const rsvpMutation = useMutation({
        mutationFn: rsvp,
        onSuccess: (data) => {
            const hasCancelled = data.rsvp_list.every(
                (rsvp_record) => rsvp_record.user_uuid !== self?.uuid,
            );
            const onWaitList =
                data.capacity &&
                data.capacity > 0 &&
                data.rsvp_list.findIndex((rs) => rs.user_uuid === self?.uuid) >=
                    data.capacity;
            addToast({
                title: hasCancelled
                    ? `Withdrew from ${data.title}`
                    : onWaitList
                      ? `Joined waitlist for ${data.title}`
                      : `RSVP'd for ${data.title}`,
                timeout: 3000,
                color: hasCancelled
                    ? "warning"
                    : onWaitList
                      ? "secondary"
                      : "success",
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

    const startZDT = timestampToZonedDateTime(
        workshop.timestamp_start,
        config?.schedule.timezone,
    );
    const endZDT = timestampToZonedDateTime(
        workshop.timestamp_end,
        config?.schedule.timezone,
    );
    const isSameDay =
        startZDT.year == endZDT.year &&
        startZDT.month == endZDT.month &&
        startZDT.day == endZDT.day;

    const rsvpIndex = workshop.rsvp_list.findIndex(
        (rsvp_record) => rsvp_record.user_uuid === self?.uuid,
    );

    const overCapacity = workshop.capacity
        ? workshop.rsvp_list.length >= workshop.capacity
        : false;

    const date_formatter =
        config?.schedule.locale &&
        new DateFormatter(config.schedule.locale, {
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

    const time_formatter =
        config?.schedule.locale &&
        new DateFormatter(config.schedule.locale, {
            hour: "numeric",
            minute: "2-digit",
        });

    return (
        <Card id={workshop.title} key={workshop.title} className="h-[44dvh]">
            <CardHeader className="flex-col items-start">
                <div
                    id="title-capacity-container"
                    className="flex flex-row w-full items-center"
                >
                    <p className="text-2xl font-light flex w-full">
                        {workshop.title}
                    </p>
                    <div
                        id="capacity"
                        className="text-sm text-default-600 whitespace-nowrap ml-4"
                    >
                        {workshop.capacity && workshop.capacity > 0 ? (
                            <>
                                Capacity: {workshop.rsvp_list.length} /{" "}
                                {workshop.capacity}
                            </>
                        ) : (
                            "Open to all!"
                        )}
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <CalendarBoldIcon className="text-primary-300 size-4" />
                    {date_formatter &&
                        time_formatter &&
                        (isSameDay
                            ? `${date_formatter.format(startZDT.toDate())} - ${time_formatter.format(endZDT.toDate())}`
                            : `${date_formatter.format(startZDT.toDate())} - ${date_formatter.format(endZDT.toDate())}`)}
                </div>
                <div
                    id="description"
                    className="text-sm text-gray-500 flex items-center gap-2 text-ellipsis overflow-hidden"
                >
                    {workshop.description}
                </div>
                <div id="instructors" className="font-bold text-small">
                    {"Taught By: "}
                    {users
                        ?.filter((user) =>
                            workshop.instructors.includes(user.uuid),
                        )
                        .map((user) =>
                            config?.schedule.first_names_only
                                ? user.name.split(" ")[0]
                                : user.name,
                        )
                        .join(", ")}
                </div>
            </CardHeader>
            <CardBody className="p-0 pb-0 h-full flex-grow-0">
                <ImageCarousel
                    resource_uuid={workshop.uuid}
                    resource_type={FILE_RESOURCE_TYPE.WORKSHOP}
                    editable={false}
                    className=""
                />
                <div
                    id="certification-tags"
                    className={clsx(
                        "absolute w-full h-fit top-0",
                        "box-border border-4 border-transparent",
                        "p-1 overflow-auto flex gap-2",
                        "z-20",
                    )}
                >
                    {workshop.required_certifications &&
                        workshop.required_certifications.map((cert) => (
                            <CertificationTag
                                key={cert.certification_uuid}
                                cert_uuid={cert.certification_uuid}
                                certifications={certifications}
                                level={
                                    cert.required_level > 0
                                        ? cert.required_level
                                        : undefined
                                }
                            />
                        ))}
                </div>
                <div className="absolute w-full h-fit bottom-3 flex justify-center z-20">
                    <Tooltip
                        color="primary"
                        content={
                            workshop.timestamp_public &&
                            `RSVPs are closed until ${new Date(workshop.timestamp_public * 1000).toDateString()}`
                        }
                        isDisabled={
                            workshop.timestamp_public
                                ? workshop.timestamp_public < Date.now() / 1000
                                : true
                        }
                    >
                        <Button
                            className="text-small font-bold text-white bg-primary hover:bg-primary/50 hover:outline"
                            color="default"
                            radius="lg"
                            size="sm"
                            variant="flat"
                            onPress={() => {
                                // Only RSVP if workshop is public
                                if (
                                    workshop.timestamp_public &&
                                    workshop.timestamp_public <
                                        Date.now() / 1000
                                ) {
                                    rsvpMutation.mutate({
                                        workshop_uuid: workshop.uuid,
                                        cancel: workshop.rsvp_list.some(
                                            (rsvp_record) =>
                                                rsvp_record.user_uuid ===
                                                self?.uuid,
                                        ),
                                    });
                                }
                            }}
                            isDisabled={
                                !self ||
                                rsvpMutation.isPending ||
                                workshop.timestamp_end < Date.now() / 1000
                            }
                        >
                            {rsvpIndex === -1 && overCapacity
                                ? "Join Waitlist"
                                : rsvpIndex === -1 && !overCapacity
                                  ? "RSVP"
                                  : !workshop.capacity || rsvpIndex < workshop.capacity
                                    ? "Cancel RSVP"
                                    : "Leave Waitlist"}
                        </Button>
                    </Tooltip>
                </div>
            </CardBody>
        </Card>
    );
}
