import AdminLayout from "../../layouts/AdminLayout";
import UsersTable from "../../components/kiosks/admin/users/UsersTable";
import UserEditor from "../../components/kiosks/admin/users/UserEditor";
import {
    Alert,
    Modal,
    ModalContent,
    Selection,
    useDisclosure,
} from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import React from "react";

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

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const [isNewUser, setIsNewUser] = React.useState<boolean>(false);

    return (
        <AdminLayout pageHref={"/admin/users"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <UserEditor
                    users={data ?? []}
                    selectedKeys={selectedKeys}
                    isLoading={isLoading}
                    isNew={isNewUser}
                />
                <UsersTable
                    users={data ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                    onCreate={setIsNewUser}
                />
            </div>
        </AdminLayout>
    );
}
