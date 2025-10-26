import { Button, Modal, Form, ModalContent, Input, Dropdown } from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";

import { UserRoleSelect } from "./user/UserRoleSelect";
import { TDocument } from "common/file";
import { UUID } from "common/global";
import { UserRoleUUID } from "common/user";

const emptyDoc: TDocument = {
    name: "",
    link: "",
    authorized_roles: null,
};

export default function EditDocsModal<
    // Allow any type that has a uuid and optional documents list
    T extends { uuid: UUID; documents?: TDocument[] },
>({
    element: element,
    isOpen,
    onOpenChange,
    patchMutation,
    roleOption = false,
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
    roleOption?: boolean
}) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [docs, setDocs] = React.useState<TDocument[]>(
        element.documents || [],
    );
    

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            patchMutation.reset();

            console.log("before mutation", docs)
            // Run the mutation
            patchMutation.mutate({
                uuid: element.uuid,
                patch: { documents: docs },
            });
        },
        [patchMutation, hasEdits, docs],
    );

    const wrapEdit = (i: number, prop: "name" | "link" | "authorized_roles") => {
        return (val: any) => {
            if (!docs[i]) docs[i] = { ...emptyDoc }; // copy the emptyDoc template if necessary
            console.log("val", val)
            docs[i][prop] = val; // update the value
            setDocs([...docs]); // update the docs list
            console.log(docs)

            setHasEdits(true);
        };
    };

    const wrapRolesEdit = (i: number) => {
        return (val: any) => {
            if (!docs[i]) docs[i] = { ...emptyDoc }; // copy the emptyDoc template if necessary
            docs[i]["authorized_roles"] = Array.from(val) as UserRoleUUID[]; // update the value
            setDocs([...docs]); // update the docs list
            console.log(docs)
            setHasEdits(true);
        }
    }

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
            size="3xl"
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">
                            Edit Documents
                        </div>

                        {docs.map((doc, i) => (
                            <div
                                className="flex flex-row w-full gap-2 items-center"
                                key={element.uuid + "-doc" + i}
                            >
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
                                    size="md"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                    className='w-full'
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
                                    size="md"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                    }}
                                    className='w-full'
                                />
                                
                                {roleOption &&
                                    <div className='min-w-[15vw] max-w-full'>
                                        <UserRoleSelect
                                            selectedKeys={docs[i]["authorized_roles"] ?? undefined}
                                            onSelectionChange={wrapRolesEdit(i)}
                                            placeholder="Select authorized roles"
                                            label="Authorized Roles"
                                            labelPlacement="inside"
                                            classNames={{
                                                value: "text-default-500",                                                
                                            }}
                                            size="md"
                                            multiline={false}
                                        />
                                    </div>
                                }
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={() => {
                                        docs.splice(i, 1); // remove that doc
                                        setDocs([...docs]);
                                        setHasEdits(true);
                                    }}
                                    isIconOnly
                                >
                                    <TrashIcon className="size-6" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={patchMutation.isPending}
                            >
                                Submit
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    className="p-2 min-w-fit"
                                    onPress={() => {
                                        setDocs([...docs, { ...emptyDoc }]); // add a copy of the emptyDoc template
                                        setHasEdits(true);
                                    }}
                                >
                                    <PlusIcon className="size-6" />
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
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}
