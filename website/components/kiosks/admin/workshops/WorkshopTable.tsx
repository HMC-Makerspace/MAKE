import React, { useEffect } from "react";
import {
    Selection,
    Button,
    Modal,
    ModalHeader,
    useDisclosure,
} from "@heroui/react";
import {
    PhotoIcon,
    UserIcon,
    PencilSquareIcon,
    CheckIcon,
    TrashIcon,
    PlusIcon,
    TagIcon,
} from "@heroicons/react/24/outline";
import { TWorkshop } from "common/workshop";
import { TCertification } from "common/certification";
import { TUser, TUserRole } from "common/user";
import MAKETable from "../../../Table.tsx";
import { MAKEUser } from "../../../user/MAKEUser.tsx";
import UserRole from "../../../user/UserRole.tsx";
import { convertTimestampToDate } from "../../../../utils.tsx";
import WorkshopPeopleModal from "./WorkshopPeopleModal.tsx";
import WorkshopImagesModal from "./WorkshopImagesModal.tsx";
import WorkshopEditModal from "./WorkshopEditModal.tsx";
import DeleteModal from "../../../DeleteModal";
import { set } from "mongoose";
import { TConfig } from "common/config.js";
import RequiredCertsModal from "../certifications/RequiredCertsModal.tsx";
import { UUID } from "common/global.ts";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// TODO-
// [] FIX TIME
// [] FIX AUTHORIZED ROLES

const columns = [
    { name: "Title", id: "title" },
    { name: "Description", id: "description" },
    { name: "Instructors + Support", id: "instructors" },
    { name: "Time", id: "ws_time" },
    { name: "Live", id: "timestamp_public" },
    { name: "Capacity", id: "capacity" },
    { name: "Certifications", id: "required_certifications" },
    // {name: 'RSVP List', id:'rsvp_list'},
    // {name: 'Sign-In List', id:'sign_in_list'},
    { name: "People", id: "signups" },
    { name: "Photos", id: "photos" },
    { name: "Authorized Roles", id: "authorized_roles" },
    { name: "Edit", id: "edit" },
    { name: "Delete", id: "delete" },
];
const defaultColumns = [
    "title",
    "description",
    "instructors",
    "ws_time",
    "timestamp_public",
    "capacity",
    "signups",
    "required_certifications",
    // 'rsvp_list',
    // 'sign_in_list',
    "photos",
    "authorized_roles",
    "edit",
    "delete",
];

async function patchWorkshop({
    uuid,
    patch,
}: {
    uuid: UUID;
    patch: Partial<TWorkshop>;
}) {
    return (
        await axios.patch<TWorkshop>(`/api/v3/workshop/${uuid}`, {
            partial_workshop_obj: patch,
        })
    ).data;
}

export default function WorkshopTable({
    workshops,
    users,
    certs,
    roles,
    config,
    isLoading,
}: {
    workshops: TWorkshop[];
    users: TUser[];
    certs: TCertification[];
    roles: TUserRole[];
    config: TConfig;
    isLoading: boolean;
}) {
    const queryClient = useQueryClient();
    const patchMutation = useMutation({
        mutationFn: patchWorkshop,
        onSuccess: (data) => {
            queryClient.setQueryData(["workshop", data.uuid], data);
            queryClient.setQueryData(["workshop"], (old: TWorkshop[]) =>
                old.map((w) => (w.uuid === data.uuid ? data : w)),
            );
        },
        onError: (e) => alert(e),
    });

    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );

    const [selectedWorkshop, setSelectedWorkshop] = React.useState<
        TWorkshop | undefined
    >(undefined);
    const [isNew, setIsNew] = React.useState<boolean>(false);

    const {
        isOpen: peopleIsOpen,
        onOpen: peopleOnOpen,
        onOpenChange: peopleOnOpenChange,
    } = useDisclosure();
    const {
        isOpen: imagesIsOpen,
        onOpen: imagesOnOpen,
        onOpenChange: imagesOnOpenChange,
    } = useDisclosure();
    const {
        isOpen: editIsOpen,
        onOpen: editOnOpen,
        onOpenChange: editOnOpenChange,
    } = useDisclosure();
    const {
        isOpen: certsIsOpen,
        onOpen: certsOnOpen,
        onOpenChange: certsOnOpenChange,
    } = useDisclosure();

    return (
        <>
            <div className="flex flex-col justify-center items-center relative">
                <h1 className="text-xl font-bold text-foreground-900 mb-2">
                    Workshops
                </h1>
                <h3 className="text-l text-foreground-900 mb-4">
                    View, edit, and create workshops.
                </h3>
                <Button
                    color="primary"
                    isDisabled={isLoading}
                    startContent={<PlusIcon className="size-6" />}
                    onPress={() => {
                        setIsNew(true);
                        setSelectedWorkshop({
                            uuid: crypto.randomUUID(),
                            title: "",
                            instructors: [],
                            timestamp_public: Date.now() / 1000,
                            timestamp_start: Date.now() / 1000,
                            timestamp_end: Date.now() / 1000 + 60 * 60 * 24,
                            rsvp_list: [],
                            users_notified: [],
                            sign_in_list: [],
                        });
                        editOnOpen();
                    }}
                    className="relative lg:absolute top-0 right-0 mb-4"
                >
                    Create
                </Button>
            </div>
            {workshops.length > 0 ? (
                <div>
                    <MAKETable
                        content={workshops}
                        columns={columns}
                        visibleColumns={visibleColumns}
                        multiSelect={false}
                        isLoading={isLoading}
                        customColumnComponents={{
                            title: (workshop) => {
                                return (
                                    <div>
                                        <h2 className="font-bold text-color[#403c38]">
                                            {workshop.title}
                                        </h2>
                                    </div>
                                );
                            },
                            description: (workshop) => {
                                return (
                                    <div className="min-w-[15vw]">
                                        {workshop.description ? (
                                            <p>{workshop.description}</p>
                                        ) : (
                                            <p>
                                                Come join the Makerspace for a
                                                fun workshop!
                                            </p>
                                        )}
                                    </div>
                                );
                            },
                            instructors: (workshop) => {
                                return (
                                    <div className="flex flex-col gap-2 my-2">
                                        {workshop.instructors.map(
                                            (instructor) => {
                                                return (
                                                    <MAKEUser
                                                        key={instructor}
                                                        size="sm"
                                                        user_uuid={instructor}
                                                        color="secondary"
                                                    />
                                                );
                                            },
                                        )}
                                        {workshop.support_instructors && (
                                            <>
                                                {workshop.support_instructors.map(
                                                    (instructor) => {
                                                        return (
                                                            <MAKEUser
                                                                key={instructor}
                                                                size="sm"
                                                                user_uuid={
                                                                    instructor
                                                                }
                                                            />
                                                        );
                                                    },
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            },
                            ws_time: (workshop) => {
                                return (
                                    <div className="flex flex-col min-w-[6vw]">
                                        <h2 className=" text-center">
                                            {new Date(
                                                workshop.timestamp_start * 1000,
                                            ).toLocaleDateString()}
                                            ,
                                        </h2>
                                        <h2 className="text-sm">
                                            {new Date(
                                                workshop.timestamp_start * 1000,
                                            ).toLocaleTimeString()}{" "}
                                            -{" "}
                                            {new Date(
                                                workshop.timestamp_end * 1000,
                                            ).toLocaleTimeString()}
                                        </h2>
                                    </div>
                                );
                            },
                            timestamp_public: (workshop) => {
                                return (
                                    <>
                                        {workshop.timestamp_public &&
                                        workshop.timestamp_public >
                                            Date.now() / 1000 ? (
                                            <div className="min-w-[6vw]">
                                                <h2 className="text-center">
                                                    {convertTimestampToDate(
                                                        workshop.timestamp_public,
                                                    )}
                                                </h2>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <Button
                                                    isIconOnly
                                                    color="success"
                                                    radius="full"
                                                    startContent={
                                                        <CheckIcon className="size-6" />
                                                    }
                                                />
                                            </div>
                                        )}
                                    </>
                                );
                            },
                            capacity: (workshop) => {
                                return (
                                    <div className="text-center">
                                        {workshop.capacity ? (
                                            <p>{workshop.capacity}</p>
                                        ) : (
                                            <p>No Max Capacity</p>
                                        )}
                                    </div>
                                );
                            },
                            required_certifications: (workshop) => (
                                <div className="flex w-full justify-center">
                                    <Button
                                        isIconOnly
                                        className="bg-default-300 mx-auto"
                                        startContent={
                                            <TagIcon className="size-6" />
                                        }
                                        onPress={() => {
                                            setSelectedWorkshop(workshop);
                                            certsOnOpen();
                                        }}
                                    />
                                </div>
                            ),
                            signups: (workshop) => (
                                <Button
                                    isIconOnly
                                    className="bg-default-300"
                                    startContent={
                                        <UserIcon className="size-6" />
                                    }
                                    onPress={() => {
                                        setSelectedWorkshop(workshop);
                                        peopleOnOpen();
                                    }}
                                />
                            ),
                            photos: (workshop) => (
                                <Button
                                    isIconOnly
                                    className="bg-default-300"
                                    startContent={
                                        <PhotoIcon className="size-6" />
                                    }
                                    onPress={() => {
                                        setSelectedWorkshop(workshop);
                                        imagesOnOpen();
                                    }}
                                />
                            ),
                            // TODO: Add roles
                            // "authorized_roles": (workshop) => {
                            //     return (
                            //         <div>
                            //             {
                            //                 workshop.authorized_roles ?

                            //                 workshop.authorized_roles.map((roleUUID) => {
                            //                     return <UserRole
                            //                     role_uuid={workshop.authorized_roles}
                            //                   />
                            //                 })

                            //             }

                            //         </div>
                            //     )
                            // },
                            edit: (workshop) => {
                                return (
                                    <>
                                        <Button
                                            isIconOnly
                                            color="primary"
                                            startContent={
                                                <PencilSquareIcon className="size-6" />
                                            }
                                            onPress={() => {
                                                setSelectedWorkshop(workshop);
                                                setIsNew(false);
                                                editOnOpen();
                                            }}
                                        ></Button>
                                    </>
                                );
                            },
                            delete: (workshop) => {
                                return (
                                    <>
                                        <Button
                                            isIconOnly
                                            color="danger"
                                            startContent={
                                                <TrashIcon className="size-6" />
                                            }
                                            onPress={() => {
                                                setSelectedWorkshop(workshop);
                                            }}
                                        ></Button>
                                    </>
                                );
                            },
                        }}
                    />
                </div>
            ) : (
                <p>No Workshops Found</p>
            )}
            {selectedWorkshop && (
                <>
                    <WorkshopPeopleModal
                        workshop={selectedWorkshop}
                        isOpen={peopleIsOpen}
                        onOpenChange={peopleOnOpenChange}
                    />
                    <WorkshopImagesModal
                        workshop={selectedWorkshop}
                        isOpen={imagesIsOpen}
                        onOpenChange={imagesOnOpenChange}
                    />
                    <WorkshopEditModal
                        workshop={selectedWorkshop}
                        users={users}
                        certs={certs}
                        isNew={isNew}
                        isOpen={editIsOpen}
                        onOpenChange={editOnOpenChange}
                        config={config}
                    />
                    <RequiredCertsModal
                        element={selectedWorkshop}
                        certifications={certs}
                        isOpen={certsIsOpen}
                        onOpenChange={certsOnOpenChange}
                        patchMutation={patchMutation}
                    />
                </>
            )}
        </>
    );
}
