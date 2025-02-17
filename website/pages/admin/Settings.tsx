import {
    Accordion,
    AccordionItem,
    Button,
    Card,
    Divider,
    Dropdown,
    Form,
    Input,
    Select,
    SelectedItemProps,
    SelectItem,
    TimeInput,
} from "@heroui/react";
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";
import { SHIFT_DAY } from "../../../common/shift";
import { TUserRole } from "common/user";
import { UserRoleSelect } from "../../components/user/UserRoleSelect";

const configData = [
    {
        title: "Checkout Config",
        options: [
            {
                name: "Late Checkout Notification Interval",
                description:
                    "The interval at which to send late checkout notifications",
                type: "time_seconds",
            },
        ],
    },
    {
        title: "File Config",
        options: [
            {
                name: "Max Upload Capacity per User",
                description:
                    "The maximum disk usage allowed as file uploads per user",
                type: "bytes",
            },
            {
                name: "Max Upload Count per User",
                description: "The maximum number of files a user can upload",
                type: "number",
            },
        ],
    },
    {
        title: "Schedule Config",
        options: [
            {
                name: "Open days",
                description: "The days of the week the space is open",
                type: "days",
            },
            {
                name: "First Display Day",
                description:
                    "The first day of the week to display on the schedule",
                type: "day",
            },
            {
                name: "Schedulable Roles",
                description: "The roles that can be scheduled",
                type: "roles",
                required: true,
            },
        ],
    },
    {
        title: "Shift Config",
        options: [
            {
                name: "Daily Start Time",
                description: "The time of day shifts start",
                type: "time",
                required: true,
            },
            {
                name: "Daily End Time",
                description: "The time of day shifts end",
                type: "time",
                required: true,
            },
            {
                name: "Shift Increment",
                description: "The increment between shifts",
                type: "shift_increment",
                required: true,
            },
        ],
    },
];

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

export default function SettingsPage() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "roles"],
        refetchOnWindowFocus: false,
    });

    if (configLoading)
        return (
            <AdminLayout pageHref="/admin/settings">
                <div>Loading...</div>
            </AdminLayout>
        );

    if (!config)
        return (
            <AdminLayout pageHref="/admin/settings">
                <div>Invalid configuration</div>
            </AdminLayout>
        );

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.forEach((value, key) => {
            console.log(key, value);
        });
        // console.log(formData.get("notification_interval_days"));
    };

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

    return (
        <AdminLayout pageHref="/admin/settings">
            <Form onSubmit={onSubmit} className="w-full h-full">
                <Card className="w-4/5 h-full p-4 mx-auto flex flex-col gap-4 items-center">
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
                                description="The interval at which to send late checkout notifications"
                            >
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_days.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="notification_interval_days"
                                    color="primary"
                                    variant="faded"
                                    endContent="days"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_hours.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="notification_interval_hours"
                                    color="primary"
                                    variant="faded"
                                    endContent="hours"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_mins.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="notification_interval_mins"
                                    color="primary"
                                    variant="faded"
                                    endContent="minutes"
                                />
                                <Input
                                    type="number"
                                    defaultValue={notification_interval_secs.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
                                    validate={(v) =>
                                        !v || parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
                                    validate={(v) =>
                                        !v || parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
                                    validate={(v) =>
                                        !v || parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
                                    validate={(v) =>
                                        !v || parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
                                    validate={(v) =>
                                        !v || parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="max_upload_count"
                                    color="primary"
                                    variant="faded"
                                    endContent="files"
                                />
                            </ConfigItem>
                        </AccordionItem>
                        <AccordionItem key="schedule" title="Schedule Config">
                            <ConfigItem
                                name="Open days"
                                description="The days of the week the space is open"
                            >
                                <Select
                                    name="days_open"
                                    defaultSelectedKeys={
                                        config.schedule.days_open
                                    }
                                    selectionMode="multiple"
                                    placeholder="Select days"
                                    variant="faded"
                                    color="primary"
                                    aria-label="Select days"
                                    classNames={{
                                        value: "text-default-500 capitalize",
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                                        <SelectItem
                                            key={index}
                                            value={SHIFT_DAY[index]}
                                            aria-label={SHIFT_DAY[index]}
                                            textValue={SHIFT_DAY[
                                                index
                                            ]?.toLowerCase()}
                                            classNames={{
                                                base: "text-default-800",
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
                                description="The first day of the week to display on the schedule. Defaults to Sunday"
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
                                        value: "text-default-500 capitalize",
                                    }}
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                                        <SelectItem
                                            key={`day${index}`}
                                            value={SHIFT_DAY[index]}
                                            aria-label={SHIFT_DAY[index]}
                                            textValue={SHIFT_DAY[
                                                index
                                            ]?.toLowerCase()}
                                            classNames={{
                                                base: "text-default-800",
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
                                description="The roles that can be scheduled"
                            >
                                <UserRoleSelect />
                            </ConfigItem>
                        </AccordionItem>
                    </Accordion>
                    <Button type="submit" color="primary" variant="solid">
                        Save Changes
                    </Button>
                </Card>
            </Form>
        </AdminLayout>
    );
}
