import React, { useCallback, useEffect } from "react";
import Navbar from "../components/Navbar";
import clsx from "clsx";
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
import { useMAKEStore } from "../store";
import { useQuery } from "@tanstack/react-query";
import { API_SCOPE } from "../../common/global";
import { verifyScopes } from "../utils";
import { useNavigate } from "react-router-dom";

const PAGES = [
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

// Create a default layout that takes ReactNode as children
export default function DefaultLayout({
    children,
    pageHref,
    className = "",
}: {
    children: React.ReactNode;
    pageHref: string;
    className?: string;
}) {
    const user_uuid = useMAKEStore((state) => state.user_uuid);
    const pageIndex = PAGES.findIndex((page) => page.href === pageHref);
    const navigate = useNavigate();

    const {
        data: scopes,
        isLoading: scopesLoading,
        isError: scopesError,
    } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        enabled: !!user_uuid,
    });
    const kioskAccess = scopes && verifyScopes(scopes, [API_SCOPE.VIEW_KIOSKS]);
    const handleKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === "k") {
            // If user is authorized, go to the kiosk page
            if (!scopesLoading && !scopesError && kioskAccess) {
                navigate("/admin");
            }
        }
    }, []);

    useEffect(() => {
        // attach the event listener
        document.addEventListener("keydown", handleKeyPress);

        // remove the event listener
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress]);

    return (
        <div className="flex flex-col xl:flex-row h-screen">
            <Navbar pages={PAGES} pageIndex={pageIndex} />
            <main
                className={clsx(
                    "relative mx-auto",
                    "h-[calc(100vh-64px)] sm:h-full",
                    "w-full flex-grow pl-8 py-4",
                    className,
                )}
            >
                {children}
            </main>
        </div>
    );
}
