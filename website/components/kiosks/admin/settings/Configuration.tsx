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
import { SHIFT_DAY, SHIFT_DAYS } from "../../../../../common/shift";
import { UserRoleSelect } from "../../../../components/user/UserRoleSelect";
import axios from "axios";
import React from "react";
import PopupAlert from "../../../../components/PopupAlert";
import clsx from "clsx";
import { PlusIcon } from "@heroicons/react/24/solid";

function ConfigItem({
    name,
    description,
    className,
    children,
}: {
    name: string;
    description: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2 w-full rounded-xl bg-content1 p-4">
            <h1 className="text-lg font-bold">{name}</h1>
            <p className="text-sm">{description}</p>
            <div className={clsx("flex flex-row gap-2", className)}>
                {children}
            </div>
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
            general: {
                branding_url: config.general.branding_url,
                tagline: config.general.tagline,
                discord_url: config.general.discord_url,
                instagram_url: config.general.instagram_url,
                tiktok_url: config.general.tiktok_url,
                extra_urls: config.general.extra_urls,
            },
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
                timezone: config.schedule.timezone,
            },
        };

        // Number values
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

        body.general.branding_url = formData.get("branding_url") as string;
        body.general.tagline = formData.get("tagline") as string;
        body.general.discord_url = formData.get("discord_url") as string;
        body.general.instagram_url = formData.get("instagram_url") as string;
        body.general.tiktok_url = formData.get("tiktok_url") as string;
        body.general.extra_urls = (formData.get("extra_urls") as string)
            .replace(" ", "")
            .split(",");

        const days_open = formData.getAll("days_open") as string[];
        if (days_open.length === 0) {
            body.schedule.days_open = [0, 1, 2, 3, 4, 5, 6];
        } else {
            body.schedule.days_open = days_open
                .map((day) => SHIFT_DAYS.find((d) => d.key === day)?.day)
                .filter((d) => d != undefined);
        }

        const first_display_key = formData.get("first_display_day") as string;

        const first_display_day = SHIFT_DAYS.find(
            (d) => d.key === first_display_key,
        )?.day;
        if (!first_display_day) {
            body.schedule.first_display_day = 0;
        } else {
            body.schedule.first_display_day = first_display_day;
        }

        const schedulable_roles = formData.getAll("roles") as string[];
        if (schedulable_roles.length > 0) {
            body.schedule.schedulable_roles = schedulable_roles;
        }

        const timezone = formData.get("timezone") as string;
        if (timezone) {
            body.schedule.timezone = timezone;
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
                        <AccordionItem key="general" title="General Config">
                            <ConfigItem
                                name="Branding"
                                description="The url which the branding image will direct users, likely your college's website."
                            >
                                <Input
                                    type="text"
                                    defaultValue={config.general.branding_url}
                                    name="branding_url"
                                    color="primary"
                                    variant="faded"
                                    placeholder="Please include the http:// or https://"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                            </ConfigItem>
                            <ConfigItem
                                name="Tagline"
                                description="The site tagline to display below the MAKE logo."
                            >
                                <Input
                                    type="text"
                                    defaultValue={config.general.tagline}
                                    name="tagline"
                                    color="primary"
                                    variant="faded"
                                    placeholder="Enter your tagline..."
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                            </ConfigItem>
                            <ConfigItem
                                name="Home Links"
                                description="Links available on the main homepage, visible to all users."
                                className="flex-col"
                            >
                                <Input
                                    type="text"
                                    defaultValue={config.general.discord_url}
                                    name="discord_url"
                                    color="primary"
                                    variant="faded"
                                    startContent={
                                        // From Bootstrap Icons
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
                                        </svg>
                                    }
                                    placeholder="E.g. https://discord.com/invite/abcdefg"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                                <Input
                                    type="text"
                                    defaultValue={config.general.instagram_url}
                                    name="instagram_url"
                                    color="primary"
                                    variant="faded"
                                    startContent={
                                        // From Bootstrap Icons
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
                                        </svg>
                                    }
                                    placeholder="E.g. https://www.instagram.com/accountname"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                                <Input
                                    type="text"
                                    defaultValue={config.general.tiktok_url}
                                    name="tiktok_url"
                                    color="primary"
                                    variant="faded"
                                    startContent={
                                        // From Bootstrap Icons
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
                                        </svg>
                                    }
                                    placeholder="E.g. https://www.tiktok.com/@accountname"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                                <Input
                                    type="text"
                                    defaultValue={config.general.extra_urls?.join(
                                        ",",
                                    )}
                                    name="extra_urls"
                                    color="primary"
                                    variant="faded"
                                    startContent={
                                        <PlusIcon className="size-4" />
                                    }
                                    placeholder="Enter additional urls separated by commas"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                />
                            </ConfigItem>
                        </AccordionItem>
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
                                    items={SHIFT_DAYS}
                                    name="days_open"
                                    defaultSelectedKeys={
                                        config.schedule.days_open?.map(
                                            (day) => `day${day}`,
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
                                    {(item) => (
                                        <SelectItem
                                            key={item.key}
                                            aria-label={item.name}
                                            textValue={item.name}
                                            classNames={{
                                                title: "capitalize",
                                            }}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    )}
                                </Select>
                            </ConfigItem>
                            <ConfigItem
                                name="First Display Day"
                                description="The first day of the week to display on the schedule. Defaults to Sunday."
                            >
                                <Select
                                    items={SHIFT_DAYS}
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
                                    {(item) => (
                                        <SelectItem
                                            key={item.key}
                                            aria-label={item.name}
                                            textValue={item.name}
                                            classNames={{
                                                title: "capitalize",
                                            }}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    )}
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
