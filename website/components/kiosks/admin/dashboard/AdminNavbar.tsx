import clsx from "clsx";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuToggle,
} from "@heroui/react";
import { MAKEUser } from "../../../user/MAKEUser";
import { ThemeSwitcher } from "../../../ThemeSwitcher";
import { AdminPage } from "../../../../layouts/AdminLayout";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import MAKE from "../../../public/home/MAKE";

export default function AdminNavbar({
    pages,
    pageIndex,
}: {
    pages: AdminPage[];
    pageIndex: number;
}) {
    return (
        <Navbar
            className="w-full bg-primary-500 dark:bg-primary-300"
            classNames={{ wrapper: "max-w-full justify-none gap-0 pr-0" }}
        >
            <NavbarContent justify="start">
                {/* Branding, always visible */}
                <NavbarBrand className="justify-start">
                    <div className="w-[180px]">
                        <MAKE />
                    </div>
                </NavbarBrand>
            </NavbarContent>
            {/* Menu items, hide for small screens */}
            <NavbarContent
                justify="center"
                className={clsx([
                    "hidden lg:flex",
                    "px-8 gap-8 overflow-x-auto",
                    "data-[justify=center]:justify-start",
                ])}
            >
                {
                    // Iterate over the pages (excluding home) and create a link for each
                    pages.map((page, index) => {
                        const linkComponent = (
                            <Link
                                key={`page-${page.name}-${index}`}
                                href={page.href}
                                className={clsx([
                                    "text-xl font-medium gap-1",
                                    pageIndex === index
                                        ? "font-bold text-foreground-500"
                                        : " text-background",
                                ])}
                            >
                                {page.name}
                                {page.subPages && pageIndex == index && (
                                    <ChevronDownIcon className="size-5" />
                                )}
                            </Link>
                        );
                        if (page.subPages) {
                            return (
                                <Dropdown key={`page-${page.name}-${index}`}>
                                    <NavbarItem>
                                        <DropdownTrigger>
                                            {linkComponent}
                                        </DropdownTrigger>
                                    </NavbarItem>
                                    <DropdownMenu
                                        aria-label={`submenu-${page.name}`}
                                    >
                                        {page.subPages.map(
                                            (subPage, subIndex) => (
                                                <DropdownItem
                                                    as={Link}
                                                    key={`subpage-${subPage.name}-${subIndex}`}
                                                    href={subPage.href}
                                                    classNames={{
                                                        title: "text-md font-medium",
                                                    }}
                                                >
                                                    {subPage.name}
                                                </DropdownItem>
                                            ),
                                        )}
                                    </DropdownMenu>
                                </Dropdown>
                            );
                        }
                        return linkComponent;
                    })
                }
            </NavbarContent>
            <NavbarContent justify="end" className="pr-0">
                {/* Menu dropdown for small screens, hide for larger */}
                <NavbarMenuToggle className="lg:hidden text-background" />
                <MAKEUser
                    user_uuid={"self"}
                    className={clsx(
                        "rounded-r-none h-[85%]",
                        "data-[pressed=true]:translate-x-1",
                        "aria-expanded:translate-x-1",
                    )}
                />
            </NavbarContent>
            {/* Menu drop down, for small screens */}
            <NavbarMenu>
                {pages.map((page, index) => (
                    <Link
                        key={`page-${page.name}-${index}`}
                        href={page.href}
                        className={clsx([
                            "text-xl",
                            pageIndex === index
                                ? "font-bold text-primary-500"
                                : " text-foreground-900",
                        ])}
                    >
                        {page.name}
                    </Link>
                ))}
                <ThemeSwitcher />
            </NavbarMenu>
        </Navbar>
    );
}
