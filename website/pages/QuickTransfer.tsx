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
import { TUser, UserUUID } from "../../common/user.js";
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
import FileCard from "../components/public/file/FileCard.tsx";

async function uploadFiles({
    college_id,
    files,
    toast_key,
}: {
    college_id: string;
    files: File[];
    toast_key: string;
}) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await axios.post<{
        files: TFile[];
        upload_errors: string[];
    }>(
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

async function deleteFile({
    file_uuid,
    resource_type,
}: {
    file_uuid: string;
    resource_type: FILE_RESOURCE_TYPE;
}) {
    const response = await axios.delete(
        `/api/v3/file/by/${resource_type}/${file_uuid}`,
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
    const {
        data: self,
        isLoading: selfLoading,
        isError: selfError,
    } = useQuery<TUser>({
        queryKey: ["user", "self"],
        refetchOnWindowFocus: false,
        retry: false,
    });

    const uploadMutation = useMutation({
        mutationFn: uploadFiles,
        onSettled: (data) => {
            if (!data || !data.files || !data.upload_errors) {
                return;
            }
            // Add successfully uploaded files to user's file list
            queryClient.setQueryData(
                ["file", "by", "user", "id", collegeID],
                (old?: TFile[]) => (old ?? []).concat(data.files),
            );
            if (data.files.length > 0) {
                // At least one file uploaded successfully, show a toast
                addToast({
                    title:
                        `Successfully uploaded ${data.files.length} file` +
                        `${data.files.length === 1 ? "" : "s"}.`,
                    timeout: 3000,
                    color: "success",
                    severity:
                        data.upload_errors.length === 0 ? "success" : "warning",
                });
            }
            for (const error of data.upload_errors) {
                // Add an error toast for each upload error
                addToast({
                    title: error,
                    timeout: 3000,
                    color: "danger",
                });
            }
        },
        onError: (error: AxiosError<{ error: string }>) => {
            console.log("Error", error);
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
        const promise = uploadMutation.mutateAsync({
            college_id: collegeID,
            files: files,
            toast_key: "",
        });
        const toast = addToast({
            title: "Uploading ...",
            timeout: 1,
            promise: promise,
            color: "primary",
            hideCloseButton: true,
        });
        e.target.value = "";
    };

    const uploadAccess =
        scopes &&
        verifyScopes(scopes, [
            API_SCOPE.CREATE_FILE,
            user && self && user.uuid === self.uuid
                ? API_SCOPE.CREATE_OWN_FILE
                : false,
        ]);
    const deleteAccess =
        scopes &&
        verifyScopes(scopes, [
            API_SCOPE.DELETE_FILE,
            user && self && user.uuid === self.uuid
                ? API_SCOPE.DELETE_OWN_FILE
                : false,
        ]);

    const dropHandler = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (uploadAccess && files && files.length > 0) {
            handleUpload({
                target: { files },
            } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    return (
        <DefaultLayout className="p-4 lg:p-8" pageHref="/transfer">
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
                            autoFocus
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
                            className="pt-1 sm:pt-0"
                            classNames={{
                                input: "text-large sm:text-base",
                                label: "pb-1.5 sm:pb-0.5",
                            }}
                            onBlur={(blurEvent) => {
                                // Get input value
                                const value = blurEvent.target.value;
                                setCollegeID(value || "");
                            }}
                        />
                    </Form>
                    <div
                        id="name"
                        className={clsx(
                            "justify-center flex-1 hidden sm:flex",
                            "text-center md:text-lg text-md font-bold",
                            "text-default-700",
                        )}
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
                            isDisabled={!user || !uploadAccess}
                        >
                            Upload
                        </Button>
                    </div>
                </div>
                <div
                    id="card-container"
                    onDrop={dropHandler}
                    onDragOver={dragOverHandler}
                    onDragLeave={dragLeaveHandler}
                    className="overflow-auto size-full"
                >
                    <div
                        id="file-cards"
                        className={clsx(
                            "grid gap-4 overflow-auto min-h-fit",
                            "grid-cols-1 sm:grid-cols-2",
                            "md:grid-cols-3 lg:grid-cols-4",
                        )}
                    >
                        {files && files.length > 0 ? (
                            files.map((file) => (
                                <FileCard
                                    key={file.uuid}
                                    file={file}
                                    resource_type={FILE_RESOURCE_TYPE.USER}
                                    deleteMutation={deleteMutation}
                                    disableDeletion={!deleteAccess}
                                    showFooter
                                />
                            ))
                        ) : (
                            <div
                                id="blurb-box"
                                className="col-span-full pt-2 pl-2 font-mono"
                            >
                                To download files, please enter your college ID.
                                Please login to upload, delete, and edit your
                                own files.
                                <br />
                                <br />
                                To gain access to Quick Transfer, please visit
                                the Makerspace during open hours and ask a
                                steward.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}
