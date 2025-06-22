import { Select, SelectItem, Selection, SlotsToClasses } from "@heroui/react";
import { CertificationUUID, TCertification } from "common/certification";
import CertificationTag from "./CertificationTag";

export function CertSelect({
    certifications,
    selectedKeys = undefined,
    onSelectionChange = () => {},
    defaultSelectedKeys = [],
    disabledKeys,
    inputName = "certs",
    placeholder = "Select certifications",
    label = "Certifications",
    selectionMode = "multiple",
    isRequired = false,
    isDisabled = false,
    className = "",
    classNames = {
        value: "text-default-500 min-h-[48px] content-center",
    },
}: {
    certifications: TCertification[];
    selectedKeys?: Selection;
    onSelectionChange?: (keys: Selection) => void;
    defaultSelectedKeys?: CertificationUUID[];
    disabledKeys?: CertificationUUID[];
    inputName?: string;
    placeholder?: string;
    label?: string;
    selectionMode?: "single" | "multiple";
    isRequired?: boolean;
    isDisabled?: boolean;
    className?: string;
    classNames?: SlotsToClasses<
        | "label"
        | "description"
        | "errorMessage"
        | "base"
        | "value"
        | "selectorIcon"
        | "mainWrapper"
        | "trigger"
        | "innerWrapper"
        | "spinner"
        | "listboxWrapper"
        | "listbox"
        | "popoverContent"
        | "helperWrapper"
    >;
}) {
    return (
        <Select<TCertification>
            name={inputName}
            selectedKeys={selectedKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            disabledKeys={disabledKeys}
            onSelectionChange={onSelectionChange}
            selectionMode={selectionMode}
            isRequired={isRequired}
            isDisabled={isDisabled}
            isMultiline
            placeholder={placeholder}
            size="lg"
            variant="faded"
            color="primary"
            label={label}
            aria-label={"Certification Selection"}
            labelPlacement="inside"
            className={className}
            classNames={classNames}
            itemHeight={45}
            renderValue={(selectedKeys) => {
                if (selectedKeys.length === 0) {
                    // If no certs are selected, show the placeholder
                    return "";
                } else {
                    return (
                        // Otherwise, show the selected certs in a flexbox
                        <div className="flex flex-wrap gap-1 p-2">
                            {selectedKeys.map((c) => {
                                return c.key && c.textValue ? (
                                    <CertificationTag
                                        key={"cert-" + c.key}
                                        cert_uuid={c.key as string}
                                        certifications={certifications}
                                    />
                                ) : null;
                            })}
                        </div>
                    );
                }
            }}
        >
            {certifications.map((c) => (
                <SelectItem
                    key={c.uuid}
                    textValue={c.name}
                    className="h-[45px]"
                >
                    <CertificationTag
                        cert_uuid={c.uuid}
                        certifications={certifications}
                    />
                </SelectItem>
            ))}
        </Select>
    );
}
