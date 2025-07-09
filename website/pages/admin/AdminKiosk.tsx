import AdminLayout from "../../layouts/AdminLayout";

export default function AdminKiosk() {
    return (
        <AdminLayout pageHref={"/admin"}>
            <div className="w-full text-2xl text-center pt-4">
                Welcome to the administrator dashboard. Please select a kiosk to
                begin.
            </div>
        </AdminLayout>
    );
}
