import AdminLayout from "../../layouts/AdminLayout";
import UsersTable from "../../components/kiosks/admin/users/UsersTable";
import UserEditor from "../../components/kiosks/admin/users/UserEditor";
import { ModalContent, Selection } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { TUser, TUserRole } from "common/user";
import React from "react";
import { API_SCOPE } from "../../../common/global";
import { TCertification } from "common/certification";
import { useRoles } from "../../queries/useRoles";
import { Modal, ModalBody, useDisclosure } from "@heroui/react";
import { useMediaQuery } from "../../utils.tsx"

export default function UsersKiosk() {
    // Get all user data
    const { data: users, isLoading: usersLoading } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });

    const { data: roles, isLoading: rolesLoading } = useRoles();

    const { data: certs, isLoading: certsLoading } = useQuery<TCertification[]>(
        {
            queryKey: ["certification"],
            refetchOnWindowFocus: false,
        },
    );

    const isLoading = usersLoading || rolesLoading || certsLoading;

    const scopesQuery = useQuery<API_SCOPE[]>({
        queryKey: ["user", "self", "scopes"],
        refetchOnWindowFocus: false,
    });
    const scopes = scopesQuery.data ?? [];

    const canEdit = scopes.some(
        (scope) => scope === API_SCOPE.ADMIN || scope === API_SCOPE.UPDATE_USER,
    );

    const [selectedKeys, onSelectionChange] = React.useState<Selection>(
        new Set(),
    );

    const [isNewUser, setIsNewUser] = React.useState<boolean>(false);

    const {
        isOpen: editIsOpen,
        onOpen: editOnOpen,
        onClose: editOnClose,
        onOpenChange: editOnOpenChange,
    } = useDisclosure();

    const isMobile = useMediaQuery("(max-width: 1023px)");


    React.useEffect(() => {
        if (selectedKeys !== "all") {
            if (isMobile && (selectedKeys.size > 0 || isNewUser)) {
                editOnOpen();
            } else {
                editOnClose();
            }
        }
    }, [selectedKeys, isNewUser]);


    return (
        <AdminLayout pageHref={"/admin/users"}>
            <div className="flex flex-col lg:flex-row overflow-auto h-full gap-8">
                <div className="hidden lg:block w-2/5">
                    {canEdit && (
                        <UserEditor
                            users={users ?? []}
                            roles={roles ?? []}
                            selectedKeys={selectedKeys}
                            isLoading={isLoading}
                            isNew={isNewUser}
                            onCreate={
                                canEdit
                                    ? (newUser) => {
                                          setIsNewUser(false);
                                          onSelectionChange(new Set([newUser]));
                                      }
                                    : undefined
                            }
                        />
                    )}
                </div>
                <UsersTable
                    users={users ?? []}
                    roles={roles ?? []}
                    certs={certs ?? []}
                    selectedKeys={selectedKeys}
                    onSelectionChange={onSelectionChange}
                    isLoading={isLoading}
                    onCreate={canEdit ? setIsNewUser : undefined}
                    editOnOpenChange={editOnOpenChange}
                />
            </div>

            {/* Modal user editor */}
            <div className='block lg:hidden '>
                {isMobile && canEdit && (
                    <Modal
                        isOpen={editIsOpen}
                        onOpenChange={editOnOpenChange}
                        placement="bottom"
                    >
                        <ModalContent className='overflow-auto'>
                            <ModalBody>
                                <UserEditor
                                    users={users ?? []}
                                    roles={roles ?? []}
                                    selectedKeys={selectedKeys}
                                    isLoading={isLoading}
                                    isNew={isNewUser}
                                    onCreate={
                                        canEdit
                                            ? (newUser) => {
                                                  setIsNewUser(false);
                                                  onSelectionChange(
                                                      new Set([newUser]),
                                                  );
                                              }
                                            : undefined
                                    }
                                />
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                )}
            </div>
        </AdminLayout>
    );
}
