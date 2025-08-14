import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Accordion, AccordionItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { TAlert } from "common/schedule";

export default function ActiveAlert() {
    const { data: alert, isLoading: alertLoading } = useQuery<TAlert | null>({
        queryKey: ["schedule", "active", "alert"],
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch this when the page is switched to
    });
    // TODO: Possibly improve accordion if there is no message
    return (
        <div
            className={clsx(
                "absolute top-2 w-full min-h-16",
                "rounded-xl bg-secondary-400/50",
                "border-secondary-400 border-2",
                "transition-opacity content-center py-3",
                (!alert || alertLoading) && "opacity-0",
            )}
        >
            <Accordion isCompact className="min-h-full">
                {alert ? (
                    <AccordionItem
                        key="alert"
                        className=""
                        title={alert.header}
                        classNames={{
                            content:
                                "text-default-content2-foreground px-2 whitespace-pre-line",
                            title: "text-center text-content1-foreground",
                            trigger: "align-middle h-full",
                        }}
                        indicator={
                            <InformationCircleIcon className="size-6 text-secondary-400" />
                        }
                    >
                        {alert.message}
                    </AccordionItem>
                ) : (
                    <></>
                )}
            </Accordion>
        </div>
    );
}
