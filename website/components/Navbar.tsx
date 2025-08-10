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
import MAKE from "./public/home/MAKE";
import Branding from "./public/home/Branding";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { MAKEUser } from "./user/MAKEUser";
import { motion } from "framer-motion";
import { useNavigate, Link as RouteLink } from "react-router-dom";

export default function CustomNavbar({
    pages,
    pageIndex,
}: {
    pages: {
        name: string;
        href: string;
        icon: React.ForwardRefExoticComponent<
            Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
                title?: string;
                titleId?: string;
            } & React.RefAttributes<SVGSVGElement>
        >;
    }[];
    pageIndex: number;
}) {
    const navigate = useNavigate();

    return (
        <>
            {/* Large screen sidebar */}
            <div
                className={clsx(
                    "bg-primary-500",
                    "dark:bg-primary-300",
                    "hidden xl:flex flex-col",
                    "justify-start py-2",
                    "w-[224px]",
                    "fixed z-50 h-full",
                )}
            >
                <MAKE className="self-center text-5xl" />
                <div className="pt-4 pr-4 flex flex-col">
                    {pages.map((page, index) => (
                        <motion.div
                            key={`page-${page.name}-${index}`}
                            className={clsx(
                                "flex gap-3 items-center pl-6 pr-4",
                                "py-3 font-bold rounded-r-xl",
                                "transition-colors text-lg text-nowrap",
                                "hover:bg-default-100 cursor-pointer",
                                pageIndex === index
                                    ? "text-foreground-800 bg-default-100"
                                    : "text-default-100 hover:text-foreground-800",
                            )}
                            whileTap={{
                                scaleY: 0.97,
                                translateX: -1,
                            }}
                            onClick={() =>
                                navigate(page.href, { viewTransition: true })
                            }
                        >
                            {page.icon && <page.icon className="size-5" />}
                            {/* <Link
                                href={page.href}
                                className="text-lg text-inherit text-nowrap"
                            > */}
                            {page.name}
                            {/* </Link> */}
                        </motion.div>
                    ))}
                </div>
                {/* Branding */}
                <div className="self-center mt-auto pb-4">
                    <Branding />
                </div>
                <div className="px-4 self-center w-full flex justify-center">
                    <MAKEUser user_uuid={"self"} size="lg" />
                </div>
            </div>
            {/* Small screen navbar */}
            <Navbar
                className={clsx([
                    "w-full",
                    "bg-primary-500",
                    "dark:bg-primary-300",
                    "flex xl:hidden",
                    "",
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
                                                : "text-foreground-900",
                                        )}
                                        strokeWidth={
                                            pageIndex === index ? 2.5 : 1.5
                                        }
                                    />
                                )}
                                <RouteLink
                                    to={page.href}
                                    className="text-3xl text-inherit"
                                    viewTransition
                                >
                                    {page.name}
                                </RouteLink>
                            </div>
                        ))}
                    </div>
                    <Card className="bg-default-200 p-2 flex-row gap-3 w-fit self-center">
                        <Branding />
                        <div className="flex flex-col justify-between">
                            <MAKEUser user_uuid={"self"} size="lg" />
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
