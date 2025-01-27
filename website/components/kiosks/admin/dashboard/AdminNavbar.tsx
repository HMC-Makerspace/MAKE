import clsx from "clsx";
import { AdminPage } from "../../../../layouts/AdminLayout";
import {
    Button,
    Card,
    CardHeader,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
    User,
} from "@heroui/react";
import { useMAKEStore } from "../../../../store";
import { MAKEUser } from "../../../user/User";
import { ThemeSwitcher } from "../../../ThemeSwitcher";

export default function AdminNavbar({
    pages,
    pageIndex,
}: {
    pages: { name: string; href: string }[];
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
                className="hidden lg:flex gap-8 overflow-x-auto"
            >
                {
                    // Iterate over the ADMIN_PAGES (excluding home) and create a link for each
                    pages.map((page, index) =>
                        page.name === "Home" ? null : (
                            <Link
                                key={`page-${page.name}-${index}`}
                                href={page.href}
                                className={clsx([
                                    "text-xl font-semibold",
                                    pageIndex === index
                                        ? "font-bold text-primary-400"
                                        : " text-foreground-900",
                                ])}
                            >
                                {page.name}
                            </Link>
                        ),
                    )
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
