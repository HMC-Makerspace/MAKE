import AdminNavbar from "../components/kiosks/admin/dashboard/AdminNavbar";
// import AdminSidebar from "../components/kiosks/admin/AdminSidebar";

export type AdminPage = {
    name: string;
    href: string;
    subpages?: AdminPage[];
};

const ADMIN_PAGES = [
    { name: "Dashboard", href: "/admin" },
    { name: "Users", href: "/admin/users" },
    { name: "Schedule", href: "/admin/schedule" },
    { name: "Shifts", href: "/admin/shifts" },
    { name: "Workshops", href: "/admin/workshops" },
    { name: "Restocks", href: "/admin/restocks" },
    { name: "Certifications", href: "/admin/certifications" },
    { name: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
    children,
    pageHref,
}: {
    children: React.ReactNode;
    pageHref: string;
}) {
    const pageIndex = ADMIN_PAGES.findIndex((page) => page.href === pageHref);
    return (
        <div className="relative flex flex-col h-screen bg-background">
            <AdminNavbar pages={ADMIN_PAGES} pageIndex={pageIndex} />
            <main className="container mx-auto max-w-7xl flex-grow px-8 py-4 overflow-auto">
                {children}
            </main>
        </div>
    );
}
