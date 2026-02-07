import AdminLayout from "../../layouts/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { TConfig } from "common/config";
import Configuration from "../../components/kiosks/admin/settings/Configuration";
import { TEmbed } from "common/embed";
import { TUserRole } from "common/user";

export default function SettingsKiosk() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });

    const { data: embeds, isLoading: embedsLoading } = useQuery<TEmbed[]>({
        queryKey: ["embed"],
        refetchOnWindowFocus: false,
    });
    // const embedsLoading = false;
    // const embeds: TEmbed[] = [
    //     {
    //         uuid: "events1",
    //         title: "Events",
    //         src: "https://calendar.google.com/calendar/embed?src=c_8rrmu0a9da7jlegoen52aosglc%40group.calendar.google.com&ctz=America%2FLos_Angeles",
    //         documents: [],
    //         auto_dark: true,
    //         visible_to: null,
    //     },
    //     {
    //         uuid: "management2",
    //         title: "Management",
    //         src: "https://calendar.google.com/calendar/embed?src=c_7f0eb8454a7ab406a29fbfb27accb936db3f9d86ab859cebc3bcc78572d94e88%40group.calendar.google.com&ctz=America%2FLos_Angeles",
    //         documents: [],
    //         auto_dark: true,
    //         visible_to: null,
    //     },
    // ];

    const { data: roles, isLoading: rolesLoading } = useQuery<TUserRole[]>({
        queryKey: ["user", "role"],
        refetchOnWindowFocus: false,
    });

    if (configLoading || rolesLoading || embedsLoading || !roles || !embeds)
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
            <Configuration config={config} embeds={embeds} roles={roles} />
        </AdminLayout>
    );
}
