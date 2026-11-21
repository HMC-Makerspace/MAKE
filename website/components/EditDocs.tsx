import { Button, Modal, ModalContent, Input } from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";
import { TDocument } from "common/file";
import { UUID } from "common/global";
import { TUserRole, UserRoleUUID } from "common/user";
import { RequiredRoles } from "./RequiredRoles";

const emptyDoc: TDocument = {
    name: "",
    link: "",
    visible_to: null,
};

export function EditDocs({
    docs,
    setDocs,
    roles,
    setHasEdits,
    className = "",
}: {
    docs: TDocument[];
    setDocs: (newDocs: TDocument[]) => void;
    roles?: TUserRole[];
    setHasEdits?: (has: boolean) => void;
    className?: string;
}) {
    const wrapEdit = (i: number, prop: "name" | "link") => {
        return (val: string) => {
            if (!docs[i]) docs[i] = { ...emptyDoc }; // copy the emptyDoc template if necessary

            docs[i][prop] = val; // update the value
            setDocs([...docs]); // update the docs list

            setHasEdits?.(true);
        };
    };

    const wrapRolesEdit = (i: number) => {
        return (newRoles: UserRoleUUID[] | null) => {
            if (!docs[i]) docs[i] = { ...emptyDoc }; // copy the emptyDoc template if necessary
            docs[i].visible_to = newRoles;
            setDocs([...docs]); // update the docs list

            setHasEdits?.(true);
        };
    };

    return (
        <div
            className={clsx(
                "flex flex-col gap-5 p-4 h-full overflow-auto",
                className,
            )}
        >
            {docs.map((doc, i) => (
                <div
                    className="flex flex-row w-full gap-2 items-center"
                    key={"doc" + i}
                >
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex flex-row gap-2">
                            <Input
                                type="text"
                                label="Name"
                                name="name"
                                placeholder=""
                                isRequired
                                value={doc.name}
                                onValueChange={wrapEdit(i, "name")}
                                variant="faded"
                                color="primary"
                                size="sm"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                    ]),
                                }}
                                className="w-full"
                            />
                            <Input
                                type="text"
                                label="Link"
                                name="link"
                                placeholder=""
                                isRequired
                                value={doc.link}
                                onValueChange={wrapEdit(i, "link")}
                                variant="faded"
                                color="primary"
                                size="sm"
                                classNames={{
                                    input: clsx([
                                        "placeholder:text-default-500",
                                        "placeholder:italic",
                                        "text-default-700",
                                    ]),
                                }}
                                className="w-full"
                            />
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={() => {
                                    docs.splice(i, 1); // remove that doc
                                    setDocs([...docs]);
                                    setHasEdits?.(true);
                                }}
                                isIconOnly
                            >
                                <TrashIcon className="size-6" />
                            </Button>
                        </div>

                        {roles && ( // TODO: doesn't currently allow the distinction between [] (only visible to admins) and null (public)
                            <div className="flex-1 max-w-full">
                                <RequiredRoles
                                    type="visible_to"
                                    roles={roles}
                                    currentRoles={docs[i]["visible_to"] || null}
                                    setCurrentRoles={wrapRolesEdit(i)}
                                    size="sm"
                                    className="h-full"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <Button
                color="default"
                variant="bordered"
                size="sm"
                className="p-2 min-w-fit"
                onPress={() => {
                    setDocs([...docs, { ...emptyDoc }]); // add a copy of the emptyDoc template
                    setHasEdits?.(true);
                }}
            >
                <PlusIcon className="size-6" />
            </Button>
        </div>
    );
}

export default function EditDocsModal<
    // Allow any type that has a uuid and optional documents list
    T extends { uuid: UUID; documents?: TDocument[] },
>({
    element: element,
    isOpen,
    onOpenChange,
    patchMutation,
    roles,
}: {
    element: T;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                documents?: TDocument[];
            };
        }
    >;
    roles?: TUserRole[]; // If not present, don't show roles option.
}) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [docs, setDocs] = React.useState<TDocument[]>(
        element.documents || [],
    );

    const onSubmit = () => {
        if (!hasEdits) return;

        patchMutation.reset();

        // Run the mutation
        patchMutation.mutate({
            uuid: element.uuid,
            patch: { documents: docs },
        });
    };

    const isValid = React.useMemo(() => {
        for (let i = 0; i < docs.length; i++) {
            if (docs[i].name == "" || docs[i].link == "") {
                return false; // invalid edit if either field is empty
            }
        }

        return hasEdits; // otherwise, invalid iff no edits made
    }, [hasEdits, docs]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="4xl"
        >
            <ModalContent>
                {(onClose) => (
                    <div
                        className={clsx("flex flex-col gap-4 p-4 max-h-[90vh]")}
                    >
                        <div className="text-lg font-semibold">
                            Edit Documents
                        </div>
                        <EditDocs
                            docs={docs}
                            setDocs={setDocs}
                            setHasEdits={setHasEdits}
                            roles={roles}
                        />
                        <div className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={patchMutation.isPending}
                                onPress={onSubmit}
                            >
                                Submit
                            </Button>
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </ModalContent>
        </Modal>
    );
}
