import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import { Tabs, Tab, Spinner } from "@heroui/react";
import { TWorkshop } from "../../common/workshop.ts";
import { TUser } from "common/user.js";
import { Key, useState } from "react";
import {
    CalendarDateRangeIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { TCertification } from "common/certification.ts";
import WorkshopCard from "../components/public/workshops/WorkshopCard.tsx";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMediaQuery } from "../utils.tsx";
import React from "react";

export default function WorkshopPage() {
    const [selected, setSelected] = useState<Key>("current-workshops");
    const {
        data: workshops,
        isLoading: workshopsLoading,
        isError: workshopsError,
    } = useQuery<TWorkshop[]>({
        queryKey: ["workshop", "public"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: users,
        isLoading: usersLoading,
        isError: usersError,
    } = useQuery<TUser[]>({
        queryKey: ["user", "public"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: certifications,
        isLoading: certsLoading,
        isError: certsError,
    } = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    const {
        data: self,
        isLoading: selfLoading,
        isError: selfError,
    } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    let filteredWorkshops = workshops?.filter((workshop) => {
        const isFuture = workshop.timestamp_end > Date.now() / 1000;
        return selected === "past-workshops" ? !isFuture : isFuture;
    });
    if (selected === "current-workshops") {
        filteredWorkshops = filteredWorkshops?.reverse();
    }

    const scrollerRef = React.useRef<HTMLElement | null>(null);

    const columns = useMediaQuery("(min-width:768px)") ? 2 : 1;
    const rows = Math.ceil((filteredWorkshops?.length ?? 0) / columns);

    const workshopVirtualizer = useVirtualizer({
        count: rows ?? 0,
        getScrollElement: () => scrollerRef.current,
        estimateSize: () => 360,
        overscan: 4,
        getItemKey: (index) => filteredWorkshops?.[index]?.uuid ?? index,
        gap: 16,
    });

    return (
        <DefaultLayout className="p-8" pageHref="/workshops">
            <div
                id="master"
                className="flex gap-4 flex-col h-full items-center"
            >
                <Tabs
                    aria-label="past-present-workshop-toggle"
                    color="primary"
                    variant="bordered"
                    selectedKey={selected as string}
                    onSelectionChange={setSelected}
                    className="justify-self-center"
                >
                    <Tab
                        key="current-workshops"
                        title={
                            <div className="flex items-center space-x-2">
                                <CalendarDateRangeIcon className="size-6" />
                                <span>Current Workshops</span>
                            </div>
                        }
                    />
                    <Tab
                        key="past-workshops"
                        title={
                            <div className="flex items-center space-x-2">
                                <CalendarDaysIcon className="size-6" />
                                <span>Past Workshops</span>
                            </div>
                        }
                    />
                </Tabs>
                <main
                    ref={scrollerRef}
                    className="w-full overflow-auto relative"
                >
                    <div
                        style={{
                            height: `${workshopVirtualizer.getTotalSize()}px`,
                        }}
                        className="w-full relative"
                    >
                        {filteredWorkshops ? (
                            workshopVirtualizer
                                .getVirtualItems()
                                .map((virtualItem) => {
                                    const rowWorkshops =
                                        filteredWorkshops.slice(
                                            virtualItem.index * columns,
                                            virtualItem.index * columns +
                                                columns,
                                        );

                                    return (
                                        <div
                                            key={virtualItem.index}
                                            data-index={virtualItem.index}
                                            ref={
                                                workshopVirtualizer.measureElement
                                            }
                                            className="absolute top-0 left-0 w-full flex flex-row gap-4"
                                            style={{
                                                transform: `translateY(${virtualItem.start}px)`,
                                                height: `${virtualItem.size}px`,
                                            }}
                                        >
                                            {rowWorkshops.map((workshop) => {
                                                return (
                                                    <div
                                                        className={
                                                            columns === 2
                                                                ? "w-1/2 min-w-0"
                                                                : "w-full"
                                                        }
                                                    >
                                                        <WorkshopCard
                                                            workshop={workshop}
                                                            self={self}
                                                            users={users}
                                                            certifications={
                                                                certifications
                                                            }
                                                            key={workshop.uuid}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                        ) : (
                            <div className="size-full flex items-center justify-center">
                                No workshops are currently available. Please
                                check back later!
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </DefaultLayout>
    );
}
