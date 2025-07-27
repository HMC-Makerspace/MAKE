import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DefaultLayout from "../layouts/Default";
import {
    Card,
    CardFooter,
    Image,
    Button,
    Spinner,
    Input,
    Form,
    ToastProvider,
    closeToast,
    addToast,
} from "@heroui/react";
import {
    AcademicCapIcon,
    ArrowUpTrayIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/solid";
import React from "react";
import clsx from "clsx";
import { TWorkshop } from "../../common/workshop.ts";
import ImageCarousel from "../components/ImageCarousel.tsx";
import { FILE_RESOURCE_TYPE } from "../../common/file.ts";

export default function WorkshopPage() {
    const queryClient = useQueryClient();
    const {
        data: workshops,
        isLoading: workshopsLoading,
        isError: workshopsError,
    } = useQuery<TWorkshop[]>({
        queryKey: ["workshop"],
        refetchOnWindowFocus: false,
        retry: false,
    });
    console.log("workshop:", workshops);
    return (
        <DefaultLayout className="p-8" pageHref="/workshops">
            <ToastProvider />
            <div id="master" className="grid grid-cols-2 gap-4">
                {workshops?.map((workshop) => (
                    <Card
                        id={`Card-${workshop.uuid}`}
                        key={workshop.uuid}
                        isFooterBlurred
                        className="border-none relative w-full min-h-96"
                        radius="lg"
                    >
                        <div className="w-1/2">
                            <ImageCarousel
                                resource_uuid={workshop.uuid}
                                resource_type={FILE_RESOURCE_TYPE.WORKSHOP}
                                editable={false}
                            />
                        </div>
                    </Card>
                ))}
            </div>
        </DefaultLayout>
    );
}
