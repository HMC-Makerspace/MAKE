import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    Divider,
    Form,
    Input,
    Select,
    SelectItem,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TConfig } from "common/config";
import { SHIFT_DAY } from "../../../../../common/shift";
import { UserRoleSelect } from "../../../../components/user/UserRoleSelect";
import axios from "axios";
import React from "react";
import PopupAlert from "../../../../components/PopupAlert";

function ConfigItem({
    name,
    description,
    children,
}: {
    name: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 w-full rounded-xl bg-content1 p-4">
            <h1 className="text-lg font-bold">{name}</h1>
            <p className="text-sm">{description}</p>
            <div className="flex flex-row gap-2">{children}</div>
        </div>
    );
}

async function updateConfig({ config }: { config: TConfig }) {
    return (
        await axios.post<TConfig>("/api/v3/config", {
            config: config,
        })
    ).data;
}

export default function Configuration({ config }: { config: TConfig }) {
    const queryClient = useQueryClient();

    const [popupMessage, setPopupMessage] = React.useState<string | undefined>(
        undefined,
    );
    const [popupType, setPopupType] = React.useState<"success" | "danger">(
        "success",
    );

    const mutation = useMutation({
        mutationFn: updateConfig,
        onSuccess: (data) => {
            queryClient.setQueryData(["config"], data);
            setPopupMessage("Configuration updated successfully.");
            setPopupType("success");
        },
        onError: (error) => {
            setPopupMessage("Failed to update configuration: " + error);
            setPopupType("danger");
        },
    });

    // Calculate intermediary notification values
    const notification_interval_sec =
        config.checkout.notification_interval_sec ?? 0;
    const notification_interval_days = Math.floor(
        notification_interval_sec / (24 * 60 * 60),
    );
    const notification_interval_hours = Math.floor(
        (notification_interval_sec % (24 * 60 * 60)) / (60 * 60),
    );
    const notification_interval_mins = Math.floor(
        (notification_interval_sec % (60 * 60)) / 60,
    );
    const notification_interval_secs = notification_interval_sec % 60;

    // Calculate intermediary capacity values
    const max_upload_capacity = config.file.max_upload_capacity ?? 0;
    const max_upload_gb = Math.floor(
        max_upload_capacity / (1024 * 1024 * 1024),
    );
    const max_upload_mb = Math.floor(
        (max_upload_capacity % (1024 * 1024 * 1024)) / (1024 * 1024),
    );
    const max_upload_kb = Math.floor(
        (max_upload_capacity % (1024 * 1024)) / 1024,
    );
    const max_upload_bytes = max_upload_capacity % 1024;

    // Calculate intermediary shift increment values
    const shift_increment_sec = config.schedule.increment_sec ?? 0;
    const shift_increment_hours = Math.floor(shift_increment_sec / (60 * 60));
    const shift_increment_mins = Math.floor(
        (shift_increment_sec % (60 * 60)) / 60,
    );

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const body: TConfig = {
            timestamp: Date.now() / 1000,
            checkout: {
                notification_interval_sec:
                    config.checkout.notification_interval_sec,
            },
            file: {
                max_upload_capacity: config.file.max_upload_capacity,
                max_upload_count: config.file.max_upload_count,
            },
            schedule: {
                days_open: config.schedule.days_open,
                first_display_day: config.schedule.first_display_day,
                schedulable_roles: config.schedule.schedulable_roles,
                increment_sec: config.schedule.increment_sec,
            },
        };

        formData.forEach((value, key) => {
            const num_value = parseInt(value as string);
            if (isNaN(num_value)) return;
            switch (key) {
                case "notification_interval_days":
                    body.checkout.notification_interval_sec =
                        (body.checkout.notification_interval_sec ?? 0) +
                        (num_value - notification_interval_days) * 24 * 60 * 60;
                    break;
                case "notification_interval_hours":
                    body.checkout.notification_interval_sec =
                        (body.checkout.notification_interval_sec ?? 0) +
                        (num_value - notification_interval_hours) * 60 * 60;
                    break;
                case "notification_interval_mins":
                    body.checkout.notification_interval_sec =
                        (body.checkout.notification_interval_sec ?? 0) +
                        (num_value - notification_interval_mins) * 60;
                    break;
                case "notification_interval_secs":
                    body.checkout.notification_interval_sec =
                        (body.checkout.notification_interval_sec ?? 0) +
                        (num_value - notification_interval_secs);
                    break;
                case "max_upload_gb":
                    body.file.max_upload_capacity =
                        (body.file.max_upload_capacity ?? 0) +
                        (num_value - max_upload_gb) * 1024 * 1024 * 1024;
                    break;
                case "max_upload_mb":
                    body.file.max_upload_capacity =
                        (body.file.max_upload_capacity ?? 0) +
                        (num_value - max_upload_mb) * 1024 * 1024;
                    break;
                case "max_upload_kb":
                    body.file.max_upload_capacity =
                        (body.file.max_upload_capacity ?? 0) +
                        (num_value - max_upload_kb) * 1024;
                    break;
                case "max_upload_bytes":
                    body.file.max_upload_capacity =
                        (body.file.max_upload_capacity ?? 0) +
                        (num_value - max_upload_bytes);
                    break;
                case "max_upload_count":
                    body.file.max_upload_count = num_value;
                    break;
                case "shift_increment_hours":
                    body.schedule.increment_sec =
                        (body.schedule.increment_sec ?? 0) +
                        (num_value - shift_increment_hours) * 60 * 60;
                    break;
                case "shift_increment_mins":
                    body.schedule.increment_sec =
                        (body.schedule.increment_sec ?? 0) +
                        (num_value - shift_increment_mins) * 60;
                    break;
            }
        });

        const days_open = formData.getAll("days_open") as string[];
        if (days_open.length === 0) {
            body.schedule.days_open = [0, 1, 2, 3, 4, 5, 6];
        } else {
            body.schedule.days_open = days_open.map((day) => parseInt(day));
        }

        const first_display_day = parseInt(
            formData.get("first_display_day") as string,
        );
        if (isNaN(first_display_day)) {
            body.schedule.first_display_day = 0;
        } else {
            body.schedule.first_display_day = first_display_day;
        }

        const schedulable_roles = formData.getAll("roles") as string[];
        if (schedulable_roles.length > 0) {
            body.schedule.schedulable_roles = schedulable_roles;
        }

        // Update the config
        mutation.mutate({ config: body });
    };

    return (
        <>
            <Form
                onSubmit={onSubmit}
                className="w-full h-full overflow-auto"
                validationBehavior="native"
            >
                <Card className="w-4/5 h-full p-4 mx-auto flex flex-col gap-4 items-center overflow-auto">
                    <h1 className="text-2xl font-bold align-center text-primary-400">
                        Settings & Configuration
                    </h1>
                    <Divider className="w-4/5 h-[1px] bg-primary-100" />
                    <Accordion
                        selectionMode="multiple"
                        variant="splitted"
                        itemClasses={{
                            base: "bg-content2 border-primary-100 border-2",
                            indicator: "text-default-800",
                            title: "text-default-800 font-semibold text-lg",
                            content: "flex flex-col gap-2 pb-5",
                        }}
                        className="w-4/5"
                    >
                        <AccordionItem key="checkout" title="Checkout Config">
                            <ConfigItem
                                name="Late Checkout Notification Interval"
                                description="The interval at which to send late checkout notifications."
                            >
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_days.toString()}
                                    min={0}
                                    name="notification_interval_days"
                                    color="primary"
                                    variant="faded"
                                    endContent="days"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_hours.toString()}
                                    min={0}
                                    name="notification_interval_hours"
                                    color="primary"
                                    variant="faded"
                                    endContent="hours"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_mins.toString()}
                                    min={0}
                                    name="notification_interval_mins"
                                    color="primary"
                                    variant="faded"
                                    endContent="minutes"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_secs.toString()}
                                    min={0}
                                    name="notification_interval_secs"
                                    color="primary"
                                    variant="faded"
                                    endContent="seconds"
                                />
                            </ConfigItem>
                        </AccordionItem>
                        <AccordionItem key="file" title="File Config">
                            <ConfigItem
                                name="Max Upload Capacity per User"
                                description="The maximum disk usage allowed as file uploads per user. If not set, there is no limit."
                            >
                                <Input
                                    type="number"
                                    defaultValue={
                                        config.file.max_upload_capacity
                                            ? max_upload_gb.toString()
                                            : ""
                                    }
                                    min={0}
                                    name="max_upload_gb"
                                    color="primary"
                                    variant="faded"
                                    endContent="GB"
                                />
                                <Input
                                    type="number"
                                    defaultValue={
                                        config.file.max_upload_capacity
                                            ? max_upload_mb.toString()
                                            : ""
                                    }
                                    min={0}
                                    name="max_upload_mb"
                                    color="primary"
                                    variant="faded"
                                    endContent="MB"
                                />
                                <Input
                                    type="number"
                                    defaultValue={
                                        config.file.max_upload_capacity
                                            ? max_upload_kb.toString()
                                            : ""
                                    }
                                    min={0}
                                    name="max_upload_kb"
                                    color="primary"
                                    variant="faded"
                                    endContent="KB"
                                />
                                <Input
                                    type="number"
                                    defaultValue={
                                        config.file.max_upload_capacity
                                            ? max_upload_bytes.toString()
                                            : ""
                                    }
                                    min={0}
                                    name="max_upload_bytes"
                                    color="primary"
                                    variant="faded"
                                    endContent="bytes"
                                />
                            </ConfigItem>
                            <ConfigItem
                                name="Max Upload Count per User"
                                description="The maximum number of files a user can upload at a time. If not set, there is no limit."
                            >
                                <Input
                                    type="number"
                                    defaultValue={
                                        config.file.max_upload_count?.toString() ??
                                        ""
                                    }
                                    min={0}
                                    name="max_upload_count"
                                    color="primary"
                                    variant="faded"
                                    endContent="files"
                                />
                            </ConfigItem>
                        </AccordionItem>
                        <AccordionItem key="schedule" title="Schedule Config">
                            <ConfigItem
                                name="Shift Increment"
                                description="The smallest length of time for each shift (15 minutes, 30 minutes, etc.)"
                            >
                                <Input
                                    type="number"
                                    defaultValue={shift_increment_hours.toString()}
                                    min={0}
                                    name="shift_increment_hours"
                                    color="primary"
                                    variant="faded"
                                    endContent="hours"
                                />
                                <Input
                                    type="number"
                                    defaultValue={shift_increment_mins.toString()}
                                    min={0}
                                    name="shift_increment_mins"
                                    color="primary"
                                    variant="faded"
                                    endContent="minutes"
                                />
                                {/* no seconds
                                    <Input  
                                    type="number"
                                    defaultValue={notification_interval_secs.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="shift_increment_secs"
                                    color="primary"
                                    variant="faded"
                                    endContent="seconds"
                                /> */}
                            </ConfigItem>
                            <ConfigItem
                                name="Open days"
                                description="The days of the week the space is open, to display on the schedule. Defaults to all days."
                            >
                                <Select
                                    name="days_open"
                                    defaultSelectedKeys={
                                        config.schedule.days_open?.map(
                                            (day) => `${day}`,
                                        ) ?? []
                                    }
                                    selectionMode="multiple"
                                    placeholder="Select days"
                                    variant="faded"
                                    color="primary"
                                    aria-label="Select days"
                                    classNames={{
                                        value: "capitalize",
                                    }}
                                    renderValue={(days) => {
                                        if (days.length === 7)
                                            return "All Days";
                                        return days
                                            .map((day) => day.textValue)
                                            .join(", ");
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                                        <SelectItem
                                            key={`${index}`}
                                            value={SHIFT_DAY[index]}
                                            aria-label={SHIFT_DAY[index]}
                                            textValue={SHIFT_DAY[
                                                index
                                            ]?.toLowerCase()}
                                            classNames={{
                                                title: "capitalize",
                                            }}
                                        >
                                            {SHIFT_DAY[index]?.toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </ConfigItem>
                            <ConfigItem
                                name="First Display Day"
                                description="The first day of the week to display on the schedule. Defaults to Sunday."
                            >
                                <Select
                                    name="first_display_day"
                                    defaultSelectedKeys={[
                                        `day${config.schedule.first_display_day ?? 0}`,
                                    ]}
                                    selectionMode="single"
                                    placeholder="Select day"
                                    variant="faded"
                                    color="primary"
                                    aria-label="Select day"
                                    classNames={{
                                        value: "capitalize",
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                                        <SelectItem
                                            key={`day${index}`}
                                            value={SHIFT_DAY[index]}
                                            aria-label={SHIFT_DAY[index]}
                                            textValue={SHIFT_DAY[
                                                index
                                            ]?.toLowerCase()}
                                            classNames={{
                                                title: "capitalize",
                                            }}
                                        >
                                            {SHIFT_DAY[index]?.toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </ConfigItem>
                            <ConfigItem
                                name="Schedulable Roles"
                                description="The roles that can be scheduled in the schedule editor."
                            >
                                <UserRoleSelect
                                    defaultSelectedKeys={
                                        config.schedule.schedulable_roles
                                    }
                                />
                            </ConfigItem>
                        </AccordionItem>
                    </Accordion>
                    <Button
                        type="submit"
                        color="primary"
                        variant="solid"
                        size="lg"
                        className="mt-auto flex-none mb-0"
                    >
                        Save Changes
                    </Button>
                </Card>
            </Form>
            <PopupAlert
                isOpen={!!popupMessage}
                onOpenChange={() => setPopupMessage(undefined)}
                color={popupType}
                description={popupMessage}
            />
        </>
    );
}
