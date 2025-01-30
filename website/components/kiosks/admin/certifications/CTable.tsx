

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
import MAKEUserRole from "../../../user/UserRole";
import Fuse from "fuse.js";
import React from "react";

const columns = [ // uuid, name, description, type, color, max level, seconds valid for, documents, authorized roles
    { name: "UUID", id: "uuid" },
    // { name: "ID", id: "college_id" },
    { name: "Name", id: "name", sortable: true },
    { name: "Description", id: "description" },
    { name: "Type", id: "type" },
    { name: "Max Level", id: "max_level", sortable: true }, // sortable? not sortable? idk
    { name: "Seconds Valid For (this ought to be renamed)", id: "seconds_valid_for", sortable: true },
    { name: "Documents", id: "documents" },
    // Skip files and availability, not useful right now
];

const defaultColumns = [
    "name",
    "description",
    "max_level",
    "seconds_valid_for",
    "documents",
];

export default function CertificationsTable({
    certs, // i cannot deal with typing "certifications" every time i want to reference this
    selectedKeys,
    onSelectionChange,
    isLoading,
}: {
    certs: TCertification[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
    isLoading: boolean;
}) {
    //console.log("wut")
    // The set of columns that are visible
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(
        new Set(defaultColumns),
    );
    const [search, setSearch] = React.useState<string>("");
    // Consider filtering by roles and certs, need to add custom getFn to Fuse

    // A fuse instance for filtering the content, memoized to prevent
    // unnecessary reinitialization on every render but updated when the
    // content changes
    // const fuse = React.useMemo(() => {
    //     return new Fuse(certs, {
    //         keys: ["name"],
    //         threshold: 0.3,
    //     });
    // }, [certs]);

    // The list of items after filtering and sorting
    // const filteredCerts = React.useMemo(() => {
    //     if (search) {
    //         return fuse.search(search).map((result) => result.item);
    //     } else {
    //         return certs;
    //     }
    // }, [certs, fuse, search]);

    const numCerts = certs.length;
    // const numFilteredCerts = filteredCerts.length;

    const onInputChange = React.useCallback((value: string) => {
        setSearch(value);
    }, []);

    const onSearchClear = React.useCallback(() => {
        setSearch("");
        // Consider scroll to top
    }, []);

    const onOpen = () => null;

    // const [multiSelect, setMultiSelect] = React.useState(false);

    // const modifiedSelectionChange = (selectedKeys: Selection) => {
    //     // if (selectedKeys === "all") {
    //     //     onSelectionChange(new Set(certs.map((cert) => cert.uuid)));
    //     // } else {
    //         onSelectionChange(selectedKeys);
    //     // }
    // };

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
                            onPress={onOpen}
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
                customColumnComponents={{
                    // active_roles: (cert: TCertification) => (
                    //     <div className="flex flex-col gap-2">
                    //         {cert.active_roles.map((log) => (
                    //             <MAKEUserRole
                    //                 role_uuid={log.role_uuid}
                    //                 key={log.role_uuid}
                    //             />
                    //         ))}
                    //     </div>
                    // ),
                    // active_certificates: (user: TUser) => (
                    //     <span>
                    //         {user.active_certificates
                    //             ?.map((cert) => cert.certification_uuid)
                    //             .join(", ")}
                    //     </span>
                    // ),
                }}
                isLoading={isLoading}
                loadingContent={(ref) => (
                    <div className="flex w-full justify-center">
                        <Spinner color="white" ref={ref} />
                    </div>
                )}
            />
        </div>
    );
}
