import {
    Button,
    Modal,
    Form,
    ModalContent,
    Input,
    Select,
    SelectItem,
} from "@heroui/react";
import { TrashIcon } from "@heroicons/react/24/outline";

import React from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

import { CertificationUUID, TCertification } from "../../../../../common/certification";
import { TInventoryItem, TItemCertificate } from "../../../../../common/inventory";

const emptyCert: TItemCertificate = {
    certification_uuid: "",
    required_level: 0
};

const updateCerts = async ({
    data,
    certs
}: {
    data: TInventoryItem;
    certs: TItemCertificate[];
}) => {
    data.required_certifications = certs;
    console.log("submitting this:", data)
    return (
        await axios.put<TInventoryItem>("/api/v3/inventory", { item_obj: data })
    ).data;
};

export default function EditCertsModal({
    item,
    certificates,
    isOpen,
    onOpenChange,
    onSuccess,
    onError,
}: {
    item: TInventoryItem;
    certificates: TItemCertificate[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateCerts,
        onSuccess: (obj: TInventoryItem) => {
            // console.log(2, obj)
            queryClient.setQueryData(["inventory", item.uuid], obj);
            queryClient.setQueryData(["inventory"], (old: TInventoryItem[]) => {
                return old.map((i) =>
                    i.uuid === obj.uuid ? obj : i,
                );
            });

            onSuccess(`Successfully updated item ${obj.name}`);
        },
        onError: (error) => {
            onError(`Error: ${error.message}`);
        },
    });

    // Get all certs in order to display possible prereqs
    const allCerts = useQuery<TCertification[]>({
        queryKey: ["certification"],
        refetchOnWindowFocus: false,
    });

    const [hasEdits, setHasEdits] = React.useState<boolean>(false);
    const [certs, setCerts] = React.useState<TItemCertificate[]>(certificates);

    const onSubmit = React.useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            // Prevent default browser page refresh.
            e.preventDefault();

            //if (!hasEdits) return;

            // const data = new FormData(e.currentTarget);

            // let c: TItemCertificate[] = [];
            // console.log(data.get("required_certification_0"));
            // //return;

            // let i = 0;
            // let cert = data.get("required_certification_"+i);
            // while (cert) {
            //     c.push({
            //         "certification_uuid": cert as string,
            //         "required_level": parseInt(data.get("level_"+i) as string)
            //     });
            //     i++;
            //     cert = data.get("required_certification_"+i);
            // }

            mutation.reset();

            // Run the mutation
            mutation.mutate({data: item, certs});
        },
        [mutation, hasEdits],
    );

    const wrapEdit = React.useCallback((i: number, prop: "certification_uuid"|"required_level") => {
        return (val: any) => {
            if (!certs[i]) certs[i] = {...emptyCert}; // copy the emptyCert template

            // let icert: TItemCertificate = {
            //     certification_uuid: cert.uuid,
            //     required_level: lev
            // }

            // console.log(i, prop, val, certs)

            let icert: TItemCertificate = certs[i];

            if (prop == "certification_uuid") {
                // let cuuid: CertificationUUID = `${Array.from(val)}`;
                // //alert(Array.from(val));
                // alert(typeof Array.from(val));
                // console.log(Array.from(val))
                icert.certification_uuid = ""+Array.from(val)[0];//cuuid;
                // console.log(icert);
            } else {
                icert.required_level = parseInt(val);
            }

            // icert[prop] = val;

            certs[i] = icert;

            //certs[i][prop] = val; // update the value
            setCerts([...certs]); // update the certs list

            
            setHasEdits(true);
        };
    }, [certs]);

    const wrapSetEdit = React.useCallback((i: number, prop: "certification_uuid"|"required_level") => {
        return (value: any) => {
            wrapEdit(i, prop)(Array.from(value));
        };
    }, []);

    const isValid = React.useMemo(() => {
        for (let i = 0; i < certs.length; i++) {
            if (certs[i].certification_uuid == "" || certs[i].required_level < 1) {
                return false; // invalid edit
            }
        }

        return hasEdits; // otherwise, invalid iff no edits made
    }, [hasEdits, certs]);
    
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
            <ModalContent>
                {(onClose) => (
                    <Form
                        onSubmit={onSubmit}
                        className="flex flex-col gap-4 p-4"
                    >
                        <div className="text-lg font-semibold">Edit Required Certifications</div>

                        {(() => {//console.log(item);
                            return (<div></div>)})() /* mfw i want to log smth */}

                        {certs?.map((cert, i) => (
                            <div className="flex flex-row w-full gap-2 items-center" key={item.uuid + "-cert" + i}>
                                
                                {(allCerts.data && (<Select<TItemCertificate> // this should probably be a separate component
                                    label="Certification"
                                    name={"required_certification_"+i}
                                    placeholder="Required Certification"
                                    onSelectionChange={wrapEdit(i, "certification_uuid")}
                                    defaultSelectedKeys={[cert.certification_uuid]}
                                    isRequired
                                    size="lg"
                                    variant="faded"
                                    color="primary"
                                    labelPlacement="inside"
                                    classNames={{
                                        value: "text-default-500",
                                    }}
                                    itemHeight={45}
                                    // renderValue={(selectedKeys) => {
                                    //     if (selectedKeys.length === 0) {
                                    //         // If no prereqs are selected, show the placeholder
                                    //         return "";
                                    //     } else {
                                    //         return (
                                    //             // Otherwise, show the selected prereqs in a flexbox
                                    //             <div className="flex flex-wrap gap-1 p-2">
                                    //                 {selectedKeys.map(
                                    //                     (c) => {
                                    //                         return c.key &&
                                    //                             c.textValue ? (
                                    //                                 // <div key={item.uuid + "-prereq-" + c.key}>{c.key as string}</div>
                                    //                                 <ItemCertTag cert_uuid={c.key as string} req_level={1} key={item.uuid + "-prereq-" + c.key} on_level_change={()=>{}} />
                                    //                             // <CertificationTag cert_uuid={c.key as string} key={item.uuid + "-prereq-" + c.key} />
                                    //                         ) : null;
                                    //                     },
                                    //                 )}
                                    //             </div>
                                    //         );
                                    //     }
                                    // }}
                                >
                                    {allCerts.data.map((c) => (
                                        <SelectItem
                                            key={
                                                c.uuid
                                            }
                                            textValue={
                                                c.name
                                            }
                                            value={
                                                c.uuid
                                            }
                                            className="h-[45px]"
                                        >
                                            <div>{c.uuid /* todo cert tag here */}</div>
                                        </SelectItem>
                                    ))}
                                </Select>))}

                                <Input
                                    type="number"
                                    label="Level"
                                    name={"level_"+i}
                                    placeholder=""
                                    isRequired
                                    value={`${cert.required_level}`}
                                    onValueChange={wrapEdit(i, "required_level")}
                                    variant="faded"
                                    color="primary"
                                    size="md"
                                    classNames={{
                                        input: clsx([
                                            "placeholder:text-default-500",
                                            "placeholder:italic",
                                            "text-default-700",
                                        ]),
                                        base: "w-[25%]"
                                    }}
                                />

                                <Button
                                    variant="flat"
                                    color="danger"
                                    onPress={() => {
                                        certs.splice(i, 1); // remove that cert
                                        setCerts([...certs]);
                                        setHasEdits(true);
                                        // console.log("d", i, certs)
                                    }}
                                    isIconOnly
                                >
                                    <TrashIcon className="size-6" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            color="primary"
                            className="w-full sm:w-1/3"
                            isLoading={false}
                            onPress={() => {
                                setCerts([...certs, {...emptyCert}]); // add a copy of the emptyDoc template
                                setHasEdits(true);
                                // console.log("a", certs)
                            }}
                        >
                            Add certification
                        </Button>

                        <div
                            className="flex flex-row justify-between w-full"
                        >
                            <Button
                                variant="shadow"
                                type="submit"
                                color="primary"
                                className="w-full sm:w-auto"
                                isDisabled={!isValid}
                                isLoading={mutation.isPending}
                            >
                                Submit
                            </Button>
                            <Button
                                variant="flat"
                                color="danger"
                                onPress={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                )}
            </ModalContent>
        </Modal>
    );
}