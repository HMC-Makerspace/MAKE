import DefaultLayout from "../layouts/Default";
import StaticFAQItem from "../components/kiosks/admin/settings/StaticFAQItem";
import { useConfig } from "../queries/useConfig";

export default function FAQPage() {
    const config = useConfig();
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
