import { TUser } from "common/user";
import { Form, Input, Selection } from "@heroui/react";
import React from "react";
import UserEditorForm from "./UserEditorForm";

export default function UserEditor({
    users,
    selectedKeys,
    onSelectionChange,
    isNew,
    isLoading,
}: {
    users: TUser[];
    selectedKeys: Selection;
    onSelectionChange: (selectedKeys: Selection) => void;
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

    // console.log("selectedUsers", selectedUsers);
    // console.log("isEmpty", isEmpty);
    // console.log("isSingle", isSingle);
    // console.log("isMultiple", isMultiple);
    // console.log("name", name);

    const onCancel = () => {
        onSelectionChange(new Set());
    };

    return (
        <div className="flex flex-col h-fit lg:h-full w-full lg:w-2/5 rounded-xl bg-content1 p-4">
            <h1 className="3xl font-bold text-center pb-2">User Editor</h1>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <UserEditorForm
                    key={isSingle ? selectedUsers[0].uuid : "multiple"}
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
                    onCancel={onCancel}
                />
            )}
        </div>
    );
}
