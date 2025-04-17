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
import { useMAKEStore } from "../../../../store";
import { MAKEUser } from "../../../user/User";
import { ThemeSwitcher } from "../../../ThemeSwitcher";
import { AdminPage } from "../../../../layouts/AdminLayout";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function AdminNavbar({
    pages,
    pageIndex,
}: {
    pages: AdminPage[];
    pageIndex: number;
}) {
    const user_uuid = useMAKEStore((state) => state.user_uuid);
    return (
        <Navbar
            className="w-full bg-default-200"
            classNames={{ wrapper: "max-w-full" }}
        >
            <NavbarContent justify="start">
                {/* Branding, always visible */}
                <NavbarBrand className="justify-start">
                    <Button
                        as={Link}
                        className={clsx([
                            "font-title font-semibold",
                            "text-5xl",
                            "text-primary-500",
                            "dark:text-primary-300",
                            "tracking-title pl-2 pr-0",
                        ])}
                        href="/"
                        variant="light"
                    >
                        MAKE
                    </Button>
                </NavbarBrand>
            </NavbarContent>
            {/* Menu items, hide for small screens */}
            <NavbarContent
                justify="center"
                className={clsx([
                    "hidden lg:flex",
                    "px-4 gap-8 overflow-x-auto",
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
                                    "text-xl font-semibold gap-1",
                                    pageIndex === index
                                        ? "font-bold text-primary-400"
                                        : " text-foreground-900",
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
            <NavbarContent justify="end">
                {/* Menu dropdown for small screens, hide for larger */}
                <NavbarMenuToggle className="lg:hidden text-primary" />
                <MAKEUser user_uuid={user_uuid} />
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
