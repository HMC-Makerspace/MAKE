import AdminLayout from "../../layouts/AdminLayout";

export default function AdminPage() {
    return (
        <AdminLayout pageHref={"/admin"}>
            <h1>Admin Page</h1>
        </AdminLayout>
    );
}
