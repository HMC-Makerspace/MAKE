import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, SlotsToClasses, Tab, Tabs } from "@heroui/react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";

export function ThemeSwitcher({
    className = "",
    classNames = {
        tabList: "gap-0",
    },
}: {
    className?: string;
    classNames?: SlotsToClasses<
        | "base"
        | "tabList"
        | "tab"
        | "tabContent"
        | "cursor"
        | "panel"
        | "tabWrapper"
    >;
}) {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className={clsx("flex flex-row space-x-4", className)}>
            <Tabs
                color="primary"
                size="sm"
                radius="full"
                selectedKey={theme}
                onSelectionChange={(key) => setTheme(key as string)}
                classNames={classNames}
            >
                <Tab key={"dark"} title={<MoonIcon className="size-5" />} />
                <Tab
                    key={"light"}
                    title={
                        <SunIcon className="size-6 text-background dark:text-inherit" />
                    }
                />
            </Tabs>
        </div>
    );
}
