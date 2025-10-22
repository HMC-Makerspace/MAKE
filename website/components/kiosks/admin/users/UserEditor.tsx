import { TUser } from "common/user";
import { Form, Input, Selection } from "@heroui/react";
import React from "react";
import UserEditorForm from "./UserEditorForm";

export default function UserEditor({
    users,
    selectedKeys,
    isNew,
    isLoading,
}: {
    users: TUser[];
    selectedKeys: Selection;
    isNew: boolean;
    isLoading: boolean;
}) {
    const selectedUsers = React.useMemo(
        () =>
            selectedKeys === "all"
                ? users
                : users.filter((user) => selectedKeys.has(user.uuid)),
        [selectedKeys, users],
    );

    const isEmpty = selectedUsers.length === 0;
    const isSingle = selectedUsers.length === 1;
    const isMultiple = selectedUsers.length > 1;

    const key = isNew ? "new" : isSingle ? selectedUsers[0].uuid : "multiple";

    return (
        <div className="flex flex-col h-fit lg:h-full w-full lg:w-2/5 rounded-xl bg-content1 p-4 relative">
            <h1 className="3xl font-bold text-center pb-2">User Editor</h1>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <UserEditorForm
                    key={key}
                    user={
                        isSingle
                            ? selectedUsers[0]
                            : {
                                  uuid: "",
                                  name: "",
                                  email: "",
                                  college_id: "",
                                  active_roles: [],
                                  past_roles: [],
                              }
                    }
                    isMultiple={isMultiple}
                    isNew={isNew}
                />
            )}
        </div>
    );
}
