import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";
import Configuration from "../../components/kiosks/admin/settings/Configuration";

export default function SettingsPage() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    if (configLoading)
        return (
            <AdminLayout pageHref="/admin/settings">
                <div>Loading...</div>
            </AdminLayout>
        );

    if (!config) {
        return (
            <AdminLayout pageHref="/admin/settings">
                <div>Invalid configuration</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout pageHref="/admin/settings">
            <Configuration config={config} />
        </AdminLayout>
    );
}
