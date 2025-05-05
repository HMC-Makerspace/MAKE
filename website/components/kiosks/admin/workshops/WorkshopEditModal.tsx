import React, {useEffect} from "react";
import {
	Button,
	Modal,
	ModalHeader,
	ModalBody,
	ModalContent,
	ModalFooter,
	Select,
	SelectItem,
	Form,
	Textarea,
	Input,
	DatePicker,
	DateInput,
	TimeInput
} from "@heroui/react";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { TWorkshop } from "../../../../../common/workshop";
import { UserRoleUUID, UserUUID } from "../../../../../common/user";
import { CertificationUUID } from "../../../../../common/certification";
import { UnixTimestamp } from "../../../../../common/global";
import { FileUUID } from "../../../../../common/file";
import { timestampToZonedDateTime } from "../../../../utils";

import clsx from "clsx";
import { set } from "mongoose";

export default function WorkshopEditModal({
    workshop,
	isNew,
    isOpen,
    onOpenChange,
}:{
  workshop?: TWorkshop;
  isNew: boolean;
  isOpen: boolean;
  onOpenChange: () => void;
}) {

	//workshop properties 
	const [UUID, setUUID] = React.useState<string>(workshop?.uuid ?? crypto.randomUUID());
	const [title, setTitle] = React.useState<string>(workshop?.title ?? "");
	const [description, setDescription] = React.useState<string>(workshop?.description ?? "");
	const [instructors, setInstructors] = React.useState<UserUUID[]>(workshop?.instructors ?? []);
	const [supportInstructors, setSupportInstructors] = React.useState<UserUUID[]>(workshop?.support_instructors ?? []);
	const [capacity, setCapacity] = React.useState<number>(workshop?.capacity ?? 0);
	const [timestampStart, setTimestampStart] = React.useState<UnixTimestamp>(workshop?.timestamp_start ?? 0);
	const [timestampEnd, setTimestampEnd] = React.useState<UnixTimestamp>(workshop?.timestamp_end ?? 0);
	const [timestampPublic, setTimestampPublic] = React.useState<UnixTimestamp>(workshop?.timestamp_public ?? 0);
	const [requiredCertifications, setRequiredCertifications] = React.useState<CertificationUUID[]>(workshop?.required_certifications ?? []);
	const [images, setImages] = React.useState<FileUUID[]>(workshop?.images ?? []);
	const [authorizedRoles, setAuthorizedRoles] = React.useState<UserRoleUUID[]>(workshop?.authorized_roles ?? []);

	useEffect(() => {
		setUUID(workshop?.uuid ?? crypto.randomUUID());
		setTitle(workshop?.title ?? "");
		setDescription(workshop?.description ?? "");
		setInstructors(workshop?.instructors ?? []);
		setSupportInstructors(workshop?.support_instructors ?? []);
		setCapacity(workshop?.capacity ?? 0);
		setTimestampStart(workshop?.timestamp_start ?? 0);
		setTimestampEnd(workshop?.timestamp_end ?? 0);
		setTimestampPublic(workshop?.timestamp_public ?? 0);
		setRequiredCertifications(workshop?.required_certifications ?? []);
		setImages(workshop?.images ?? []);
		setAuthorizedRoles(workshop?.authorized_roles ?? []);
		setHasEdits(false);
	  }, [workshop]);

	const [hasEdits, setHasEdits] = React.useState<boolean>(false);
	const isEmpty = !workshop?.uuid && !isNew;

	// A function that wraps a setter to also update the hasEdits state
	const wrapEdit = React.useCallback((fn: (arg0: any) => void) => {
		return (value: any) => {
			fn(value);
			setHasEdits(true);
		};
	}, []);

	return (
    <Modal
      isOpen={isOpen}
      placement="top-center"
      onOpenChange={onOpenChange}
      className="flex flex-col justify-center align-center"
      size="2xl"
      >
		<ModalContent>
			<ModalHeader>
			<h1 className="text-2xl font-bold">Create/Edit Workshop</h1>
			</ModalHeader>
			<ModalBody>
			<Form>
			<div className='flex flex-col w-full gap-2'>
				<div className='flex flex-row gap-4 '>
					<Input 
						type="text"
						label="UUID"
						name="uuid"
						placeholder={UUID}
						// UUID is not editable
						isDisabled
						value={UUID}
						onValueChange={wrapEdit(setUUID)}
						variant="faded"
						color="primary"
						size="md"
						classNames={{
							input: clsx([
								"placeholder:text-default-500",
								"placeholder:italic",
								"text-default-700",
								"w-[50%]"
							]),
						}}
					/>
					<Button
					// Create button to copy the UUID to the clipboard
					size="md"
					radius="lg"
					className="my-auto"
					isIconOnly
					onPress={() => {
						// Copy the UUID to the clipboard
						navigator.clipboard.writeText(UUID);
					}}
				>
					<ClipboardIcon className="size-6 text-primary-300" />
				</Button>
				</div>
				
				<Input 
					type="text"
					label="Workshop Title"
					name="title"
					isRequired
					placeholder="Enter workshop title"
					value={title}
					onValueChange={wrapEdit(setTitle)}
					variant="faded"
					color="primary"
					classNames={{
						input: clsx([
							"placeholder:text-default-500",
							"placeholder:italic",
							"text-default-700",
						]),
					}}
				/>

				<Textarea
					label="Description"
					name="description"
					placeholder="Enter workshop description"
					value={description}
					onValueChange={wrapEdit(setDescription)}
					variant="faded"
					color="primary"
					classNames={{
						input: clsx([
							"placeholder:text-default-500",
							"placeholder:italic",
							"text-default-700",
						]),
					}} 
				/>
				<div className="flex flex-row gap-2">
					<DateInput 
						label="Public On Make"
						name="public_timestamp"
						isRequired
						granularity="minute"
						hideTimeZone
						value={timestampPublic !== 0 ? timestampToZonedDateTime(timestampPublic) : null}
						// onValueChange={wrapEdit(setTimestampPublic)}
						variant="faded"
						color="primary"
						classNames={{
							input: clsx([
								"placeholder:text-default-500",
								"placeholder:italic",
								"text-default-700",
							]),
						}} 
					/>
					<DateInput 
						label="Workshop Start"
						name="timestamp_start"
						isRequired
						granularity="minute"
						hideTimeZone
						value={timestampStart !== 0 ? timestampToZonedDateTime(timestampStart) : null}
						// onValueChange={wrapEdit(setTimestampPublic)}
						variant="faded"
						color="primary"
						classNames={{
							input: clsx([
								"placeholder:text-default-500",
								"placeholder:italic",
								"text-default-700",
							]),
						}} 
					/>
					<DateInput 
						label="Workshop End"
						name="timestamp_end"
						isRequired
						granularity="minute"
						hideTimeZone
						value={timestampEnd !== 0 ? timestampToZonedDateTime(timestampEnd) : null}
						// onValueChange={wrapEdit(setTimestampPublic)}
						variant="faded"
						color="primary"
						classNames={{
							input: clsx([
								"placeholder:text-default-500",
								"placeholder:italic",
								"text-default-700",
							]),
						}} 
					/>
					
					
				</div>
			</div>
          </Form>
          </ModalBody>
        <ModalFooter className='flex flex-row justify-between items-center'>
          <Button
            color="primary"
            onPress={() => {
              onOpenChange();
            }}
          >
            Submit
          </Button>
		  <Button
            color="danger"
            onPress={() => {
              onOpenChange();
            }}
          >
            Cancel
          </Button>
              </ModalFooter>
        </ModalContent>
    </Modal>
  )
}