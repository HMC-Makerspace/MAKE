import { LinkIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Accordion, AccordionItem } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { TAlert } from "common/schedule";
import { useNavigate } from "react-router-dom";

export default function ActiveAlert() {
    const { data: active_alert, isLoading: alertLoading } =
        useQuery<TAlert | null>({
            queryKey: ["schedule", "active", "alert"],
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch this when the page is switched to
        });
    return (
        <div
            className={clsx(
                "absolute top-2 w-full min-h-16",
                "rounded-xl bg-secondary-400/50",
                "border-secondary-400 border-2",
                "transition-opacity content-center py-3",
                (!active_alert || alertLoading) && "opacity-0",
            )}
        >
            {active_alert ? (
                <Accordion
                    // isCompact
                    className="min-h-full"
                    selectedKeys={!active_alert.message ? [] : undefined}
                >
                    <AccordionItem
                        key="alert"
                        className=""
                        title={active_alert.header}
                        classNames={{
                            content: "text-foreground px-2 whitespace-pre-line",
                            title: "text-center text-content1-foreground text-xl font-medium",
                            trigger: "align-middle h-full pr-2",
                        }}
                        indicator={
                            active_alert.link ? (
                                <LinkIcon className="size-6 text-secondary-400" />
                            ) : active_alert.message ? (
                                <InformationCircleIcon className="size-6 text-secondary-400" />
                            ) : (
                                <></>
                            )
                        }
                        onPress={() =>
                            active_alert.link && window.open(active_alert.link)
                        }
                        // isDisabled={}
                        hideIndicator={
                            !active_alert.message && !active_alert.link
                        }
                    >
                        {active_alert.message}
                    </AccordionItem>
                </Accordion>
            ) : (
                <></>
            )}
        </div>
    );
}
