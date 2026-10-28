import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import Configuration from "../../components/kiosks/admin/settings/Configuration";
import { TEmbed } from "common/embed";
import { useRoles } from "../../queries/useRoles";
import { useConfig } from "../../queries/useConfig";

export default function SettingsKiosk() {
    const config = useConfig();

    const { data: embeds, isLoading: embedsLoading } = useQuery<TEmbed[]>({
        queryKey: ["embed"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useRoles();

    if (rolesLoading || embedsLoading || !roles || !embeds)
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
            <Configuration embeds={embeds} roles={roles} />
        </AdminLayout>
    );
}
