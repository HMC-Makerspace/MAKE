import {
    Input,
    Selection,
    SortDescriptor,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Spinner,
    useDisclosure,
} from "@heroui/react";
import { useInfiniteScroll } from "@heroui/use-infinite-scroll";
import {
    MagnifyingGlassIcon as SearchIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { TCertification } from "common/certification";
import MAKETable from "../../../Table";
import React from "react";
import CertificationTag from "./CertificationTag"
import EditCertModal from "./EditCertModal"
import UserRole from "../../../user/UserRole";
import { CERTIFICATION_VISIBILITY } from "../../../../../common/certification";
import EditDocsModal from "./EditDocsModal";

const defaultCert: TCertification = {
    uuid: "",
    name: "",
    description: "",
    visibility: CERTIFICATION_VISIBILITY.PUBLIC,
    color: "",
    max_level: 0,
    seconds_valid_for: 0,
    documents: [],
    authorized_roles: [],
    prerequisites: []
};

const columns = [
    { name: "UUID", id: "uuid" },
    { name: "Name", id: "name", sortable: true },
    { name: "Description", id: "description" },
    { name: "Max Level", id: "max_level" },
    { name: "Expires After", id: "seconds_valid_for" },
    { name: "Documents", id: "documents" },
    { name: "Prerequisites", id: "prerequisites" },
    { name: "Authorized Roles", id: "authorized_roles" }
];

const defaultColumns = [
    "name",
    "description",
    "max_level",
    "seconds_valid_for",
    "documents",
    "visibility",
    "prerequisites",
    "authorized_roles"
];

export default function CertificationsTable({
    certs,
    selectedKeys,
    onSelectionChange,
    isLoading,
    canEdit
}: {
    certs: TCertification[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
    canEdit: boolean;
}) {
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");
    const [editCert, setEditCert] = React.useState<TCertification | undefined>(
        undefined,
    );
    const [isNew, setIsNew] = React.useState<boolean>(false);

    // isOpen etc aren't updated on React re-render for some reason. Bug with my code or issue with HeroUI/React?
    // either way, React.useState() works instead.
    //const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isOpen, setIsOpen] = React.useState<boolean>(false);

    const [certOpenDoc, setCertOpenDoc] = React.useState<TCertification>(defaultCert);
    const [docOpen, setDocOpen] = React.useState<boolean>();

    const numCerts = certs.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
        // Consider scroll to top
    }, []);

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
                        

                        <Button
                            color="primary"
                            isDisabled={isLoading}
                            startContent={<PlusIcon className="size-6" />}
                            onPress={() => {
                                setEditCert(defaultCert);
                                setIsNew(true);
                                setIsOpen(true);
                            }}
                        >
                            Create
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-default-400 text-small">
                        Total {numCerts} certifications
                    </span>
                </div>
            </div>
            <MAKETable
                content={certs}
                columns={columns}
                visibleColumns={visibleColumns}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                multiSelect={false}
                doubleClickAction={(uuid) => {
                    if (canEdit) {
                        let cert = certs.find((cert) => cert.uuid === uuid);
                        setEditCert(cert);
                        setIsNew(false);
                        setIsOpen(true);
                    }
                }}
                customColumnComponents={{
                    documents: (cert: TCertification) => (
                        <div className="flex flex-col gap-2">
                            {/* {cert.documents?.map((doc) => (
                                // redesign later
                                <div key={doc.name}>
                                    <a href={doc.link} style={{textDecorationLine: "underline"}}>{doc.name}</a>
                                </div>
                            ))} */}

                            <Button
                                variant="flat"
                                color="secondary"
                                onPress={()=>{
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
                        <CertificationTag cert_uuid={cert.uuid} showVisibility ></CertificationTag>
                    ),
                    seconds_valid_for: (cert: TCertification) => (
                        <div>
                            {cert.seconds_valid_for ? relativeTimestampToString(cert.seconds_valid_for) : "Never"}
                        </div>
                    ),
                    max_level: (cert: TCertification) => (
                        <div>{cert.max_level || "None"}</div>
                    ),
                    prerequisites: (cert: TCertification) => (
                        // size down maybe
                        <div>
                            {cert.prerequisites?.map(prereq => (
                                <CertificationTag cert_uuid={prereq} key={prereq} ></CertificationTag>
                            ))}
                        </div>
                    ),
                    authorized_roles: (cert: TCertification) => (
                        // size down maybe
                        <div>
                            {cert.authorized_roles?.map(role => (
                                <UserRole role_uuid={role} key={role} ></UserRole>
                            ))}
                        </div>
                    ),
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
                    key={editCert.uuid}
                    cert={editCert}
                    isNew={isNew}
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    onSuccess={() => setIsOpen(false)}
                    onError={() => alert("Error")}
                />
            )}

            {docOpen && (
                <EditDocsModal
                    key={certOpenDoc.uuid}
                    cert={certOpenDoc}
                    documents={certOpenDoc.documents||[]}
                    isOpen={docOpen}
                    onOpenChange={setDocOpen}
                    onSuccess={() => setDocOpen(false)}
                    onError={() => alert("Error")}
                />
            )}
        </div>
    );
}

// Converts a seconds-based, relative timestamp to a string, e.g. "1 year, 3 days, 16 hours, 40 minutes, 20 seconds"
function relativeTimestampToString(timestamp: number): string {
    // The number of seconds, minutes, etc. corresponding to the timestamp
    let times: number[] = [0, 0, 0, 0, 0];

    // Reference for the names of each division
    let ref: string[] = ["year", "day", "hour", "minute", "second"];

    // Convert the timestamp to seconds, minutes, hours, days, & years
    times[4] = timestamp % 60; // seconds
    let mh = (timestamp - times[4]) / 60; // after removing seconds
    times[3] = mh % 60; // minutes
    let hd = (mh - times[3]) / 60; // after removing minutes
    times[2] = hd % 24; // hours
    let dy = (hd - times[2]) / 24; // after removing hours
    times[1] = dy % 365; // days
    times[0] = (dy - times[1]) / 365; // years

    // The properly formatted time divisions
    let res: string[] = [];

    // Formatting divisions
    for (let i = 0; i < times.length; i++) {
        // If that division is greater than 0, include it in the result
        res[i] = times[i] > 0 ? `${times[i]} ${ref[i]}` : "";

        // Add an "s" to pluralize the division name if necessary
        if (times[i] > 1) res[i] += "s";
    }

    // Join the different divisions together into one string, except for the empty divisions
    return res.filter(Boolean).join(", ");
}