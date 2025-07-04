import {
    Button,
    Card,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
} from "@heroui/react";
import clsx from "clsx";
import { useMAKEStore } from "../store";
import {
    ArchiveBoxIcon,
    ArrowDownOnSquareIcon,
    ArrowDownTrayIcon,
    CalendarDaysIcon,
    CheckBadgeIcon,
    HomeIcon,
    QuestionMarkCircleIcon,
    RocketLaunchIcon,
    ShoppingCartIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/solid";
import MAKE from "./MAKE";
import Branding from "./Branding";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useQuery } from "@tanstack/react-query";
import { MAKEUser } from "./user/User";

export default function CustomNavbar() {
    const pageIndex = useMAKEStore((state) => state.page_index);
    const user_uuid = useMAKEStore((state) => state.user_uuid);

    const { data: config, isLoading: configLoading } = useQuery({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const pages = [
        {
            name: "Home",
            href: "/",
            icon: HomeIcon,
        },
        {
            name: "Certifications",
            href: "/certifications",
            icon: CheckBadgeIcon,
        },
        {
            name: "Areas",
            href: "/areas",
            icon: WrenchScrewdriverIcon,
        },
        {
            name: "Schedule",
            href: "/schedule",
            icon: CalendarDaysIcon,
        },
        {
            name: "Workshops",
            href: "/workshops",
            icon: RocketLaunchIcon,
        },
        {
            name: "Inventory",
            href: "/inventory",
            icon: ArchiveBoxIcon,
        },
        {
            name: "Quick Transfer",
            href: "/transfer",
            icon: ArrowDownOnSquareIcon,
        },
        {
            name: "Checkouts",
            href: "/checkouts",
            icon: ShoppingCartIcon,
        },
        {
            name: "FAQ",
            href: "/faq",
            icon: QuestionMarkCircleIcon,
        },
    ];

    return (
        <>
            {/* Large screen sidebar */}
            <div
                className={clsx(
                    "bg-primary-500",
                    "dark:bg-primary-300",
                    "hidden xl:flex flex-col",
                    "justify-start py-4",
                    "min-w-[250px]",
                )}
            >
                <MAKE className=" self-center text-5xl" />
                <div className={clsx("pt-4 pr-4 flex flex-col")}>
                    {pages.map((page, index) => (
                        <div
                            key={`page-${page.name}-${index}`}
                            className={clsx(
                                "flex gap-3 items-center pl-6 pr-4 py-3 font-bold",
                                pageIndex === index
                                    ? "text-foreground-800 bg-default-100 rounded-r-xl"
                                    : " text-default-100",
                            )}
                        >
                            {page.icon && (
                                <page.icon
                                    className={clsx(
                                        "size-5",
                                        pageIndex === index
                                            ? "text-foreground-800"
                                            : " text-default-100",
                                    )}
                                />
                            )}
                            <Link
                                href={page.href}
                                className="text-lg text-inherit text-nowrap"
                            >
                                {page.name}
                            </Link>
                        </div>
                    ))}
                </div>
                {/* Branding */}
                <div className="self-center mt-auto pb-4">
                    <Branding />
                </div>
                {/* <div className="mx-auto pt-1.5">
                    <ThemeSwitcher />
                </div> */}
                <div className="px-4 self-center">
                    <MAKEUser user_uuid={user_uuid} size="lg" />
                </div>
            </div>
            {/* Small screen navbar */}
            <Navbar
                className={clsx([
                    "w-full",
                    "bg-primary-500",
                    "dark:bg-primary-300",
                    "flex xl:hidden",
                ])}
                classNames={{ wrapper: "max-w-full" }}
            >
                <NavbarContent justify="start">
                    {/* Branding */}
                    <NavbarBrand className="justify-start">
                        <MAKE />
                    </NavbarBrand>
                </NavbarContent>
                <NavbarContent justify="end" className="">
                    {/* Menu dropdown toggle */}
                    <NavbarMenuToggle className="text-content1" />
                    {/* User info, hide for small screens
                <Button
                    as={Link}
                    href="/login"
                    color="default"
                    variant="shadow"
                    className="hidden sm:flex"
                >
                    Login
                </Button> */}
                </NavbarContent>
                {/* Menu drop down, for small screens */}
                <NavbarMenu className="gap-8">
                    <div className="flex flex-col gap-3">
                        {pages.map((page, index) => (
                            <div
                                key={`page-${page.name}-${index}`}
                                className={clsx(
                                    "flex gap-2 text-2xl items-center",
                                    pageIndex === index
                                        ? "font-bold text-primary-500"
                                        : "text-foreground-900",
                                )}
                            >
                                {page.icon && (
                                    <page.icon
                                        className={clsx(
                                            "size-7",
                                            pageIndex === index
                                                ? "text-primary-500"
                                                : " text-foreground-900",
                                        )}
                                        strokeWidth={
                                            pageIndex === index ? 2.5 : 1.5
                                        }
                                    />
                                )}
                                <Link
                                    href={page.href}
                                    className="text-3xl text-inherit"
                                >
                                    {page.name}
                                </Link>
                            </div>
                        ))}
                    </div>
                    <Card className="bg-default-200 p-2 flex-row gap-3 w-fit self-center">
                        <Branding />
                        <div className="flex flex-col justify-between">
                            <MAKEUser user_uuid={user_uuid} size="lg" />
                            <div className="flex flex-row w-full justify-between">
                                <ThemeSwitcher
                                    className="self-center w-full"
                                    classNames={{
                                        base: "w-full",
                                        tabList: "gap-0 w-full",
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                </NavbarMenu>
            </Navbar>
        </>
    );
}
