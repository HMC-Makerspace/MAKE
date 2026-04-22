import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
    NumberInput,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import { UseMutationResult } from "@tanstack/react-query";
import clsx from "clsx";

import { TRequiredCertificate, TCertification } from "common/certification";
import { UUID } from "common/global";
import { CertSelect } from "./CertSelect";

const emptyCert: TRequiredCertificate = {
    certification_uuid: "",
    required_level: 0,
};

type SinglePatch<T> = {
    mode: "single";
    element: T;
    patchMutation: UseMutationResult<
        T,
        Error,
        {
            uuid: UUID;
            patch: {
                required_certifications?: TRequiredCertificate[];
            };
        }
    >;
};

type BatchPatch<T> = {
    mode: "batch";
    element: UUID[];
    patchMutation: UseMutationResult<
        T[],
        Error,
        {
            uuids: UUID[];
            patch: {
                required_certifications?: TRequiredCertificate[];
            };
        }
    >;
};

export default function RequiredCertsModal<
    // Allow any type that has a uuid and optional required_certs list
    T extends { uuid: UUID; required_certifications?: TRequiredCertificate[] },
>({
    certifications,
    isOpen,
    onOpenChange,
    ...mutationProps
}: {
    certifications: TCertification[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
} & (SinglePatch<T> | BatchPatch<T>)) {
    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [currentCerts, setCurrentCerts] = React.useState<
        TRequiredCertificate[]
    >(
        mutationProps.mode === "single"
            ? (mutationProps.element.required_certifications ?? [])
            : [],
    );

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!hasEdits) return;

            mutationProps.patchMutation.reset();

            // Run the mutations
            if (mutationProps.mode === "single") {
                mutationProps.patchMutation.mutate({
                    uuid: mutationProps.element.uuid,
                    patch: { required_certifications: currentCerts },
                });
            } else {
                mutationProps.patchMutation.mutate({
                    uuids: mutationProps.element,
                    patch: { required_certifications: currentCerts },
                });
            }

            onOpenChange(false);
            setHasEdits(false);
        },
        [
            mutationProps.patchMutation,
            hasEdits,
            currentCerts,
            mutationProps.element,
        ],
    );

    function wrapEdit<P extends keyof TRequiredCertificate>(
        i: number,
        prop: P,
    ) {
        return (val: TRequiredCertificate[P]) => {
            if (!currentCerts[i]) {
                currentCerts[i] = emptyCert;
            }

            const cert = { ...currentCerts[i] };
            cert[prop] = val;
            const certs = [...currentCerts];
            certs[i] = cert;
            setCurrentCerts(certs); // update the instance list
            setHasEdits(true);
        };
    }

    const isValid = React.useMemo(() => {
        for (let i = 0; i < currentCerts.length; i++) {
            if (currentCerts[i].certification_uuid == "") {
                return false; // invalid edit if either field is empty
            }
        }

        return hasEdits; // otherwise, invalid iff no edits made
    }, [hasEdits, currentCerts]);

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="xl"
        >
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">
                            {mutationProps.mode === "single"
                                ? "Edit Required Certifications"
                                : "Batch Edit Required Certifications"}
                        </div>

                        {currentCerts.map((cert, i) => (
                            <div
                                className="flex flex-col sm:flex-row w-full gap-2 items-top"
                                key={
                                    mutationProps.element +
                                    "-cert-" +
                                    cert.certification_uuid
                                }
                            >
                                <CertSelect
                                    certifications={certifications}
                                    defaultSelectedKeys={[
                                        cert.certification_uuid,
                                    ]}
                                    disabledKeys={currentCerts
                                        .filter((_, j) => j != i)
                                        .map((c) => c.certification_uuid)}
                                    onSelectionChange={(s) => {
                                        if (s == "all") return;
                                        wrapEdit(
                                            i,
                                            "certification_uuid",
                                        )(Array.from(s)[0] as string);
                                    }}
                                    placeholder="Select a certification"
                                    label=""
                                    isRequired
                                    selectionMode="single"
                                    classNames={{
                                        value: "text-default-500 min-h-[60.66px] content-center",
                                        trigger:
                                            "bg-default-100/50 backdrop-blur-sm",
                                        listbox: "bg-default-100/50",
                                    }}
                                />

                                <div className="w-full h-full flex gap-2 items-center">
                                    <NumberInput
                                        isRequired
                                        label="Minimum Level"
                                        name="required_level"
                                        placeholder="0 for any level"
                                        minValue={0}
                                        value={cert.required_level}
                                        onValueChange={wrapEdit(
                                            i,
                                            "required_level",
                                        )}
                                        variant="faded"
                                        color="primary"
                                        size="lg"
                                        classNames={{
                                            mainWrapper: "h-full",
                                            base: "h-full",
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
                                        onPress={() => {
                                            currentCerts.splice(i, 1); // remove that cert
                                            setCurrentCerts([...currentCerts]);
                                            setHasEdits(true);
                                        }}
                                        isIconOnly
                                    >
                                        <TrashIcon className="size-6" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <div className="flex flex-row justify-between w-full gap-2">
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={
                                    mutationProps.patchMutation.isPending
                                }
                            >
                                Submit
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    color="primary"
                                    className="p-2 min-w-fit sm:w-1/3"
                                    onPress={() => {
                                        setCurrentCerts([
                                            ...currentCerts,
                                            { ...emptyCert },
                                        ]); // add a copy of the emptyCert template
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
