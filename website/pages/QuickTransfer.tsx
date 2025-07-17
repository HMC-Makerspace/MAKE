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
} from "@heroui/react";
import {
    AcademicCapIcon,
    ArrowUpTrayIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/solid"; //solid or outline
import axios from "axios";
import React from "react";
import { TUser, UserUUID } from "common/user.js";
import clsx from "clsx";

async function uploadFile({
    college_id,
    file,
}: {
    college_id: string;
    file: File;
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

    const uploadMutation = useMutation({
        mutationFn: uploadFile,
        onSuccess: (data: TFile) => {
            if (!user) {
                return;
            }
            queryClient.setQueryData(
                ["file", "by", FILE_RESOURCE_TYPE.USER, user.uuid],
                (old?: TFile[]) => (old ?? []).concat(data),
            );
        },
        onError: (error) => {
            alert(error);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFile,
        onSuccess: (data: TFile) => {
            if (!user) {
                return;
            }
            queryClient.setQueryData(
                ["file", "by", FILE_RESOURCE_TYPE.USER, data.uuid],
                (old?: TFile[]) => (old ?? []).concat(data),
            );
        },
        onError: (error) => {
            alert(error);
        },
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const file = e.target.files[0];
        if (!user) {
            return;
        }
        uploadMutation.mutate({ college_id: collegeID, file: file });
    };

    console.log("files:", files);
    console.log("uuid:", user?.uuid);
    return (
        <DefaultLayout className="p-8" pageHref="/transfer">
            <div
                id="master"
                className="size-full p-4 flex flex-col gap-2 bg-content1 rounded-xl"
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
                        className="justify-center flex-1 text-center text-lg font-bold text-default-700"
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
                <div id="file-cards" className="flex gap-4">
                    {files?.map((file) => (
                        <Card
                            id={file.name}
                            key={file.uuid}
                            isFooterBlurred
                            className="border-none w-48"
                            radius="lg"
                        >
                            <Image
                                alt={file.name}
                                className="object-cover"
                                height={200}
                                src={`/api/v3/file/download/${file.uuid}`}
                                width={200}
                            />
                            <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                                <p className="text-tiny text-white/80">
                                    {file.name}
                                </p>
                                <a
                                    href={`/api/v3/file/download/${file.uuid}`}
                                    download
                                >
                                    <Button
                                        className="text-tiny text-white bg-black/20"
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
        </DefaultLayout>
    );
}
