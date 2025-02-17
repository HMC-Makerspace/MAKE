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
import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TCheckoutConfig, TConfig, TFileConfig } from "common/config";
import { SHIFT_DAY } from "../../../common/shift";
import { TUserRole } from "common/user";
import { UserRoleSelect } from "../../components/user/UserRoleSelect";

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

        const body = {
            checkout: {
                notification_interval_sec:
                    config.checkout.notification_interval_sec ?? 0,
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

        const notification_intervals: {
            [key: string]: { set: keyof TCheckoutConfig; mod: number };
        } = {
            notification_interval_days: {
                set: "notification_interval_sec",
                mod: 86400,
            },
            notification_interval_hours: {
                set: "notification_interval_sec",
                mod: 3600,
            },
            notification_interval_mins: {
                set: "notification_interval_sec",
                mod: 60,
            },
            notification_interval_secs: {
                set: "notification_interval_sec",
                mod: 1,
            },
        };
        const upload_capacities: {
            [key: string]: { set: keyof TFileConfig; mod: number };
        } = {
            max_upload_gb: {
                set: "max_upload_capacity",
                mod: 1024 * 1024 * 1024,
            },
            max_upload_mb: {
                set: "max_upload_capacity",
                mod: 1024 * 1024,
            },
            max_upload_kb: {
                set: "max_upload_capacity",
                mod: 1024,
            },
            max_upload_bytes: {
                set: "max_upload_capacity",
                mod: 1,
            },
        };

        formData.forEach((value, key) => {
            switch (key) {
                case "notification_interval_days":
                case "notification_interval_hours":
                case "notification_interval_mins":
                case "notification_interval_secs":
                case "max_upload_gb":
                case "max_upload_mb":
                case "max_upload_kb":
                case "max_upload_bytes":
                    const set_value = notification_intervals[key].set;
                    body.checkout[set_value] -= body.checkout[set_value];
                    break;
                case "max_upload_count":
                    body.file.max_upload_count = 0;
                    break;
                case "shift_increment_hours":
                case "shift_increment_mins":
                    body.schedule.increment_sec = 0;
                    break;
            }
        });

        const notification_interval_days = parseInt(
            formData.get("notification_interval_days") as string,
        );
        const notification_interval_hours = parseInt(
            formData.get("notification_interval_hours") as string,
        );
        const notification_interval_mins = parseInt(
            formData.get("notification_interval_mins") as string,
        );
        const notification_interval_secs = parseInt(
            formData.get("notification_interval_secs") as string,
        );
        const notification_interval_sec =
            notification_interval_days * 24 * 60 * 60 +
            notification_interval_hours * 60 * 60 +
            notification_interval_mins * 60 +
            notification_interval_secs;

        const max_upload_gb = parseInt(formData.get("max_upload_gb") as string);
        const max_upload_mb = parseInt(formData.get("max_upload_mb") as string);
        const max_upload_kb = parseInt(formData.get("max_upload_kb") as string);
        const max_upload_bytes = parseInt(
            formData.get("max_upload_bytes") as string,
        );
        const max_upload_capacity =
            max_upload_gb * 1024 * 1024 * 1024 +
            max_upload_mb * 1024 * 1024 +
            max_upload_kb * 1024 +
            max_upload_bytes;

        const max_upload_count = parseInt(
            formData.get("max_upload_count") as string,
        );

        const shift_increment_hours = parseInt(
            formData.get("shift_increment_hours") as string,
        );
        const shift_increment_mins = parseInt(
            formData.get("shift_increment_mins") as string,
        );
        const shift_increment_sec =
            shift_increment_hours * 60 * 60 + shift_increment_mins * 60;

        const days_open = formData.getAll("days_open") as string[];

        const first_display_day = parseInt(
            formData.get("first_display_day") as string,
        );

        const schedulable_roles = formData.getAll(
            "schedulable_roles",
        ) as string[];
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

    // Calculate intermediary shift increment values
    const shift_increment_sec = config.schedule.increment_sec ?? 0;
    const shift_increment_hours = Math.floor(shift_increment_sec / (60 * 60));
    const shift_increment_mins = Math.floor(
        (shift_increment_sec % (60 * 60)) / 60,
    );

    return (
        <AdminLayout pageHref="/admin/settings">
            <Form onSubmit={onSubmit} className="w-full h-full overflow-auto">
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
                                name="Shift Increment"
                                description="The smallest length of time for each shift (15 minutes, 30 minutes, etc.)"
                            >
                                <Input
                                    type="number"
                                    defaultValue={shift_increment_hours.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
                                    name="shift_increment_hours"
                                    color="primary"
                                    variant="faded"
                                    endContent="hours"
                                />
                                <Input
                                    type="number"
                                    defaultValue={shift_increment_mins.toString()}
                                    validate={(v) =>
                                        parseInt(v) >= 0
                                            ? true
                                            : "Must be a positive number"
                                    }
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
        </AdminLayout>
    );
}
