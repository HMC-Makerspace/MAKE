import {
    DocumentTextIcon,
    CubeTransparentIcon,
    DocumentChartBarIcon,
    ArchiveBoxIcon,
    PhotoIcon,
    FilmIcon,
    MusicalNoteIcon,
    IdentificationIcon,
    DocumentIcon,
    TrashIcon,
    ClockIcon,
} from "@heroicons/react/24/solid";
import { Card, CardFooter, Button, Image, Tooltip } from "@heroui/react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";
import { FILE_RESOURCE_TYPE, FileUUID, TFile } from "../../../../common/file";
import { UUID } from "../../../../common/global.ts";
import { relativeTimestampToString } from "../../../utils";

export default function FileCard({
    file,
    resource_type,
    resource_uuid,
    deleteMutation,
    disableDeletion = false,
    showFooter = false,
}: {
    file: TFile;
    resource_type: FILE_RESOURCE_TYPE;
    resource_uuid: UUID;
    deleteMutation: UseMutationResult<
        {},
        Error,
        {
            file_uuid: FileUUID;
            resource_type: FILE_RESOURCE_TYPE;
            resource_uuid: UUID;
        }
    >;
    disableDeletion?: boolean;
    showFooter?: boolean;
}) {
    return (
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
                {file.name.split(".").map((text, idx, arr) => {
                    // Only return an icon based on the last file extension
                    if (idx !== arr.length - 1) {
                        return <></>;
                    } else {
                        switch (text.toLowerCase()) {
                            case "docx":
                            case "doc":
                            case "pdf":
                            case "txt":
                                return <DocumentTextIcon className="size-24" />;
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
                                return <ArchiveBoxIcon className="size-24" />;
                            case "dng":
                            case "heic":
                            case "raw":
                            case "heif":
                                return <PhotoIcon className="size-24" />;
                            case "mov":
                            case "mp4":
                            case "avi":
                            case "mkv":
                                return <FilmIcon className="size-24" />;
                            case "mp3":
                            case "wav":
                            case "flac":
                            case "aac":
                                return <MusicalNoteIcon className="size-24" />;
                            case "png":
                            case "gif":
                            case "jpg":
                            case "jpeg":
                            case "webp":
                            case "svg":
                                return <></>; // No icon shown for images
                            case "abe":
                                return (
                                    <IdentificationIcon className="size-24" />
                                );
                        }
                        return <DocumentIcon className="size-24" />;
                    }
                })}
            </div>
            {showFooter && (
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
            )}
            <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="danger"
                className="absolute top-2 right-2 z-20 text-white"
                onPress={() =>
                    deleteMutation.mutate({
                        file_uuid: file.uuid,
                        resource_type: resource_type,
                        resource_uuid: resource_uuid
                    })
                }
                isDisabled={disableDeletion || deleteMutation.isPending}
            >
                <TrashIcon className="size-5" />
            </Button>
            {file.timestamp_expires && (
                <Tooltip
                    content={`Expires in ${
                        relativeTimestampToString(
                            file.timestamp_expires - Date.now() / 1000,
                        ).split(", ")[0]
                    }`}
                    color={
                        file.timestamp_expires - Date.now() / 1000 <
                        60 * 60 * 24 * 1 // Show a highlight if expiring in < 1 day
                            ? "danger"
                            : "default"
                    }
                >
                    <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        // Show a warning if less than 2 days remaining
                        color={
                            file.timestamp_expires - Date.now() / 1000 <
                            60 * 60 * 24 * 1 // Show a highlight if expiring in < 1 day
                                ? "danger"
                                : "default"
                        }
                        className="absolute top-2 left-2 z-20"
                    >
                        <ClockIcon className="size-5" />
                    </Button>
                </Tooltip>
            )}
        </Card>
    );
}
