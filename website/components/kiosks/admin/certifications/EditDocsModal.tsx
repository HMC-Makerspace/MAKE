import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
} from "@heroui/react";
import { TDocument } from "common/file";
import React from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { TrashIcon } from "@heroicons/react/24/outline";
import { TCertification } from "common/certification";

const emptyDoc: TDocument = {
    name: "",
    link: ""
};

const updateDocs = async ({
    data,
    docs
}: {
    data: TCertification;
    docs: TDocument[];
}) => {
    data.documents = docs;
    return (
        await axios.put<TCertification>("/api/v3/certification", { certification_obj: data })
    ).data;
};

export default function EditDocsModal({
    cert,
    documents,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    cert: TCertification;
    documents: TDocument[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateDocs,
        onSuccess: (obj: TCertification) => {
            queryClient.setQueryData(["certification", cert.uuid], obj);
            queryClient.setQueryData(["certification"], (old: TCertification[]) => {
                return old.map((certification) =>
                    certification.uuid === obj.uuid ? obj : certification,
                );
            });

            onSuccess(`Successfully updated certification ${obj.name}`);
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [docs, setDocs] = React.useState<TDocument[]>(documents);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            mutation.reset();

            // Run the mutation
            mutation.mutate({data: cert, docs});
        },
        [mutation, hasEdits],
    );

    const wrapEdit = React.useCallback((i: number, prop: "name"|"link") => {
        return (val: any) => {
            if (!docs[i]) docs[i] = {...emptyDoc};

            docs[i][prop] = val;
            setDocs([...docs]);
            setHasEdits(true);
        };
    }, []);

    const isValid = React.useMemo(() => {
        for (let i = 0; i < docs.length; i++) {
            if (docs[i].name == "" || docs[i].link == "")
                return false;
        }

        return hasEdits;
    }, [hasEdits, docs]);
    
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">Edit Documents</div>

                        {docs.map((doc, i) => (
                            <div className="flex flex-row w-full gap-2 items-center" key={cert.uuid + "-doc" + i}>
                                <Input
                                    type="text"
                                    label="Name"
                                    name="name"
                                    placeholder={""}
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
                                />

                                <Input
                                    type="text"
                                    label="Link"
                                    name="link"
                                    placeholder={""}
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
                                />

                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={()=>{
                                        docs.splice(i, 1);
                                        setDocs([...docs]);
                                        setHasEdits(true);
                                    }}
                                    isIconOnly
                                >
                                    <TrashIcon className="size-6" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            color="primary"
                            className="w-full sm:w-1/3"
                            isLoading={false}
                            onPress={()=>{
                                setDocs([...docs, {...emptyDoc}]);
                                setHasEdits(true);
                            }}
                        >
                            Add document
                        </Button>

                        <div
                            className="flex flex-row justify-between w-full"
                        >
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={mutation.isPending}
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
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}