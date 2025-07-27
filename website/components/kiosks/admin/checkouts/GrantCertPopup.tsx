import { Button, Form, Modal, ModalContent, NumberInput } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    CertificationUUID,
    TCertification,
    TRequiredCertificate,
} from "common/certification";
import { TUser, UserUUID } from "common/user";
import React, { useState } from "react";
import CertificationTag from "../certifications/CertificationTag";
import clsx from "clsx";

async function grantRevokeCert({
    user_uuid,
    cert_uuid,
    grant = true,
    level = 1,
}: {
    user_uuid: UserUUID;
    cert_uuid: CertificationUUID;
    grant?: boolean;
    level?: number;
}) {
    if (grant) {
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/grant/certification/${cert_uuid}/${level}`,
            )
        ).data;
    } else {
        return (
            await axios.patch<TUser>(
                `/api/v3/user/${user_uuid}/revoke/certification/${cert_uuid}`,
            )
        ).data;
    }
}

export default function GrantCertPopup({
    cert,
    setCert,
    user,
    granting,
    setGranting,
    isOpen,
    onOpenChange,
}: {
    cert?: TCertification;
    setCert: (cert?: TCertification) => void;
    user?: TUser;
    granting: boolean;
    setGranting: (isGranting: boolean) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();

    const grantRevokeMutation = useMutation({
        mutationFn: grantRevokeCert,
        onSuccess: (new_user) => {
            queryClient.setQueryData(["user", new_user.uuid], new_user);
            queryClient.setQueryData(
                ["user", "by", "id", new_user.college_id],
                new_user,
            );
            queryClient.setQueryData(["user"], (old: TUser[]) =>
                old.map((u) => (u.uuid === new_user.uuid ? new_user : u)),
            );
            console.log("New user", new_user);
            setCert();
            setGranting(true);
            onOpenChange(false);
        },
        onError: (data) => {
            alert("Error!"), console.log("error data", data);
        },
    });

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            if (!user || !cert) return;

            grantRevokeMutation.reset();

            // Run the mutation
            grantRevokeMutation.mutate({
                user_uuid: user.uuid,
                cert_uuid: cert.uuid,
                grant: granting,
                level: level,
            });
        },
        [grantRevokeMutation],
    );

    const [level, setLevel] = useState<number>();

    const user_cert = user?.active_certificates?.find(
        (c) => c.certification_uuid === cert?.uuid,
    );

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="lg"
        >
            <ModalContent>
                {(onClose) => {
                    if (!user || !cert) return <></>;
                    if (!granting && !user_cert) {
                        // Trying to revoke cert that the user doesn't have.
                        return <></>;
                    }

                    return (
                        <Form
                            onSubmit={onSubmit}
                            className="flex flex-col gap-4 p-4"
                            validationBehavior="native"
                        >
                            <div className="text-lg font-semibold pb-1">
                                {granting ? "Grant " : "Revoke "}Certificate
                            </div>
                            <div className="font-medium -mb-3">
                                Are you sure you want to
                                {granting ? " grant " : " revoke "}
                                {user.name + " "}the {` ${cert.name} `}
                                certification?
                                {granting && <br />}
                                {granting && "If so, select a level to grant."}
                            </div>

                            <div className="flex items-end gap-2 w-full justify-center">
                                <div>
                                    <CertificationTag
                                        cert_uuid={cert.uuid}
                                        certifications={[cert]}
                                        // If revoking, show level the user has
                                        level={
                                            !granting
                                                ? user_cert?.level
                                                : undefined
                                        }
                                    />
                                </div>
                                {granting && (
                                    <NumberInput
                                        label="Level"
                                        name="level"
                                        minValue={1}
                                        maxValue={
                                            cert.max_level
                                                ? cert.max_level
                                                : undefined
                                        }
                                        endContent={
                                            <div
                                                className={clsx(
                                                    "whitespace-nowrap",
                                                    "text-sm text-default-700",
                                                )}
                                            >
                                                {cert.max_level
                                                    ? ` / ${cert.max_level}`
                                                    : undefined}
                                            </div>
                                        }
                                        value={level}
                                        onValueChange={setLevel}
                                        variant="faded"
                                        color="primary"
                                        size="sm"
                                        labelPlacement="outside"
                                        className="w-1/2"
                                        classNames={{
                                            mainWrapper: "h-full",
                                            inputWrapper: "h-9",
                                            base: "h-full",
                                            input: clsx([
                                                "placeholder:text-default-500",
                                                "placeholder:italic",
                                                "text-default-700",
                                                "text-right h-8",
                                            ]),
                                        }}
                                    />
                                )}
                            </div>

                            <div className="flex flex-row justify-between w-full gap-2">
                                <Button
                                    variant="shadow"
                                    type="submit"
                                    color="primary"
                                    className="w-full sm:w-auto"
                                    isDisabled={
                                        granting &&
                                        (!level ||
                                            level < 1 ||
                                            (cert.max_level
                                                ? level > cert.max_level
                                                : false))
                                    }
                                    isLoading={grantRevokeMutation.isPending}
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
                    );
                }}
            </ModalContent>
        </Modal>
    );
}
