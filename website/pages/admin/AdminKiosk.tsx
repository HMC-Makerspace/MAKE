import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Schedule from "../../components/kiosks/admin/schedule/Schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { ScheduleUUID, TSchedule } from "common/schedule";
import {
    Button,
    DateInput,
    DatePicker,
    Form,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    NumberInput,
    Selection,
    Spinner,
    Tab,
    Tabs,
    useDisclosure,
} from "@heroui/react";
import { TConfig } from "common/config";
import { TUser, TUserAvailability, UserUUID } from "common/user";
import { useState } from "react";
import {
    SHIFT_EVENT_TYPE,
    ShiftUUID,
    TShift,
    TShiftEvent,
} from "../../../common/shift";
import clsx from "clsx";
import {
    convertTimestampToDate,
    getActiveEvents,
    timestampToZonedDateTime,
    verifyScopes,
} from "../../utils";
import { API_SCOPE } from "../../../common/global";
import { UserMinusIcon, UserPlusIcon } from "@heroicons/react/24/solid";
import {
    parseDate,
    parseZonedDateTime,
    today,
    ZonedDateTime,
} from "@internationalized/date";
import axios from "axios";
import ShiftHistoryModal from "../../components/kiosks/admin/dashboard/ShiftHistoryModal";

async function createShiftEvent({
    schedule_uuid,
    shift_uuid,
    event,
}: {
    schedule_uuid: ScheduleUUID;
    shift_uuid: ShiftUUID;
    event: TShiftEvent;
}) {
    return (
        await axios.patch<TSchedule>(
            `/api/v3/schedule/${schedule_uuid}/shifts/${shift_uuid}/event`,
            {
                event_obj: event,
            },
        )
    ).data;
}

async function patchShiftCount({
    user_uuid,
    schedule_uuid,
    min_shift_count,
    max_shift_count,
}: {
    user_uuid: UserUUID;
    schedule_uuid: ScheduleUUID;
    min_shift_count?: number;
    max_shift_count?: number;
}) {
    const partial_availability_obj: Partial<TUserAvailability> & {
        schedule: ScheduleUUID;
    } = {
        schedule: schedule_uuid,
        min_shift_count: min_shift_count,
        max_shift_count: max_shift_count,
    };
    return (
        await axios.patch<TUser>(`/api/v3/user/${user_uuid}/availability`, {
            partial_availability_obj: partial_availability_obj,
        })
    ).data;
}

export default function AdminKiosk() {

    const { data: self } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    const user_uuid = self?.uuid


    const { data: users } = useQuery<TUser[]>({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const { data: scopes } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
        refetchOnMount: false,
    });

    const users_with_full_self = self ? users?.map((u) => u.uuid === user_uuid ? self : u) ?? [] : [];

    const { data: schedule, isLoading: scheduleLoading } = useQuery<TSchedule>({
        queryKey: ["schedule", "active", "shifts", "by", "user", user_uuid],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const { data: availabilitySchedule } = useQuery<TSchedule>({
        queryKey: ["schedule", "staging"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const { data: config } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const queryClient = useQueryClient();

    const shiftEventMutation = useMutation({
        mutationFn: createShiftEvent,
        onSuccess: (new_schedule) => {
            queryClient.refetchQueries({
                queryKey: [
                    "schedule",
                    "active",
                    "shifts",
                    "by",
                    "user",
                    user_uuid,
                ],
            });
            setPopupShifts([]);
        },
        onError: (err) => alert(err),
    });

    const shiftCountMutation = useMutation({
        mutationFn: patchShiftCount,
        onSuccess: (updated_user) => {
            queryClient.setQueryData(["user", updated_user.uuid], updated_user);
        },
        onError: (err) => alert(err),
    });

    const isLoading = !config || !schedule || !users;

    const [selectedTab, setSelectedTab] = useState<React.Key>("worker_view");

    const [userShift, setUserShift] = useState<TShift>();

    const [popupShifts, setPopupShifts] = useState<TShift[]>([]);

    const onShiftSelect = (shifts: Selection) => {
        if (shifts === "all" || !schedule) {
            setPopupShifts([]);
            return;
        }
        const shift_str = Array.from(shifts)[0] as string;
        if (!shift_str) {
            setPopupShifts([]);
            return;
        }
        const shift_time = shift_str.split(",").map((v) => parseInt(v));
        const matching_shifts = schedule.shifts.filter(
            (s) =>
                s.day === shift_time[0] &&
                s.sec_start === shift_time[1] &&
                s.sec_end === shift_time[2],
        );
        setPopupShifts(matching_shifts);
        // If the user has this shift normally, store their shift.
        const user_on_shift = matching_shifts.find(
            (shift) => shift.assignee === user_uuid,
        );
        setUserShift(user_on_shift);
    };

    const availabilityVisible = scopes
        ? verifyScopes(scopes, [API_SCOPE.UPDATE_AVAILABILITY])
        : false;

    const historyVisible = scopes
        ? verifyScopes(scopes, [API_SCOPE.VIEW_SHIFT_HISTORY])
        : false;

    const {
        isOpen: isHistoryOpen,
        onOpenChange: historyOpenChange,
        onOpen: openHistory,
    } = useDisclosure();

    return (
        <AdminLayout pageHref={"/admin"} className="px-4 sm:px-12">
            <div className="size-full flex flex-col gap-4 pb-4">
                <div className="w-full text-xl text-center">
                    Welcome to the MAKE dashboard.
                </div>
                <div className={clsx("flex flex-col h-4/5 w-full gap-3")}>
                    <div
                        className={clsx(
                            "flex p-4 bg-content1",
                            "w-full rounded-lg items-center",
                        )}
                    >
                        {selectedTab === "worker_availability" ? (
                            <div className="hidden lg:flex flex-1 mr-auto gap-2 items-center">
                                <div className="whitespace-nowrap pr-2">
                                    Requested Shift Range:
                                </div>
                                <NumberInput
                                    size="sm"
                                    aria-label="Min shift count"
                                    startContent={
                                        <div className="pl-1 text-xs">Min</div>
                                    }
                                    minValue={0}
                                    defaultValue={
                                        self?.work_schedules?.find(
                                            (sch) =>
                                                sch.schedule === schedule?.uuid,
                                        )?.min_shift_count
                                    }
                                    className="w-20 max-h-[44px]"
                                    classNames={{
                                        inputWrapper: "p-1",
                                        input: "text-center",
                                    }}
                                    onBlur={(blurEvent) => {
                                        const minShifts =
                                            // @ts-ignore This property does exist...
                                            blurEvent.target.value;
                                        if (
                                            !schedule ||
                                            !user_uuid ||
                                            minShifts === undefined
                                        ) {
                                            return;
                                        }
                                        shiftCountMutation.mutate({
                                            user_uuid: user_uuid,
                                            schedule_uuid: schedule.uuid,
                                            min_shift_count: minShifts,
                                        });
                                    }}
                                />
                                <NumberInput
                                    size="sm"
                                    aria-label="Max shift count"
                                    startContent={
                                        <div className="pl-1 text-xs">Max</div>
                                    }
                                    minValue={0}
                                    defaultValue={
                                        self?.work_schedules?.find(
                                            (sch) =>
                                                sch.schedule === schedule?.uuid,
                                        )?.max_shift_count
                                    }
                                    className="w-20 max-h-[44px]"
                                    classNames={{
                                        inputWrapper: "p-1",
                                        input: "text-center",
                                    }}
                                    onBlur={(blurEvent) => {
                                        const maxShifts =
                                            // @ts-ignore This property does exist...
                                            blurEvent.target.value;
                                        if (
                                            !schedule ||
                                            !user_uuid ||
                                            maxShifts === undefined
                                        ) {
                                            return;
                                        }
                                        shiftCountMutation.mutate({
                                            user_uuid: user_uuid,
                                            schedule_uuid: schedule.uuid,
                                            max_shift_count: maxShifts,
                                        });
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex-1"></div>
                        )}
                        <Tabs
                            size="lg"
                            color="primary"
                            radius="full"
                            className="justify-center flex-1"
                            classNames={{
                                tabList: "bg-default-200",
                                tab: "min-w-24",
                            }}
                            selectedKey={selectedTab as string}
                            onSelectionChange={setSelectedTab}
                        >
                            <Tab key="worker_view" title="Shifts" />
                            {availabilityVisible && (
                                <Tab
                                    key="worker_availability"
                                    title="Availability"
                                />
                            )}
                        </Tabs>
                        {selectedTab === "worker_availability" ? (
                            <div
                                className={clsx(
                                    "hidden lg:block flex-1 ml-auto",
                                    "text-center font-semibold text-lg",
                                )}
                            >
                                {availabilitySchedule?.name}
                            </div>
                        ) : selectedTab === "worker_view" && historyVisible ? (
                            <div className="flex flex-1 justify-end">
                                <Button
                                    onPress={openHistory}
                                    variant="faded"
                                    color="primary"
                                >
                                    Open History
                                </Button>
                            </div>
                        ) : (
                            <div className="flex-1"></div>
                        )}
                    </div>
                    {isLoading ? (
                        <Spinner />
                    ) : (
                        <div className="h-full">
                            <Schedule
                                schedule={
                                    selectedTab === "worker_availability"
                                        ? availabilitySchedule
                                        : schedule
                                }
                                users={users_with_full_self}
                                roles={[]}
                                config={config}
                                isLoading={isLoading}
                                selectedUser={self}
                                setSelectedShifts={onShiftSelect}
                                type={
                                    selectedTab === "worker_availability" ||
                                    selectedTab === "worker_view"
                                        ? selectedTab
                                        : undefined
                                }
                                hideMissingShifts
                            />
                        </div>
                    )}
                    {selectedTab === "worker_availability" && (
                        <div
                            className={clsx(
                                "flex lg:hidden p-2 bg-content1",
                                "w-full rounded-lg items-center",
                                "gap-2 justify-between",
                            )}
                        >
                            <div className="whitespace-nowrap pr-2">
                                Requested Shift Range:
                            </div>
                            <NumberInput
                                size="sm"
                                aria-label="Min shift count"
                                startContent={
                                    <div className="pl-1 text-xs">Min</div>
                                }
                                minValue={0}
                                defaultValue={
                                    self?.work_schedules?.find(
                                        (sch) =>
                                            sch.schedule ===
                                            availabilitySchedule?.uuid,
                                    )?.min_shift_count
                                }
                                className="w-20 max-h-[44px]"
                                classNames={{
                                    inputWrapper: "p-1",
                                    input: "text-center",
                                }}
                                onBlur={(blurEvent) => {
                                    // @ts-ignore This property does exist...
                                    const minShifts = blurEvent.target.value;
                                    if (
                                        !availabilitySchedule ||
                                        !schedule ||
                                        !user_uuid ||
                                        minShifts === undefined
                                    ) {
                                        return;
                                    }
                                    shiftCountMutation.mutate({
                                        user_uuid: user_uuid,
                                        schedule_uuid:
                                            availabilitySchedule.uuid,
                                        min_shift_count: minShifts,
                                    });
                                }}
                            />
                            <NumberInput
                                size="sm"
                                aria-label="Max shift count"
                                startContent={
                                    <div className="pl-1 text-xs">Max</div>
                                }
                                minValue={0}
                                defaultValue={
                                    self?.work_schedules?.find(
                                        (sch) =>
                                            sch.schedule ===
                                            availabilitySchedule?.uuid,
                                    )?.max_shift_count
                                }
                                className="w-20 max-h-[44px]"
                                classNames={{
                                    inputWrapper: "p-1",
                                    input: "text-center",
                                }}
                                onBlur={(blurEvent) => {
                                    // @ts-ignore This property does exist...
                                    const maxShifts = blurEvent.target.value;
                                    if (
                                        !availabilitySchedule ||
                                        !user_uuid ||
                                        maxShifts === undefined
                                    ) {
                                        return;
                                    }
                                    shiftCountMutation.mutate({
                                        user_uuid: user_uuid,
                                        schedule_uuid:
                                            availabilitySchedule.uuid,
                                        max_shift_count: maxShifts,
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
            {config && users && schedule && (
                <Modal
                    isOpen={popupShifts.length > 0}
                    onOpenChange={() => setPopupShifts([])}
                    backdrop="transparent"
                    size="xl"
                    className="justify-self-center"
                >
                    <ModalContent className="pb-2">
                        <ModalHeader className="pb-0">
                            Shift History
                        </ModalHeader>
                        <ModalBody className="gap-5 grid grid-cols-8">
                            {userShift && (
                                <Form
                                    onSubmit={(e) => {
                                        if (!user_uuid) {
                                            return;
                                        }
                                        e.preventDefault();
                                        const formData = new FormData(
                                            e.currentTarget,
                                        );
                                        const shift_date =
                                            parseDate(
                                                formData.get(
                                                    "shift_date",
                                                ) as string,
                                            )
                                                .toDate(
                                                    config.schedule.timezone,
                                                )
                                                .getTime() / 1000;
                                        shiftEventMutation.mutate({
                                            schedule_uuid: schedule.uuid,
                                            shift_uuid: userShift.uuid,
                                            event: {
                                                timestamp: Date.now() / 1000,
                                                initiator: user_uuid,
                                                shift_date: shift_date,
                                                type: SHIFT_EVENT_TYPE.DROP,
                                            },
                                        });
                                    }}
                                    validationBehavior="native"
                                    className="grid grid-cols-subgrid col-span-8"
                                >
                                    <div
                                        className={clsx(
                                            "grid grid-cols-subgrid col-span-8",
                                            "items-center p-2 pl-4 gap-2",
                                            "bg-default-300 rounded-lg",
                                            "text-default-700",
                                        )}
                                    >
                                        <div className="whitespace-nowrap pr-2 col-span-3">
                                            Drop this shift:
                                        </div>
                                        <DatePicker<ZonedDateTime>
                                            color="primary"
                                            name="shift_date"
                                            isRequired
                                            aria-label="Drop date"
                                            className="col-span-3"
                                            minValue={today(
                                                config.schedule.timezone,
                                            )}
                                            errorMessage={(v) => {
                                                if (!v.isInvalid) {
                                                    return "";
                                                } else if (
                                                    v.validationDetails
                                                        .rangeUnderflow
                                                ) {
                                                    return "Cannot drop past shifts";
                                                } else if (
                                                    v.validationDetails.badInput
                                                ) {
                                                    return "Wrong day / Already dropped";
                                                }
                                                return v.validationErrors;
                                            }}
                                            isDateUnavailable={(date) => {
                                                // Only dates on this day of the week
                                                if (
                                                    date
                                                        .toDate(
                                                            config.schedule
                                                                .timezone,
                                                        )
                                                        .getDay() !=
                                                    userShift.day
                                                ) {
                                                    return true;
                                                }
                                                if (
                                                    userShift.history.some(
                                                        (event) =>
                                                            event.type ===
                                                                SHIFT_EVENT_TYPE.DROP &&
                                                            date
                                                                .toDate(
                                                                    config
                                                                        .schedule
                                                                        .timezone,
                                                                )
                                                                .getTime() /
                                                                1000 ===
                                                                event.shift_date,
                                                    )
                                                ) {
                                                    return true;
                                                }
                                                return false;
                                            }}
                                        />
                                        <Button
                                            name="submit"
                                            type="submit"
                                            endContent={
                                                <UserMinusIcon className="min-w-5 size-5" />
                                            }
                                            color="primary"
                                            variant="bordered"
                                            className="col-span-2"
                                        >
                                            Drop
                                        </Button>
                                    </div>
                                </Form>
                            )}
                            {
                                <div
                                    className={clsx(
                                        "grid grid-cols-subgrid col-span-8",
                                        "empty:hidden",
                                        "rounded-lg bg-default-200 p-2 gap-2",
                                    )}
                                >
                                    {popupShifts.map((shift, i) => {
                                        const activeEvents = getActiveEvents(
                                            shift,
                                            config,
                                        );
                                        // Filter out other user's pickups
                                        const relevantEvents =
                                            activeEvents.filter(
                                                (e) =>
                                                    !(
                                                        e.initiator !==
                                                            user_uuid &&
                                                        e.type ===
                                                            SHIFT_EVENT_TYPE.PICKUP
                                                    ),
                                            );
                                        if (relevantEvents.length > 0) {
                                            return relevantEvents.map(
                                                (event, i) => (
                                                    <div
                                                        key={`${shift.uuid}-event-${i}`}
                                                        className={clsx(
                                                            "grid col-span-8 gap-2",
                                                            "grid-cols-subgrid",
                                                        )}
                                                    >
                                                        <div className="col-span-4 flex flex-row gap-2 items-center">
                                                            <div className="text-md px-2">
                                                                {event.type ===
                                                                SHIFT_EVENT_TYPE.DROP
                                                                    ? "Drop:"
                                                                    : "Your Pickup:"}
                                                            </div>
                                                            {event.type ===
                                                                SHIFT_EVENT_TYPE.DROP && (
                                                                <Input
                                                                    aria-label="Name"
                                                                    value={
                                                                        users.find(
                                                                            (
                                                                                u,
                                                                            ) =>
                                                                                u.uuid ===
                                                                                shift.assignee,
                                                                        )
                                                                            ?.name ||
                                                                        "Unknown User"
                                                                    }
                                                                    isDisabled
                                                                    className="opacity-100 col-span-3"
                                                                />
                                                            )}
                                                        </div>
                                                        <DateInput
                                                            key={`date-${i}`}
                                                            aria-label="Date"
                                                            value={timestampToZonedDateTime(
                                                                event.shift_date,
                                                                config.schedule
                                                                    .timezone,
                                                            )}
                                                            isDisabled
                                                            className="opacity-100 col-span-2"
                                                            granularity="day"
                                                        />
                                                        <Button
                                                            endContent={
                                                                event.type ===
                                                                SHIFT_EVENT_TYPE.DROP ? (
                                                                    <UserPlusIcon className="min-w-5 size-5" />
                                                                ) : (
                                                                    <UserMinusIcon className="min-w-5 size-5" />
                                                                )
                                                            }
                                                            color="primary"
                                                            variant="bordered"
                                                            className="col-span-2"
                                                            onPress={() => {
                                                                if (
                                                                    !user_uuid
                                                                ) {
                                                                    return;
                                                                }
                                                                const type =
                                                                    event.type ===
                                                                    SHIFT_EVENT_TYPE.DROP
                                                                        ? SHIFT_EVENT_TYPE.PICKUP
                                                                        : SHIFT_EVENT_TYPE.DROP;
                                                                shiftEventMutation.mutate(
                                                                    {
                                                                        schedule_uuid:
                                                                            schedule.uuid,
                                                                        shift_uuid:
                                                                            shift.uuid,
                                                                        event: {
                                                                            timestamp:
                                                                                Date.now() /
                                                                                1000,
                                                                            initiator:
                                                                                user_uuid,
                                                                            shift_date:
                                                                                event.shift_date,
                                                                            type: type,
                                                                        },
                                                                    },
                                                                );
                                                            }}
                                                            isLoading={
                                                                shiftEventMutation.isPending
                                                            }
                                                        >
                                                            {event.type ===
                                                            SHIFT_EVENT_TYPE.DROP
                                                                ? "Pickup"
                                                                : "Re-Drop"}
                                                        </Button>
                                                    </div>
                                                ),
                                            );
                                        }
                                    })}
                                </div>
                            }
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
            {historyVisible && (
                <ShiftHistoryModal
                    isOpen={isHistoryOpen}
                    onOpenChange={historyOpenChange}
                />
            )}
        </AdminLayout>
    );
}
