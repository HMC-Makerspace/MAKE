import React, { useEffect } from "react";
import {
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalFooter,
    Select,
    SelectItem,
    SelectedItems,
    Form,
    Textarea,
    Input,
    DatePicker,
    DateRangePicker,
    NumberInput,
    Autocomplete,
    AutocompleteItem,
    addToast
} from "@heroui/react";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TWorkshop } from "../../../../common/workshop";
import { UserRoleUUID, UserUUID } from "../../../../common/user";
import { CertificationUUID } from "../../../../common/certification";
import { UnixTimestamp, UUID } from "../../../../common/global";
import { FileUUID } from "../../../../common/file";
import { timestampToZonedDateTime } from "../../../utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TUser } from "../../../../common/user";
import { TCertification } from "../../../../common/certification";
import { parseZonedDateTime, ZonedDateTime } from "@internationalized/date";

import clsx from "clsx";
import { TConfig } from "common/config";
import axios from "axios";

const signinWorkshop = async ({
    workshop_uuid,
    user_uuid,
}: {
    workshop_uuid: UUID;
    user_uuid: UserUUID;
}) => {
    return await axios.patch<TWorkshop>(`/api/v3/workshop/${workshop_uuid}/sign_in/${user_uuid}`);
};

export default function WorkshopSigninModal({
    workshop,
    isOpen,
    onOpenChange,
}: {
    workshop: TWorkshop;
    isOpen: boolean;
    onOpenChange: (open?: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const signinMutation = useMutation({
        mutationFn: signinWorkshop,
        onSuccess: () => {
            addToast({
                title: `Successfully signed in to workshop`,
                color: "success",
            });
            onOpenChange(false);
        },
        onError: (e) => {
            addToast({
                title: `Error: ${e.message}`,
                color: "danger",
            });
        },
    });

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            const email = formData.get("email") as string;

            // TODO
            // get user object
            const d = useQuery<TUser>({
                queryKey: ["user", "by", "email", email],
                refetchOnWindowFocus: false,
                retry: false,
            });
            console.log(d);
            // make sure user isn't already signed in / user is rsvp'd
            // pass uuid to sign in mutation

            const uuid = "";

            signinMutation.reset();

            signinMutation.mutate({
                workshop_uuid: workshop.uuid,
                user_uuid: uuid,
            });
        },
        [workshop],
    );

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            className="flex flex-col justify-center align-center"
            size="2xl"
        >
            <ModalContent>
                <ModalHeader>
                    <h1 className="text-2xl font-bold">Sign in to Workshop</h1>
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={onSubmit}>
                        <Input
                            type="text"
                            label="Email"
                            name="email"
                            placeholder={workshop.uuid}
                            onValueChange={() => setHasEdits(true)}
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
                        <div className="flex flex-row gap-2 justify-between w-full pt-4">
                            <Button
                                color="primary"
                                isDisabled={!hasEdits}
                                type="submit"
                            >
                                Submit
                            </Button>
                            <Button
                                color="danger"
                                onPress={() => {
                                    onOpenChange(true);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </ModalBody>
                <ModalFooter className="flex flex-row justify-between items-center"></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
