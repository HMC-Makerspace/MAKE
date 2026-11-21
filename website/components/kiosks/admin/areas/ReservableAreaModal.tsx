import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
    Divider,
} from "@heroui/react";
import { UseMutationResult } from "@tanstack/react-query";
import { TArea, AreaUUID } from "common/area";
import { useState } from "react";
import { TUserRole } from "common/user";
import { TCertification, TRequiredCertificate } from "common/certification";
import clsx from "clsx";
import { RequiredRoles } from "../../../RequiredRoles";
import { RequiredCerts } from "../certifications/RequiredCertsModal";

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
        area.available_to || null,
    );
    const [requiredCerts, setRequiredCerts] = useState(
        area.required_certifications || [],
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
                    <Divider className="bg-default-200 h-0.5" />
                    <div
                        className={clsx(
                            "rounded-lg bg-default-50/60 p-2",
                            "border-default-200 border-2",
                            "flex flex-col gap-2",
                        )}
                    >
                        <RequiredCerts
                            currentCerts={requiredCerts}
                            setCurrentCerts={setRequiredCerts}
                            certifications={certifications}
                            setHasEdits={setHasEdits}
                        />
                    </div>
                    <RequiredRoles
                        type="available_to"
                        roles={roles}
                        currentRoles={availableToRoles}
                        setCurrentRoles={setAvailableToRoles}
                        setHasEdits={setHasEdits}
                    />
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
                                    available_to: availableToRoles,
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
