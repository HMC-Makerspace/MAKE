import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Selection,
    Select,
    SelectItem,
} from "@heroui/react";
import { TUser } from "common/user";
import { ColumnSelect } from "../../../Table";
import { useState } from "react";

export default function UserExportModal({
    users,
    columns,
    visibleColumns,
    setVisibleColumns,
    isOpen,
    onOpenChange,
}: {
    users: TUser[];
    columns: { name: string; id: string }[];
    visibleColumns: Selection;
    setVisibleColumns: (newColumns: Selection) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [separator, setSeparator] = useState(",");

    const onPress = () => {
        const keys = Array.from(visibleColumns);

        // Header
        let csvString = keys.join(",") + "\n";

        // Add the rows
        users.forEach((user) => {
            // Map object values to the keys and join with commas
            csvString +=
                keys
                    .map((key) => {
                        // @ts-ignore All key items are valid user keys
                        let value = String(user[key]);
                        // Basic escaping for special characters (commas, quotes)
                        if (
                            typeof value === "string" &&
                            (value.includes(",") || value.includes('"'))
                        ) {
                            value = `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    })
                    .join(",") + "\n";
        });

        const blob = new Blob([csvString]);

        const a = document.createElement("a");
        a.style.display = "none";
        document.body.appendChild(a);

        a.href = URL.createObjectURL(blob);
        a.download = "users.csv";
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        onOpenChange(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            onOpenChange={onOpenChange}
            size="lg"
            className="flex flex-col justify-center"
        >
            <ModalContent className="flex flex-col justify-center">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col justify-between pb-2">
                            Export User Data
                            <div className="text-small text-default-400">
                                {`Total ${users.length} entries`}
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <div className="w-full flex flex-row gap-2">
                                <Select
                                    label="Separator"
                                    name="separator"
                                    variant="faded"
                                    color="primary"
                                    size="md"
                                    labelPlacement="outside-left"
                                    classNames={{
                                        base: "justify-center",
                                    }}
                                    selectedKeys={separator}
                                    onSelectionChange={(key) =>
                                        key.currentKey
                                            ? setSeparator(key.currentKey)
                                            : null
                                    }
                                    className="w-3/4"
                                    isRequired
                                >
                                    <SelectItem key=",">Comma</SelectItem>
                                    <SelectItem key={`\t`}>Tab</SelectItem>
                                </Select>
                                <ColumnSelect
                                    columns={columns}
                                    visibleColumns={visibleColumns}
                                    setVisibleColumns={setVisibleColumns}
                                    isLoading={false}
                                />
                            </div>
                            <ModalFooter className="w-full justify-between">
                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="shadow"
                                    color="primary"
                                    type="submit"
                                    onPress={onPress}
                                >
                                    Export
                                </Button>
                            </ModalFooter>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
