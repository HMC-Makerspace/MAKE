import { useQuery } from "@tanstack/react-query";
import Schedule from "../../components/kiosks/admin/schedule/Schedule";
import AdminLayout from "../../layouts/AdminLayout";
import { TSchedule } from "common/schedule";
import {
    DatePicker,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Selection,
    Spinner,
    Tab,
    Tabs,
} from "@heroui/react";
import { TConfig } from "common/config";
import { useMAKEStore } from "../../store";
import { TUser } from "common/user";
import { useState } from "react";
import { TShift } from "common/shift";
import clsx from "clsx";
import { getShiftDroppedDates } from "../../utils";

export default function AdminKiosk() {
    const user_uuid = useMAKEStore((state) => state.user_uuid);
    const { data: users } = useQuery<TUser[]>({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const { data: self } = useQuery<TUser>({
        queryKey: ["user", user_uuid],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const users_without_self = users?.filter((u) => u.uuid !== user_uuid) ?? [];
    const users_with_full_self = self
        ? users_without_self.concat([self])
        : users_without_self;

    const { data: schedule, isLoading: scheduleLoading } = useQuery<TSchedule>({
        queryKey: ["schedule", "active", "shifts", "by", "user", user_uuid],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });

    const { data: config } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const isLoading = !config || !schedule || !users;

    const [selectedTab, setSelectedTab] = useState<React.Key>("worker_view");

    const [isUserShift, setUserShift] = useState<boolean>(false);

    const [popupShifts, setPopupShifts] = useState<TShift[]>([]);

    const onShiftSelect = (shifts: Selection) => {
        if (shifts === "all" || !schedule) {
            return;
        }
        const shift_str = Array.from(shifts)[0] as string;
        const shift_time = shift_str.split(",").map((v) => parseInt(v));
        const matching_shifts = schedule.shifts.filter(
            (s) =>
                s.day === shift_time[0] &&
                s.sec_start === shift_time[1] &&
                s.sec_end === shift_time[2],
        );
        setPopupShifts(matching_shifts);
        if (matching_shifts.some((shift) => shift.assignee === user_uuid)) {
            // User is on this shift normally, indicate that in the popup
            setUserShift(true);
        } else {
            setUserShift(false);
        }
    };

    return (
        <AdminLayout pageHref={"/admin"}>
            <div className="size-full flex flex-col gap-4 pb-4">
                <div className="w-full text-xl text-center">
                    Welcome to the MAKE dashboard.
                </div>
                <div className="flex flex-col h-4/5 w-full gap-3">
                    <div className="flex justify-evenly p-4 bg-content1 w-full rounded-lg">
                        <Tabs
                            size="lg"
                            color="primary"
                            radius="full"
                            classNames={{
                                tabList: "bg-default-200",
                            }}
                            selectedKey={selectedTab as string}
                            onSelectionChange={setSelectedTab}
                        >
                            <Tab key="worker_view" title="Your Shifts" />
                            <Tab
                                key="worker_availability"
                                title="Availability"
                            />
                        </Tabs>
                    </div>
                    {isLoading ? (
                        <Spinner />
                    ) : (
                        <div className="h-full">
                            <Schedule
                                schedule={schedule}
                                users={users_with_full_self}
                                roles={[]}
                                config={config}
                                isLoading={isLoading}
                                selectedUser={user_uuid}
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
                </div>
                {config && <Modal
                    isOpen={popupShifts.length > 0}
                    onOpenChange={() => setPopupShifts([])}
                    backdrop="transparent"
                >
                    <ModalContent>
                        <ModalHeader>Drop/Pickup Shift</ModalHeader>
                        <ModalBody>
                            {isUserShift ? (
                                <div
                                    className={clsx(
                                        "flex flex-row gap-2",
                                        "items-center",
                                    )}
                                >
                                    <div className="whitespace-nowrap pr-4">
                                        Drop a future shift
                                    </div>
                                    <DatePicker
                                        color="primary"
                                        isDateUnavailable={(date) => {
                                            // Only dates on this day of the week
                                            if (
                                                date
                                                    .toDate(
                                                        config.schedule
                                                            .timezone,
                                                    )
                                                    .getDay() !=
                                                popupShifts[0].day
                                            ) {
                                                return true;
                                            }
                                            if (
                                                popupShifts
                                                    .find(
                                                        (s) =>
                                                            s.assignee ===
                                                            user_uuid,
                                                    )!
                                                    .history.some(
                                                        (event) =>
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
                                </div>
                            ) : (
                                <div>Not your shift</div>
                            )}
                            <div className="flex flex-col">
                                {popupShifts.map((shift) => {
                                    const activeDrops = getShiftDroppedDates(shift, config)
                                    return <div className="flex flex-row">

                                    </div>
                                })}
                            </div>
                        </ModalBody>
                    </ModalContent>
                </Modal>}
            </div>
        </AdminLayout>
    );
}
