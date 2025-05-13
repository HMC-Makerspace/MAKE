import {
    Button,
    Link,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarMenu,
    NavbarMenuToggle,
} from "@heroui/react";
import clsx from "clsx";
import { useMAKEStore } from "../store";

export default function CustomNavbar() {
    const pageIndex = useMAKEStore((state) => state.page_index);

    const pages = [
        {
            name: "Home",
            href: "/",
        },
        {
            name: "Admin",
            href: "/admin",
        },
    ];

    return (
        <Navbar
            className={clsx([
                "w-full",
                "bg-primary-500",
                "dark:bg-primary-300",
            ])}
            classNames={{ wrapper: "max-w-full" }}
        >
            <NavbarContent justify="start">
                {/* Branding, always visible */}
                <NavbarBrand className="justify-start">
                    <Link
                        className={clsx([
                            "font-title font-semibold text-5xl",
                            "tracking-title pl-2",
                            "text-background",
                            "dark:text-content1",
                        ])}
                        href="/"
                    >
                        MAKE
                    </Link>
                </NavbarBrand>
            </NavbarContent>
            {/* Menu items, hide for small screens */}
            <NavbarContent justify="center" className="hidden sm:flex">
                {
                    // Iterate over the pages (excluding home) and create a link for each
                    pages.map((page, index) =>
                        page.name === "Home" ? null : (
                            <Link
                                key={`page-${page.name}-${index}`}
                                href={page.href}
                                className={clsx([
                                    "text-xl font-semibold",
                                    pageIndex === index
                                        ? "font-bold text-primary-500"
                                        : " text-foreground-900",
                                ])}
                            >
                                {page.name}
                            </Link>
                        ),
                    )
                }
            </NavbarContent>
            <NavbarContent justify="end" className="">
                {/* Menu dropdown for small screens, hide for larger */}
                <NavbarMenuToggle className="sm:hidden text-content1" />
                <Button
                    as={Link}
                    href="/login"
                    color="default"
                    variant="shadow"
                    className="hidden sm:flex"
                >
                    Login
                </Button>
            </NavbarContent>
            {/* Menu drop down, for small screens */}
            <NavbarMenu>
                {pages.map((page, index) => (
                    <Link
                        key={`page-${page.name}-${index}`}
                        href={page.href}
                        className={clsx([
                            pageIndex === index
                                ? "font-bold text-primary-500"
                                : " text-foreground-900",
                        ])}
                    >
                        {page.name}
                    </Link>
                ))}
            </NavbarMenu>
        </Navbar>
    );
}

// export default function Navbar() {
//     return (
//         <div
//             id="navbar"
//             className={clsx([
//                 "flex flex-col",
//                 "items-center",
//                 "justify-between",
//                 "px-4 py-4",
//                 "bg-primary-300",
//                 "bg-background",
//                 "w-[210px]",
//             ])}
//         >
//             <Link
//                 className={clsx([
//                     "text-foreground-900",
//                     "font-title",
//                     "text-title font-semibold tracking-title pl-2",
//                 ])}
//             >
//                 MAKE
//             </Link>
//         </div>
//     );
// }
