import React, { useCallback, useEffect, useState } from "react";
import { FILE_RESOURCE_TYPE, FileUUID, TFile } from "../../common/file.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { UUID } from "../../common/global.ts";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    useDisclosure,
    Image,
} from "@heroui/react";
import {
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PlusIcon,
    ArrowUpTrayIcon,
    ArrowUpOnSquareIcon,
} from "@heroicons/react/24/outline";
import FileCard from "./public/file/FileCard.tsx";
import clsx from "clsx";

async function deleteImage({
    resource_type,
    file_uuid,
}: {
    resource_type: FILE_RESOURCE_TYPE;
    file_uuid: UUID;
}) {
    return (await axios.delete(`/api/v3/file/by/${resource_type}/${file_uuid}`))
        .data;
}

async function uploadImage({
    resource_uuid,
    resource_type,
    file,
}: {
    resource_uuid: FileUUID;
    resource_type: FILE_RESOURCE_TYPE;
    file: File;
}) {
    const formData = new FormData();
    formData.append("file", file);
    return (
        await await axios.post(
            `/api/v3/file/for/${resource_type}/${resource_uuid}`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        )
    ).data;
}

export default function ImageCarousel({
    resource_uuid,
    resource_type,
    editable = false,
    className = "",
}: {
    resource_uuid: UUID;
    resource_type: FILE_RESOURCE_TYPE;
    editable?: boolean;
    className?: string;
}) {
    const {
        data: images,
        isLoading,
        isFetching,
    } = useQuery<TFile[]>({
        queryKey: ["file", "by", resource_type, resource_uuid],
        refetchOnWindowFocus: false,
        placeholderData: [],
    });

    const [index, setIndex] = React.useState<number>(0);

    // If the files change externally, we need to reset the index
    useEffect(() => {
        setIndex(0);
    }, [setIndex, isFetching]);

    //going to next slide functionality
    const nextImage = useCallback(() => {
        if (!images) return;
        setIndex((index + 1) % images.length);
    }, [index, setIndex, images?.length]);
    const prevImage = useCallback(() => {
        if (!images) return;
        setIndex(index - 1 < 0 ? images.length - 1 : index - 1);
    }, [index, setIndex, images?.length]);

    // Manage modal state
    const { isOpen: editIsOpen, onOpenChange: editOnOpenChange } =
        useDisclosure();

    if (!images || isLoading) {
        return <div></div>;
    }

    return (
        <div
            className={clsx(
                "relative h-full min-h-[150px] min-w-[150px] w-full content-center",
                className,
            )}
        >
            {images.length > 1 && (
                <Button
                    className=" absolute left-1 top-0 bottom-0 my-auto z-20"
                    variant="flat"
                    size="sm"
                    isIconOnly
                    radius="md"
                    onPress={prevImage}
                >
                    <ChevronLeftIcon className="size-6" />
                </Button>
            )}
            {images.length > 0 ? (
                <Image
                    src={
                        images[index]
                            ? `/api/v3/file/download/${images[index].uuid}`
                            : undefined
                    }
                    radius="md"
                    className="h-full w-full"
                    classNames={{
                        img: "h-full object-cover w-min justify-self-center",
                        wrapper: "h-full w-full !max-w-none",
                        blurredImg:
                            "translate-y-0 w-full min-w-full scale-100 rounded-3xl",
                    }}
                    isBlurred
                />
            ) : (
                <p className="text-center text-l text-bold">No Images Found</p>
            )}

            {editable && (
                <Button
                    isIconOnly
                    className="absolute bottom-2 right-2"
                    onPress={editOnOpenChange}
                >
                    <ArrowUpOnSquareIcon className="size-7" />
                </Button>
            )}
            {images.length > 1 && (
                <Button
                    className="absolute right-1 top-0 bottom-0 my-auto z-20"
                    variant="flat"
                    size="sm"
                    isIconOnly
                    radius="md"
                    onPress={nextImage}
                >
                    <ChevronRightIcon className="size-6" />
                </Button>
            )}
            <Modal
                isOpen={editIsOpen}
                placement="top-center"
                onOpenChange={editOnOpenChange}
                className="flex flex-col justify-center overflow-auto"
                size="xl"
                scrollBehavior="inside"
                classNames={{
                    base: "w-full max-w-3xl overflow-auto",
                }}
            >
                <EditModal
                    editOnOpenChange={editOnOpenChange}
                    images={images}
                    resource_type={resource_type}
                    resource_uuid={resource_uuid}
                />
            </Modal>
        </div>
    );
}

//Modal for Editing
function EditModal({
    editOnOpenChange,
    images,
    resource_type,
    resource_uuid,
}: {
    editOnOpenChange: () => void;
    images: TFile[];
    resource_type: FILE_RESOURCE_TYPE;
    resource_uuid: UUID;
}) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteImage,
        onSuccess: (data: TFile[]) => {
            queryClient.invalidateQueries({
                queryKey: ["file", "by", resource_type, resource_uuid],
            });
        },
    });

    const uploadMutation = useMutation({
        mutationFn: uploadImage,
        onSuccess: (data: TFile[]) => {
            queryClient.setQueryData(
                ["file", "by", resource_type, resource_uuid],
                (old: TFile[]) => old.concat(data),
            );
        },
    });

    // getting the image user wants
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            uploadMutation.mutate({
                resource_uuid: resource_uuid,
                resource_type: resource_type,
                file: e.target.files[0],
            });
        }
    };

    return (
        <>
            <input
                type="file"
                id="imageUpload"
                className="hidden"
                onChange={handleFileChange}
            />
            <ModalContent className="flex flex-col justify-center">
                <ModalHeader>Add and Delete Images</ModalHeader>

                <ModalBody>
                    <div className="grid grid-cols-2 min-h-fit gap-4">
                        {images.map((image) => {
                            return (
                                <FileCard
                                    file={image}
                                    resource_type={resource_type}
                                    deleteMutation={deleteMutation}
                                />
                            );
                        })}
                    </div>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        color="primary"
                        endContent={<PlusIcon className="size-6" />}
                        onPress={() => {
                            document.getElementById("imageUpload")?.click();
                        }}
                    >
                        Add Image
                    </Button>
                    <Button
                        color="primary"
                        variant="flat"
                        onPress={editOnOpenChange}
                    >
                        Done
                    </Button>
                </ModalFooter>
            </ModalContent>
        </>
    );
}
