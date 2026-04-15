import {
    Card,
    Button,
    Input,
    useDisclosure,
    Tooltip,
    addToast,
    Checkbox,
} from "@heroui/react";
import { TUserRole } from "common/user";
import clsx from "clsx";
import { TEmbed } from "common/embed";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import EditDocsModal from "../../../EditDocsModal";
import {
    DocumentIcon,
    EyeIcon,
    EyeSlashIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import DeleteModal from "../../../DeleteModal";
import VisibilityModal from "../areas/VisibilityModal";
import { UUID } from "common/global";

const patchEmbed = async ({
    uuid,
    patch,
}: {
    uuid: UUID;
    patch: Partial<TEmbed>;
}) => {
    return (
        await axios.patch<TEmbed>(`/api/v3/embed/${uuid}`, {
            partial_embed_obj: patch,
        })
    ).data;
};

const deleteEmbed = async ({ uuid }: { uuid: UUID }) => {
    await axios.delete(`/api/v3/embed/${uuid}`);
};

export default function EditableEmbed({
    embed,
    roles,
}: {
    embed: TEmbed;
    roles: TUserRole[];
}) {
    const queryClient = useQueryClient();
    const patchMutation = useMutation({
        mutationFn: patchEmbed,
        onSuccess: (obj: TEmbed) => {
            queryClient.setQueryData(["embed"], (old: TEmbed[]) => {
                return (old ?? []).map((embed) =>
                    embed.uuid === obj.uuid ? obj : embed,
                );
            });
            editDocsClose();
            addToast({
                title: `Embed saved`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteEmbed,
        onSuccess: (_, variables) => {
            queryClient.setQueryData(["embed"], (old: TEmbed[]) => {
                return (old ?? []).filter(
                    (embed) => embed.uuid !== variables.uuid,
                );
            });
            addToast({
                title: `Successfully deleted embed`,
                color: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const {
        isOpen: editDocs,
        onOpenChange: editDocsModalOpenChange,
        onOpen: editDocsOpen,
        onClose: editDocsClose,
    } = useDisclosure();

    const {
        isOpen: visibilityModal,
        onOpenChange: visibilityModalOpenChange,
        onOpen: visibilityModalOpen,
    } = useDisclosure();

    const {
        isOpen: deleteModal,
        onOpenChange: deleteModalOpenChange,
        onOpen: deleteModalOpen,
    } = useDisclosure();

    return (
        <Card
            className="w-full min-h-fit h-fit p-4 gap-4 relative bg-primary-100/5"
            shadow="none"
        >
            <div className="flex gap-4 flex-col">
                <Input
                    placeholder="Embed Title"
                    defaultValue={embed.title}
                    onBlur={(blurEvent) => {
                        // Get input value
                        const value = blurEvent.target.value;
                        if (value == embed.title || !value) {
                            return; // no update
                        }
                        // Update name of embed
                        patchMutation.mutate({
                            uuid: embed.uuid,
                            patch: {
                                title: value,
                            },
                        });
                    }}
                    type="text"
                    color="primary"
                    variant="underlined"
                    className="w-full"
                    classNames={{
                        input: clsx(
                            "placeholder:text-default-400 font-bold",
                            "text-xl text-primary-400",
                        ),
                    }}
                    isRequired
                    minLength={1}
                    errorMessage={"Unsaved changes: please enter a name"}
                    endContent={
                        <div className="flex gap-2 sm:gap-3">
                            <Tooltip
                                color={
                                    embed.visible_to == null
                                        ? "success"
                                        : embed.visible_to &&
                                            embed.visible_to.length === 0
                                          ? "danger"
                                          : "primary"
                                }
                                content={
                                    embed.visible_to == null
                                        ? "Visible"
                                        : embed.visible_to &&
                                            embed.visible_to.length === 0
                                          ? "Not Visible"
                                          : "Partially Visible"
                                }
                                placement="bottom-end"
                            >
                                <Button
                                    isIconOnly
                                    startContent={
                                        embed.visible_to &&
                                        embed.visible_to.length === 0 ? (
                                            <EyeSlashIcon
                                                className="size-6"
                                                strokeWidth={1.5}
                                            />
                                        ) : (
                                            <EyeIcon
                                                className="size-6"
                                                strokeWidth={1.5}
                                            />
                                        )
                                    }
                                    color={
                                        embed.visible_to == null
                                            ? "success"
                                            : embed.visible_to &&
                                                embed.visible_to.length === 0
                                              ? "danger"
                                              : "primary"
                                    }
                                    variant="bordered"
                                    onPress={visibilityModalOpen}
                                />
                            </Tooltip>
                            <VisibilityModal
                                item={embed}
                                itemType="embed"
                                roles={roles}
                                isOpen={visibilityModal}
                                onOpenChange={visibilityModalOpenChange}
                                patchMutation={patchMutation}
                            />
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={deleteModalOpen}
                                isIconOnly
                            >
                                <TrashIcon className="size-6" />
                            </Button>
                            <DeleteModal
                                itemType="embed"
                                itemName={embed.title}
                                onSubmit={() =>
                                    deleteMutation.mutate({
                                        uuid: embed.uuid,
                                    })
                                }
                                isOpen={deleteModal}
                                onOpenChange={deleteModalOpenChange}
                                isLoading={deleteMutation.isPending}
                            />
                        </div>
                    }
                />
                <Input
                    placeholder="Embed source..."
                    defaultValue={embed.src}
                    onBlur={(blurEvent) => {
                        // Get input value
                        const value = blurEvent.target.value;
                        if (value == embed.src) {
                            return; // no update
                        }
                        // Update description
                        patchMutation.mutate({
                            uuid: embed.uuid,
                            patch: {
                                src: value,
                            },
                        });
                    }}
                    color="primary"
                    variant="bordered"
                    className="w-full"
                    size="md"
                    classNames={{
                        input: clsx(
                            "placeholder:text-default-400",
                            "text-default-700 p-1 text-ellipsis",
                        ),
                        inputWrapper: "p-1",
                    }}
                />
                <div className="flex flex-row w-full">
                    <Button
                        variant="shadow"
                        className={clsx("bg-content2", "font-semibold md:mx-8")}
                        onPress={editDocsOpen}
                    >
                        <DocumentIcon className="size-5" />
                        Documents
                        {embed.documents
                            ? ` (${embed.documents.length})`
                            : " (0)"}
                    </Button>
                    <div
                        className={clsx(
                            "w-fit flex gap-2 items-center rounded-xl",
                            "border-default-200 border-2 py-2 pl-2",
                        )}
                    >
                        Auto-Invert?
                        <Checkbox
                            isSelected={embed.auto_invert}
                            onValueChange={(invert) =>
                                patchMutation.mutate({
                                    uuid: embed.uuid,
                                    patch: {
                                        auto_invert: invert,
                                    },
                                })
                            }
                        />
                    </div>
                </div>
                <EditDocsModal
                    key={"embedDocEdit-" + embed.uuid}
                    element={embed}
                    isOpen={editDocs}
                    onOpenChange={editDocsModalOpenChange}
                    patchMutation={patchMutation}
                    roleOption
                />
            </div>
        </Card>
    );
}
