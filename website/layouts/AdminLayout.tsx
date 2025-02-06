import { useQuery } from "@tanstack/react-query";
import AdminNavbar from "../components/kiosks/admin/dashboard/AdminNavbar";
import { API_SCOPE } from "../../common/global";
import { Spinner } from "@heroui/react";
// import AdminSidebar from "../components/kiosks/admin/AdminSidebar";

export type AdminPage = {
    name: string;
    href: string;
    scope?: API_SCOPE;
    subPages?: AdminPage[];
};

const ADMIN_PAGES: AdminPage[] = [
    {
        name: "Dashboard",
        href: "/admin",
    },
    {
        name: "Users",
        href: "/admin/users",
        scope: API_SCOPE.USER_KIOSK,
        subPages: [
            {
                name: "Roles",
                href: "/admin/users/roles",
                scope: API_SCOPE.ROLES_KIOSK,
            },
        ],
    },
    {
        name: "Schedule",
        href: "/admin/schedule",
        scope: API_SCOPE.SCHEDULE_KIOSK,
    },
    {
        name: "Shifts",
        href: "/admin/shifts",
        scope: API_SCOPE.SHIFT_KIOSK,
    },
    {
        name: "Workshops",
        href: "/admin/workshops",
        scope: API_SCOPE.WORKSHOP_KIOSK,
    },
    {
        name: "Restocks",
        href: "/admin/restocks",
        scope: API_SCOPE.RESTOCK_KIOSK,
    },
    {
        name: "Certifications",
        href: "/admin/certifications",
        scope: API_SCOPE.CERTIFICATION_KIOSK,
    },
    {
        name: "Settings",
        href: "/admin/settings",
        scope: API_SCOPE.SETTINGS_KIOSK,
    },
];

export default function AdminLayout({
    children,
    pageHref,
}: {
    children: React.ReactNode;
    pageHref: string;
}) {
    // Get the current users scopes
    const { data, isLoading, isError } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
    });
    // Determine which pages the user has access to based on their scopes
    const scopes = data ?? [];
    const pages = scopes.includes(API_SCOPE.ADMIN)
        ? ADMIN_PAGES
        : // Filter out pages that the user does not have access to
          ADMIN_PAGES.filter((page) => {
              if (page.scope) {
                  return scopes.includes(page.scope);
              }
              return true;
              // Of those pages, filter out sub-pages that the user does not have access to
          }).map((page) => {
              if (page.subPages) {
                  return {
                      ...page,
                      subPages: page.subPages.filter((subPage) =>
                          subPage.scope ? scopes.includes(subPage.scope) : true,
                      ),
                  };
              }
              return page;
          });
    const pageIndex = ADMIN_PAGES.findIndex((page) => page.href === pageHref);
    return (
        <div className="relative flex flex-col h-screen bg-background">
            {isLoading ? (
                <Spinner className="h-[50px] w-full" />
            ) : isError ? (
                <div className="absolute inset-0 flex justify-center items-center bg-background">
                    <div className="text-default-400 text-lg">
                        Error loading user data
                    </div>
                </div>
            ) : (
                <AdminNavbar pages={pages} pageIndex={pageIndex} />
            )}
            <main className="container mx-auto flex-grow px-0 py-4 overflow-auto">
                {children}
            </main>
        </div>
    );
}
