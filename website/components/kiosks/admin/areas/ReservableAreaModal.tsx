import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Select,
    SelectItem,
    ModalFooter,
    Button,
    Checkbox,
    Divider,
    NumberInput,
} from "@heroui/react";
import { UseMutationResult } from "@tanstack/react-query";
import {
    ITEM_ACCESS_DESCRIPTORS,
    ITEM_ACCESS_TYPE,
} from "../../../../../common/inventory";
import { TArea, AreaUUID } from "common/area";
import { useMemo, useState } from "react";
import { UserRoleSelect } from "../../../user/UserRoleSelect";
import { TUserRole } from "common/user";
import { CertSelect } from "../certifications/CertSelect";
import { TCertification, TRequiredCertificate } from "common/certification";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ReservableConfirmationModal({
    area,
    roles,
    certifications,
    patchMutation,
    isOpen,
    onOpenChange,
}: {
    area: TArea;
    roles: TUserRole[];
    certifications: TCertification[];
    patchMutation: UseMutationResult<
        TArea,
        Error,
        {
            uuid: AreaUUID;
            patch: Partial<TArea>;
        }
    >;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [reservable, setReservable] = useState(area.reservable);
    const [availableToRoles, setAvailableToRoles] = useState(
        area.available_to || [],
    );
    const [requiredCerts, setRequiredCerts] = useState(
        area.required_certifications || [],
    );

    const [openAuthorized, setOpenAuthorized] = useState(
        area.available_to == null,
    );

    const [hasEdits, setHasEdits] = useState(false);

    function wrapEdit<P extends keyof TRequiredCertificate>(
        i: number,
        prop: P,
    ) {
        return (val: TRequiredCertificate[P]) => {
            if (!requiredCerts[i]) {
                requiredCerts[i] = {
                    certification_uuid: "",
                    required_level: 0,
                };
            }
            const cert = {...requiredCerts[i]};
            cert[prop] = val;
            const certs = [...requiredCerts];
            certs[i] = cert;
            setRequiredCerts(certs); // update the instance list
            setHasEdits(true);
        };
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <ModalHeader>Area Reservation Settings</ModalHeader>
                <ModalBody>
                    If an area is reservable, it will appear in the checkout
                    kiosk for users to reserve. Any user with all of the
                    required certifications and at least one of the authorized
                    roles will be able to reserve the area.
                    <Divider className="bg-default-200 h-0.5" />
                    <div className="flex w-full justify-center gap-12 font-bold">
                        Reservable?
                        <Checkbox
                            color="success"
                            size="lg"
                            isSelected={reservable}
                            onValueChange={(v) => {
                                setReservable(v);
                                setHasEdits(hasEdits || v != area.reservable);
                            }}
                        />
                    </div>
                    <div
                        className={clsx(
                            "rounded-lg bg-default-100 p-2",
                            "border-default-200 border-2",
                            "flex flex-col gap-2",
                        )}
                    >
                        <span
                            className={clsx(
                                "text-primary-300 text-sm pl-3",
                                !area.reservable && "opacity-disabled",
                            )}
                        >
                            Required Certifications
                        </span>
                        {requiredCerts.map((cert, i) => (
                            <div
                                className="flex flex-col sm:flex-row w-full gap-2 items-top"
                                key={area.uuid + "-cert" + i}
                            >
                                <CertSelect
                                    certifications={certifications}
                                    defaultSelectedKeys={[
                                        cert.certification_uuid,
                                    ]}
                                    disabledKeys={requiredCerts
                                        .filter((_, j) => j != i)
                                        .map((c) => c.certification_uuid)}
                                    onSelectionChange={(s) => {
                                        if (s == "all") return;
                                        wrapEdit(
                                            i,
                                            "certification_uuid",
                                        )(Array.from(s)[0] as string);
                                    }}
                                    placeholder="Select a requirement"
                                    label=""
                                    isRequired
                                    selectionMode="single"
                                    classNames={{
                                        value: "text-default-500 min-h-[60.66px] content-center",
                                        trigger:
                                            "bg-default-100/50 backdrop-blur-sm",
                                        listbox: "bg-default-100/50",
                                    }}
                                />

                                <div className="w-full h-full flex gap-2 items-center">
                                    <NumberInput
                                        label="Minimum Level"
                                        name="required_level"
                                        placeholder="0 for any level"
                                        minValue={0}
                                        value={cert.required_level}
                                        onValueChange={wrapEdit(
                                            i,
                                            "required_level",
                                        )}
                                        variant="faded"
                                        color="primary"
                                        size="lg"
                                        classNames={{
                                            mainWrapper: "h-full",
                                            base: "h-full",
                                            input: clsx([
                                                "placeholder:text-default-500",
                                                "placeholder:italic",
                                                "text-default-700",
                                            ]),
                                        }}
                                    />

                                    <Button
                                        variant="flat"
                                        color="danger"
                                        onPress={() => {
                                            requiredCerts.splice(i, 1); // remove that cert
                                            setRequiredCerts([
                                                ...requiredCerts,
                                            ]);
                                            setHasEdits(true);
                                        }}
                                        isIconOnly
                                    >
                                        <TrashIcon className="size-6" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            className="w-full"
                            size="sm"
                            onPress={() => {
                                setRequiredCerts([
                                    ...requiredCerts,
                                    {
                                        certification_uuid: "",
                                        required_level: 0,
                                    },
                                ]); // add a copy of the emptyCert template
                                setHasEdits(true);
                            }}
                        >
                            <PlusIcon className="size-5" strokeWidth={2} />
                        </Button>
                    </div>
                    <div className="flex flex-row w-full gap-2 items-center">
                        <UserRoleSelect
                            roles={roles}
                            selectedKeys={availableToRoles}
                            isDisabled={!reservable || openAuthorized}
                            label="Authorized Roles"
                            labelPlacement="inside"
                            placeholder={
                                openAuthorized
                                    ? "Reservable by all roles"
                                    : "Select authorized roles"
                            }
                            onSelectionChange={(s) => {
                                if (s === "all") {
                                    setAvailableToRoles(
                                        roles.map((r) => r.uuid),
                                    );
                                } else {
                                    setAvailableToRoles(
                                        Array.from(s) as string[],
                                    );
                                }
                                setHasEdits(
                                    hasEdits ||
                                        availableToRoles !=
                                            area.available_to,
                                );
                            }}
                        />
                        <div className="w-1/12 h-full flex flex-col text-center">
                            <span
                                className={clsx(
                                    "text-primary-300 text-xs mb-2",
                                    !reservable && "opacity-disabled",
                                )}
                            >
                                All
                            </span>
                            <Checkbox
                                isSelected={openAuthorized}
                                isDisabled={!reservable}
                                onValueChange={(v) => {
                                    setOpenAuthorized(v);
                                    setAvailableToRoles([]);
                                    setHasEdits(true);
                                }}
                                color="primary"
                                size="lg"
                                className="mx-auto px-0"
                                classNames={{
                                    wrapper: "me-0",
                                }}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter className="justify-between">
                    <Button
                        color="primary"
                        isDisabled={
                            !hasEdits ||
                            requiredCerts.some((c) => !c.certification_uuid)
                        }
                        onPress={() => {
                            patchMutation.mutate({
                                uuid: area.uuid,
                                patch: {
                                    reservable: reservable,
                                    available_to: openAuthorized
                                        ? null
                                        : availableToRoles,
                                    required_certifications: requiredCerts,
                                },
                            });
                            onOpenChange(false);
                        }}
                    >
                        Submit
                    </Button>
                    <Button
                        color="secondary"
                        variant="flat"
                        onPress={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
