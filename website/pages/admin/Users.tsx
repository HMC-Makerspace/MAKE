import AdminLayout from "../../layouts/AdminLayout";
import UsersNavbar from "../../components/kiosks/admin/users/UsersNavbar";

import UsersTable from "../../components/kiosks/admin/users/UsersTable";
import {
    Button,
    Modal,
    ModalContent,
    Selection,
    SortDescriptor,
    useDisclosure,
} from "@heroui/react";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import React from "react";
import Fuse from "fuse.js";
import axios from "axios";

function EditUserModal({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: () => void;
}) {
    return (
        <Modal
            id="edit-user"
            placement="auto"
            isOpen={isOpen}
            onOpenChange={onOpenChange}
        >
            <ModalContent>{(onClose) => <div>Edit user</div>}</ModalContent>
        </Modal>
    );
}

function CreateUserModal({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: () => void;
}) {
    return (
        <Modal
            id="create-user"
            isOpen={isOpen}
            placement="auto"
            onOpenChange={onOpenChange}
        >
            <ModalContent>{(onClose) => <div></div>}</ModalContent>
        </Modal>
    );
}

export default function UsersPage() {
    // Get all user data
    const { data, isLoading, isError } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    // Combine all user pages into a single array
    const users = React.useMemo(() => data ?? [], [data]);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    return (
        <AdminLayout pageHref={"/admin/users"}>
            <UsersTable
                users={users}
                selectedKeys={selectedKeys}
                onSelectionChange={onSelectionChange}
                isLoading={isLoading}
            />
        </AdminLayout>
    );
}
