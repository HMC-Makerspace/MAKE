import { useQuery } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import { Tabs, Tab } from "@heroui/react";
import { TWorkshop } from "../../common/workshop.ts";
import { TUser } from "common/user.js";
import { Key, useState } from "react";
import {
    CalendarDateRangeIcon,
    CalendarDaysIcon,
} from "@heroicons/react/24/solid";
import { TCertification } from "common/certification.ts";
import { TConfig } from "common/config.js";
import WorkshopCard from "../components/public/workshops/WorkshopCard.tsx";

export default function WorkshopPage() {
    const [selected, setSelected] = useState<Key>("current-workshops");
    const {
        data: workshops,
        isLoading: workshopsLoading,
        isError: workshopsError,
    } = useQuery<TWorkshop[]>({
        queryKey: ["workshop"],
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
        queryKey: ["certification", "public"],
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

    const { data: config, isLoading: configLoading } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    let filteredWorkshops = workshops?.filter((workshop) => {
        const isFuture = workshop.timestamp_end > Date.now() / 1000;
        return selected === "past-workshops" ? !isFuture : isFuture;
    });
    if (selected === "current-workshops") {
        filteredWorkshops = filteredWorkshops?.reverse();
    }

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
                {filteredWorkshops &&
                    (filteredWorkshops.length > 0 ? (
                        <div
                            id="card-container"
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full"
                        >
                            {filteredWorkshops.map((workshop) => (
                                <WorkshopCard
                                    workshop={workshop}
                                    self={self}
                                    users={users}
                                    certifications={certifications}
                                    config={config}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="size-full flex items-center justify-center">
                            No workshops are currently available. Please check
                            back later!
                        </div>
                    ))}
            </div>
        </DefaultLayout>
    );
}
