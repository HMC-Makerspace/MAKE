import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import { TConfig } from "common/config";
import StaticFAQItem from "../components/kiosks/admin/settings/StaticFAQItem";

export default function FAQPage() {
    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    return (
        <DefaultLayout className="px-4 lg:p-8" pageHref="/faq">
            <div className="size-full rounded-xl bg-default-50 p-3 overflow-auto">
                <div className="h-fit">
                    {config &&
                        (config.faq ? (
                            <StaticFAQItem faq_item={config.faq} />
                        ) : (
                            <div>Create an FAQ in the Settings kiosk!</div>
                        ))}
                </div>
            </div>
        </DefaultLayout>
    );
}
