import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FILE_RESOURCE_TYPE, FileUUID, TFile } from "../../common/file.ts";
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
import axios, { AxiosError } from "axios";
import React from "react";
import { TUser, UserUUID } from "common/user.js";
import clsx from "clsx";
import {
    ArchiveBoxIcon,
    CubeTransparentIcon,
    DocumentChartBarIcon,
    DocumentIcon,
    DocumentTextIcon,
    FilmIcon,
    IdentificationIcon,
    MusicalNoteIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";
import { API_SCOPE } from "../../common/global.ts";
import { verifyScopes } from "../utils.tsx";

async function uploadFile({
    college_id,
    file,
    toast_key,
}: {
    college_id: string;
    file: File;
    toast_key: string;
}) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
        `/api/v3/file/for/${FILE_RESOURCE_TYPE.USER}/id/${college_id}`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );

    return response.data;
}

async function getFiles({ college_id }: { college_id: string }) {
    const response = await axios.get(
        `/api/v3/file/by/${FILE_RESOURCE_TYPE.USER}/id/${college_id}`,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
}

async function deleteFile({ file_uuid }: { file_uuid: string }) {
    const response = await axios.delete(
        `/api/v3/file/by/${FILE_RESOURCE_TYPE.USER}/${file_uuid}`,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );
    return response.data;
}

const dragOverHandler = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
};

const dragLeaveHandler = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
};

export default function QuickTransferPage() {
    const queryClient = useQueryClient();
    const [collegeID, setCollegeID] = React.useState<string>("");
    const {
        data: user,
        isLoading: userLoading,
        isError: userError,
    } = useQuery<TUser>({
        queryKey: ["user", "by", "id", collegeID],
        refetchOnWindowFocus: false,
        enabled: !!collegeID,
        retry: false,
    });
    const {
        data: files,
        isLoading: filesLoading,
        isError: filesError,
    } = useQuery<TFile[]>({
        queryKey: ["file", "by", "user", "id", collegeID],
        queryFn: () => getFiles({ college_id: collegeID }),
        refetchOnWindowFocus: false,
        enabled: !!collegeID && !!user,
        retry: false,
    });
    const {
        data: scopes,
        isLoading: scopesLoading,
        isError: scopesError,
    } = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    const uploadMutation = useMutation({
        mutationFn: uploadFile,
        onSuccess: (data: TFile) => {
            if (!collegeID) {
                return;
            }
            queryClient.setQueryData(
                ["file", "by", "user", "id", collegeID],
                (old?: TFile[]) => (old ?? []).concat(data),
            );
            addToast({
                title: "Successfully uploaded file.",
                timeout: 3000,
                color: "success",
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            addToast({
                title:
                    error.response?.data.error ??
                    `Unknown error: ${error.message}`,
                timeout: 5000,
                color: "danger",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFile,
        onSuccess: (data, variables) => {
            if (!collegeID) {
                return;
            }
            queryClient.setQueryData(
                ["file", "by", "user", "id", collegeID],
                (old?: TFile[]) =>
                    (old ?? []).filter(
                        (file) => file.uuid != variables.file_uuid,
                    ),
            );
            addToast({
                title: "Successfully deleted file.",
                timeout: 1000,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: error.message,
                timeout: 5000,
                color: "danger",
            });
        },
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        if (!user || !files) {
            return;
        }
        uploadMutation.reset();
        for (const file of files) {
            const promise = uploadMutation.mutateAsync({
                college_id: collegeID,
                file: file,
                toast_key: "",
            });
            const toast = addToast({
                title: "Uploading ...",
                timeout: 1,
                promise: promise,
                color: "primary",
                hideCloseButton: true,
            });
        }
        e.target.value = "";
    };

    const dropHandler = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            handleUpload({
                target: { files },
            } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const uploadAccess =
        scopes && verifyScopes(scopes, [API_SCOPE.CREATE_OWN_FILE]);
    const deleteAccess =
        scopes && verifyScopes(scopes, [API_SCOPE.DELETE_OWN_FILE]);

    return (
        <DefaultLayout className="p-8" pageHref="/transfer">
            <ToastProvider maxVisibleToasts={9}></ToastProvider>
            <div
                id="master"
                className="size-full p-4 flex flex-col gap-2 bg-content1 rounded-xl overflow-auto"
            >
                <div
                    id="user-id-box"
                    className={clsx(
                        "bg-content2 p-2 pb-3 px-3 flex gap-2 rounded-lg",
                        "items-center",
                    )}
                >
                    <Form
                        id="id-input"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = new FormData(e.currentTarget);
                            const newID = data.get("college_id") as string;
                            setCollegeID(newID || "");
                        }}
                        className="mr-auto flex-1"
                    >
                        {userLoading ? (
                            <Spinner className="absolute right-2 top-2 z-10" />
                        ) : null}
                        <Input
                            id="id-text-box"
                            fullWidth={false}
                            label={
                                <div className="flex gap-2 items-center whitespace-nowrap">
                                    <AcademicCapIcon className="size-5" />
                                    College ID
                                </div>
                            }
                            labelPlacement="inside"
                            type="text"
                            variant="underlined"
                            color="primary"
                            name="college_id"
                        />
                    </Form>
                    <div
                        id="name"
                        className="justify-center flex-1 text-center md:text-lg hidden sm:flex text-md font-bold text-default-700"
                    >
                        {user?.name}
                    </div>
                    <div
                        id="padding"
                        className="ml-auto flex-1 justify-end flex"
                    >
                        <input
                            id="upload-trigger"
                            className="hidden"
                            type="file"
                            multiple
                            onChange={handleUpload}
                        />
                        <Button
                            id="upload-button"
                            color="primary"
                            variant="bordered"
                            startContent={
                                <ArrowUpTrayIcon className="size-5" />
                            }
                            onPress={() => {
                                document
                                    .getElementById("upload-trigger")
                                    ?.click();
                            }}
                            isDisabled={!user}
                        >
                            Upload
                        </Button>
                    </div>
                </div>
                <div
                    // Drag Drop Continaner
                    id="card-container"
                    onDrop={dropHandler}
                    onDragOver={dragOverHandler}
                    onDragLeave={dragLeaveHandler}
                    className="overflow-auto size-full"
                    draggable="true"
                >
                    <div
                        id="file-cards"
                        className={clsx(
                            "grid gap-4 lg:grid-cols-4 overflow-auto min-h-fit",
                            "md:grid-cols-3",
                            "grid-cols-2",
                        )}
                    >
                        {files?.map((file) => (
                            <Card
                                id={`Card-${file.uuid}`}
                                key={file.uuid}
                                isFooterBlurred
                                className="border-none aspect-square relative"
                                radius="lg"
                            >
                                <Image
                                    id={`Image-${file.uuid}`}
                                    alt={file.name}
                                    className="object-cover h-full"
                                    classNames={{
                                        wrapper:
                                            "absolute size-full aspect-square flex justify-center",
                                    }}
                                    src={`/api/v3/file/download/${file.uuid}`}
                                    isBlurred
                                />
                                <div
                                    id="file-extension-icon"
                                    className="flex items-center size-full justify-center pb-8 transition-colors-opacity"
                                >
                                    {file.name
                                        .split(".")
                                        .map((text, idx, arr) => {
                                            if (idx !== arr.length - 1) {
                                                return <></>;
                                            } else {
                                                switch (text.toLowerCase()) {
                                                    case "docx":
                                                    case "doc":
                                                    case "pdf":
                                                    case "txt":
                                                        return (
                                                            <DocumentTextIcon className="size-24" />
                                                        );
                                                    case "stl":
                                                    case "3mf":
                                                    case "obj":
                                                    case "step":
                                                    case "stp":
                                                    case "f3d":
                                                        return (
                                                            <CubeTransparentIcon className="size-24" />
                                                        );
                                                    case "xlsx":
                                                    case "xls":
                                                    case "csv":
                                                    case "tsv":
                                                        return (
                                                            <DocumentChartBarIcon className="size-24" />
                                                        );
                                                    case "zip":
                                                    case "gz":
                                                    case "7z":
                                                    case "dmg":
                                                    case "pkg":
                                                        return (
                                                            <ArchiveBoxIcon className="size-24" />
                                                        );
                                                    case "dng":
                                                    case "heic":
                                                    case "raw":
                                                    case "heif":
                                                        return (
                                                            <PhotoIcon className="size-24" />
                                                        );
                                                    case "mov":
                                                    case "mp4":
                                                    case "avi":
                                                    case "mkv":
                                                        return (
                                                            <FilmIcon className="size-24" />
                                                        );
                                                    case "mp3":
                                                    case "wav":
                                                    case "flac":
                                                    case "aac":
                                                        return (
                                                            <MusicalNoteIcon className="size-24" />
                                                        );
                                                    case "png":
                                                    case "gif":
                                                    case "jpg":
                                                    case "jpeg":
                                                    case "webp":
                                                    case "svg":
                                                        return <></>; // So images dont have an icon behind them
                                                    case "abe":
                                                        return (
                                                            <IdentificationIcon className="size-24" />
                                                        );
                                                }
                                                return (
                                                    <DocumentIcon className="size-24" />
                                                );
                                            }
                                        })}
                                </div>
                                <CardFooter
                                    className={clsx(
                                        "justify-between bg-default-300/40",
                                        "border-1 py-1 border-white/20",
                                        "absolute before:rounded-xl",
                                        "rounded-large bottom-1",
                                        "w-[calc(100%_-_8px)]",
                                        "shadow-small ml-1 z-10",
                                    )}
                                >
                                    <p
                                        className={clsx(
                                            "text-tiny text-white/80",
                                            "text-ellipsis overflow-hidden",
                                            "hover:z-50 hover:overflow-visible",
                                            "hover:bg-white/20 fixed max-w-[calc(100%_-_104px)]",
                                            "hover:max-w-fit p-1 rounded-md transition-colors-opacity",
                                        )}
                                    >
                                        {file.name}
                                    </p>
                                    <a
                                        href={`/api/v3/file/download/${file.uuid}`}
                                        download={file.name}
                                    >
                                        <Button
                                            className="text-tiny text-white bg-black/20 hover:bg-black/30"
                                            color="default"
                                            radius="lg"
                                            size="sm"
                                            variant="flat"
                                        >
                                            Download
                                        </Button>
                                    </a>
                                </CardFooter>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    className="absolute top-2 right-2 z-20 text-white"
                                    onPress={() =>
                                        deleteMutation.mutate({
                                            file_uuid: file.uuid,
                                        })
                                    }
                                >
                                    <TrashIcon className="size-5" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}
