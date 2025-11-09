import {
    Input,
    Selection,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    addToast
} from "@heroui/react";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
    BookmarkIcon,
} from "@heroicons/react/24/outline";

import React from "react";

import MAKETable from "../../../Table";

import { CertificationUUID, TCertification } from "common/certification";
import { CERTIFICATION_VISIBILITY } from "../../../../../common/certification";

import CertificationTag from "./CertificationTag";
import EditCertModal from "./EditCertModal";
import EditDocsModal from "../../../EditDocsModal";

import UserRole from "../../../user/UserRole";
import { TDocument } from "common/file";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import RequiredCertsModal from "./RequiredCertsModal";
import { relativeTimestampToString } from "../../../../utils";

const baseColumns = [
    { name: "UUID", id: "uuid" },
    { name: "Name", id: "name" },
    { name: "Description", id: "description" },
    { name: "Max Level", id: "max_level" },
    { name: "Expires After", id: "seconds_valid_for" },
    { name: "Documents", id: "documents" },
    { name: "Prerequisites", id: "prerequisites" },
    { name: "Authorized Roles", id: "authorized_roles" },
];

const updateCertDocs = async ({
    uuid,
    patch,
}: {
    uuid: CertificationUUID;
    patch: Partial<TCertification>;
}) => {
    return (
        await axios.patch<TCertification>(`/api/v3/certification/${uuid}`, {
            partial_cert_obj: patch,
        })
    ).data;
};

export default function CertificationsTable({
    certs,
    selectedKeys,
    onSelectionChange,
    isLoading,
    canEdit,
    visibilities = [
        CERTIFICATION_VISIBILITY.PUBLIC,
        CERTIFICATION_VISIBILITY.PRIVATE,
        CERTIFICATION_VISIBILITY.SCHEDULE,
    ],
    defaultColumns = [
        "name",
        "description",
        "max_level",
        "seconds_valid_for",
        "documents",
        "visibility",
        "prerequisites",
        "authorized_roles",
    ],
    extraColumns = [],
    customColumnComponents = {},
}: {
    certs: TCertification[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
    canEdit: boolean;
    visibilities: CERTIFICATION_VISIBILITY[];
    defaultColumns?: string[];
    extraColumns?: { name: string; id: string }[];
    customColumnComponents?: {
        [column_id: string]: (item: TCertification) => React.ReactNode;
    };
}) {
    const columns = baseColumns.concat(extraColumns);
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");

    // Edit modal
    const [editCert, setEditCert] = React.useState<TCertification | undefined>(
        undefined,
    ); // the certification being edited
    const [isNew, setIsNew] = React.useState<boolean>(false); // whether editing or creating cert
    const [isOpen, setIsOpen] = React.useState<boolean>(false); // whether modal is open

    // Edit docs modal
    const [certOpenDoc, setCertOpenDoc] = React.useState<TCertification>(); // the certification with edited docs
    const [docOpen, setDocOpen] = React.useState<boolean>(false); // whether doc edit modal is open
    const [prereqOpen, setPrereqOpen] = React.useState<boolean>(false); // whether prereq edit modal is open

    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateCertDocs,
        onSuccess: (obj: TCertification) => {
            queryClient.setQueryData(["certification", certOpenDoc?.uuid], obj);
            queryClient.setQueryData(
                ["certification"],
                (old: TCertification[]) => {
                    return old.map((certification) =>
                        certification.uuid === obj.uuid ? obj : certification,
                    );
                },
            );
            addToast({
                title: `Successfully updated certification ${certOpenDoc?.name}`,
                color: "success",
            });

            setDocOpen(false);
        },
        onError: (error) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
        // Consider scroll to top
    }, []);

    const numCerts = certs.length;

    return (
        <div className="flex flex-col max-h-full overflow-auto w-full">
            <div id="user-table-top-content" className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <Input
                        isClearable
                        className="w-full sm:max-w-[44%] text-for"
                        placeholder="Search..."
                        startContent={<SearchIcon className="size-6" />}
                        value={search}
                        onClear={() => onSearchClear()}
                        onValueChange={onInputChange}
                        isDisabled={isLoading}
                        classNames={{
                            input: "placeholder:text-foreground-200",
                        }}
                    />
                    <div className="flex gap-3">
                        <Dropdown isDisabled={isLoading}>
                            <DropdownTrigger className="hidden sm:flex">
                                <Button
                                    endContent={
                                        <ChevronDownIcon className="size-6 text-small" />
                                    }
                                    variant="flat"
                                >
                                    Filter Columns
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={visibleColumns}
                                selectionMode="multiple"
                                onSelectionChange={setVisibleColumns}
                            >
                                {columns
                                    .filter((column) =>
                                        defaultColumns.includes(column.id),
                                    )
                                    .map((column) => (
                                        <DropdownItem
                                            key={column.id}
                                            className="capitalize"
                                        >
                                            {column.name}
                                        </DropdownItem>
                                    ))}
                            </DropdownMenu>
                        </Dropdown>

                        {canEdit && (
                            <Button
                                color="primary"
                                isDisabled={isLoading}
                                startContent={<PlusIcon className="size-6" />}
                                onPress={() => {
                                    setEditCert({
                                        uuid: crypto.randomUUID(),
                                        name: "",
                                        description: "",
                                        visibility:
                                            CERTIFICATION_VISIBILITY.PRIVATE,
                                        color: "",
                                        max_level: 0,
                                        seconds_valid_for: 0,
                                        documents: [],
                                        authorized_roles: [],
                                        required_certifications: [],
                                    });
                                    setIsNew(true);
                                    setIsOpen(true);
                                }}
                            >
                                Create
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numCerts} certifications
                    </span>
                </div>
            </div>
            <MAKETable
                content={certs.filter((c) =>
                    visibilities.includes(c.visibility),
                )}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                multiSelect={false}
                doubleClickAction={(uuid) => {
                    if (canEdit) {
                        let cert = certs.find((c) => c.uuid === uuid);
                        setEditCert(cert);
                        setIsNew(false);
                        setIsOpen(true);
                    }
                }}
                customColumnComponents={{
                    documents: (cert: TCertification) => (
                        <div className="flex justify-center">
                            <Button
                                variant="flat"
                                color="secondary"
                                onPress={() => {
                                    setCertOpenDoc(cert);
                                    setDocOpen(true);
                                }}
                                isIconOnly
                            >
                                <PencilSquareIcon className="size-6" />
                            </Button>
                        </div>
                    ),
                    name: (cert: TCertification) => (
                        <CertificationTag
                            cert_uuid={cert.uuid}
                            showVisibility
                        ></CertificationTag>
                    ),
                    seconds_valid_for: (cert: TCertification) => (
                        <div>
                            {cert.seconds_valid_for
                                ? relativeTimestampToString(
                                      cert.seconds_valid_for,
                                  )
                                : "Never"}
                        </div>
                    ),
                    max_level: (cert: TCertification) => (
                        <div>{cert.max_level || "None"}</div>
                    ),
                    prerequisites: (cert: TCertification) => {
                        if (canEdit) {
                            return (
                                <div className="flex justify-center">
                                    <Button
                                        variant="flat"
                                        color="primary"
                                        onPress={() => {
                                            setCertOpenDoc(cert);
                                            setPrereqOpen(true);
                                        }}
                                        isIconOnly
                                    >
                                        <BookmarkIcon className="size-6" />
                                    </Button>
                                </div>
                            );
                        } else {
                            return (
                                <div>
                                    {cert.required_certifications?.map(
                                        (prereq) => (
                                            <CertificationTag
                                                key={prereq.certification_uuid}
                                                cert_uuid={
                                                    prereq.certification_uuid
                                                }
                                                certifications={certs}
                                                level={prereq.required_level}
                                            />
                                        ),
                                    )}
                                </div>
                            );
                        }
                    },
                    authorized_roles: (cert: TCertification) => (
                        <div>
                            {cert.authorized_roles?.map((role) => (
                                <UserRole
                                    role_uuid={role}
                                    key={role}
                                ></UserRole>
                            ))}
                        </div>
                    ),
                    ...customColumnComponents,
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />

            {/* The key currently depends solely on the edited certification, meaning React does not update
                state variables upon close and reopen of the modal. This is potentially undesired behavior. */}
            {editCert && (
                <EditCertModal
                    key={"certedit-" + editCert.uuid}
                    certifications={certs}
                    cert={editCert}
                    isNew={isNew}
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                />
            )}

            {certOpenDoc && (
                <EditDocsModal
                    key={"certdocedit-" + certOpenDoc.uuid}
                    element={certOpenDoc}
                    isOpen={docOpen}
                    onOpenChange={setDocOpen}
                    patchMutation={mutation}
                />
            )}

            {certOpenDoc && (
                <RequiredCertsModal
                    key={"certdocprereq-" + certOpenDoc.uuid}
                    certifications={certs}
                    element={certOpenDoc}
                    isOpen={prereqOpen}
                    onOpenChange={setPrereqOpen}
                    patchMutation={mutation}
                />
            )}
        </div>
    );
}

