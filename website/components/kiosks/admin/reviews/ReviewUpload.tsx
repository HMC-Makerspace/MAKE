import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Form,
    Input,
    NumberInput,
    addToast,
} from "@heroui/react";

import React, { Key, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { TResponse, TReview, TReviewQuestion, TRubric } from "common/review";
import clsx from "clsx";
import {
    ArrowLeftIcon,
    CheckIcon,
    DocumentTextIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { ReviewQuestionTable } from "./ReviewQuestionTable";
import { ReviewRubricEditor } from "./ReviewRubricEditor";
import { TUser, UserUUID } from "common/user";
import { validateEmailStrict } from "../../../../../common/verify";
import Fuse from "fuse.js";
import { UserChip } from "../../../user/UserChip";

const createReview = async ({ data }: { data: TReview }) => {
    return (
        await axios.post<TReview>("/api/v3/review", {
            review_obj: data,
        })
    ).data;
};

export default function ReviewUpload({ users }: { users: TUser[] }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [autocompleteText, setAutoCompleteText] = useState<string>();

    const fuse = React.useMemo(() => {
        return new Fuse(users, {
            keys: ["name", "college_id", "email"],
            threshold: 0.3,
        });
    }, [users]);

    const filteredUsers = React.useMemo(() => {
        if (autocompleteText) {
            return fuse.search(autocompleteText).map((result) => result.item);
        } else {
            return users;
        }
    }, [users, fuse, autocompleteText]);

    const mutation = useMutation({
        mutationFn: createReview,
        onSuccess: (data) => {
            queryClient.setQueryData(["review"], (old: TReview[]) => {
                return (old ?? []).concat(data);
            });
            navigate(`/admin/reviews/${data.uuid}`);
            addToast({
                title: `Successfully created review`,
                color: "success",
            });
        },
        onError: (error: AxiosError) => {
            addToast({
                title: `Error: ${error.message}`,
                color: "danger",
            });
        },
    });

    // Title
    const [reviewName, setReviewName] = useState<string>();
    // Uploaded CSV
    const [file, setFile] = useState<File>();
    // Parsed CSV
    const [parsed, setParsed] =
        useState<Papa.ParseResult<Record<string, string>>>();
    // Review questions
    const [questions, setQuestions] = useState<TReviewQuestion[]>([]);
    // Review rubric
    const [rubric, setRubric] = useState<TRubric>({
        uuid: crypto.randomUUID(),
        name: "",
        items: [],
    });
    // Reviewers
    const [reviewers, setReviewers] = useState<UserUUID[]>([]);
    // Reviewers per response
    const [rpr, setRPR] = useState<number>(0);

    const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!parsed || !reviewName) return;
        // Must have exactly 1 email question
        const emailIndex = questions.findIndex((q) => q.type === "email");
        const emailLastIndex = questions.findLastIndex(
            (q) => q.type === "email",
        );
        if (emailIndex === -1) {
            addToast({
                color: "danger",
                title: "No identifying email question",
            });
            return;
        }
        if (emailIndex !== emailLastIndex) {
            addToast({
                color: "danger",
                title: "More than one email question",
            });
            return;
        }
        // Must have exactly 1 timestamp question
        const timestampIndex = questions.findIndex((q) => q.type === "timestamp");
        const timestampLastIndex = questions.findLastIndex(
            (q) => q.type === "timestamp",
        );
        if (timestampIndex === -1) {
            addToast({
                color: "danger",
                title: "No identifying timestamp question",
            });
            return;
        }
        if (timestampIndex !== timestampLastIndex) {
            addToast({
                color: "danger",
                title: "More than one timestamp question",
            });
            return;
        }
        // Ensure there are enough reviewers for the responses
        if (rpr > reviewers.length) {
            addToast({
                color: "danger",
                title: "Not enough reviewers per response",
            });
            return;
        }
        const responses: TResponse[] = parsed.data.map((r) => {
            // Filter out ignored questions
            const values = Object.values(r)
                .filter((_, idx) => questions[idx].type !== "ignore")
                .map((v, idx) =>
                    questions[idx].type === "timestamp"
                        ? String(Date.parse(v) / 1000)
                        : v,
                );
            // Find user by email
            const email = validateEmailStrict(values[emailIndex] || "");
            const associatedUser = email
                ? users.find((u) =>
                      u.email.toLowerCase().match(`^${email.toLowerCase()}$`),
                  )
                : undefined;
            return {
                uuid: crypto.randomUUID(),
                answers: values,
                required_reviewers: [],
                associated_uuid: associatedUser?.uuid,
            };
        });

        // Reviewer index
        let reviewerIndex = 0;
        // Add reviewers to each response based on the reviewers-per-response (rpr)
        for (let count = 0; count < rpr; count++) {
            responses.forEach((response) => {
                if (reviewerIndex >= reviewers.length) {
                    reviewerIndex = 0;
                }
                while (
                    reviewerIndex < reviewers.length &&
                    response.required_reviewers.includes(
                        reviewers[reviewerIndex],
                    )
                ) {
                    reviewerIndex++;
                }
                if (reviewerIndex >= reviewers.length) {
                    reviewerIndex = 0;
                }
                response.required_reviewers.push(reviewers[reviewerIndex]);
                reviewerIndex++;
            });
        }

        const review: TReview = {
            uuid: crypto.randomUUID(),
            title: reviewName,
            timestamp_created: Date.now() / 1000,
            questions,
            responses,
            rubric,
            // Map reviewers to empty rating lists
            ratings: reviewers.reduce(
                (acc, reviewer) => ((acc[reviewer] = []), acc),
                {} as TReview["ratings"],
            ),
        };

        mutation.mutate({ data: review });
    };

    const loadFile = (files: FileList) => {
        if (files && files.length > 0) {
            const loadedFile = files[0];
            setFile(loadedFile);
            if (!reviewName) {
                setReviewName(loadedFile.name.split(".")[0]);
            }
            // @ts-ignore This is a proper file
            Papa.parse<Record<string, string>>(loadedFile, {
                header: true,
                complete: (results) => {
                    setParsed(results);
                    if (results.meta.fields) {
                        setQuestions(
                            results.meta.fields?.map((f) => {
                                // Attempt to match common fields
                                const type = f.match(/email/gi)
                                    ? "email"
                                    : f.match(/timestamp/gi)
                                      ? "timestamp"
                                      : f.match(/name/gi)
                                        ? "confidential"
                                        : "text";
                                return {
                                    uuid: crypto.randomUUID(),
                                    title: f,
                                    type: type,
                                };
                            }),
                        );
                    }
                },
            });
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        loadFile(e.target.files);
    };

    const dropHandler = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setHoveringOver(false);
        loadFile(event.dataTransfer?.files);
    };

    const uploadTrigger = useRef<HTMLInputElement>(null);
    const [hoveringOver, setHoveringOver] = useState(false);

    return (
        <div
            onDrop={dropHandler}
            onDragOver={(e) => {
                e.preventDefault();
                setHoveringOver(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                setHoveringOver(false);
            }}
            className="h-full"
        >
            <Form
                validationBehavior="native"
                onSubmit={onSubmit}
                className={clsx(
                    "size-full flex flex-col items-center justify-start",
                )}
            >
                <input
                    id="upload-trigger"
                    className="hidden"
                    type="file"
                    multiple
                    ref={uploadTrigger}
                    onChange={handleUpload}
                />

                <Input
                    aria-label="Review name"
                    placeholder="New review"
                    value={reviewName}
                    onValueChange={setReviewName}
                    type="text"
                    size="sm"
                    color="primary"
                    variant="underlined"
                    className="w-1/2"
                    classNames={{
                        input: clsx(
                            "placeholder:text-default-400 font-bold",
                            "text-xl text-primary-400",
                        ),
                    }}
                    isRequired
                    minLength={1}
                    errorMessage={"Unsaved changes: please enter a name"}
                    startContent={
                        <div className="font-bold text-xl pr-3 text-default-800">
                            Title:
                        </div>
                    }
                />
                <Button
                    onPress={() => {
                        uploadTrigger.current?.click();
                    }}
                    className={clsx(
                        "w-1/2 min-w-fit h-24 bg-content2 rounded-lg text-default-600",
                        "border-dotted border-primary-100 border-3 p-3",
                        "flex items-center justify-center text-medium",
                        hoveringOver && "bg-content2/80 border-primary-200",
                        !!file && "font-semibold text-default-foreground",
                    )}
                    startContent={
                        file && (
                            <DocumentTextIcon
                                className="size-5 -mt-0.5"
                                strokeWidth={2}
                            />
                        )
                    }
                >
                    {file ? file.name : "Drag and drop a .csv file here"}
                </Button>
                {parsed && (
                    <>
                        <div
                            className={clsx(
                                "font-semibold flex justify-between gap-3",
                                "items-center w-1/2 text-primary-500 px-4",
                            )}
                        >
                            {parsed.errors.length === 0 ? (
                                <div className="text-success-300 flex gap-1 items-center">
                                    <CheckIcon
                                        className="size-5"
                                        strokeWidth={2}
                                    />
                                    Parse successful
                                </div>
                            ) : (
                                <div className="text-danger-400 flex gap-1 items-center">
                                    <XMarkIcon
                                        className="size-5"
                                        strokeWidth={2}
                                    />
                                    Parse error
                                </div>
                            )}
                            <div className={clsx("")}>
                                Parsed {parsed.data.length} rows
                            </div>
                        </div>
                        <div
                            className={clsx(
                                "text-danger-500 whitespace-pre max-h-52 py-1",
                                "overflow-auto bg-default-200 px-2 rounded-md",
                                "w-full empty:hidden",
                            )}
                        >
                            {parsed.errors.slice(0, 30).map((err) => (
                                <div className="flex gap-2">
                                    <div className="font-bold text-danger-600">
                                        {err.row ?? "--"}
                                    </div>{" "}
                                    {err.message}
                                </div>
                            ))}
                            {parsed.errors.length > 30 && " ..."}
                        </div>
                        <ReviewQuestionTable
                            questions={questions}
                            setQuestions={setQuestions}
                        />
                        <ReviewRubricEditor
                            rubric={rubric}
                            setRubric={setRubric}
                        />
                        <div className="w-1/2 flex flex-col gap-2 pt-2">
                            <div className="flex gap-2 items-center justify-end">
                                <div className="text-lg font-semibold text-default-800">
                                    Reviewers
                                </div>
                                <NumberInput
                                    size="lg"
                                    label="Reviewers per response"
                                    labelPlacement="outside-left"
                                    className="justify-self-end w-2/5 ml-10 mr-2"
                                    value={rpr}
                                    onValueChange={setRPR}
                                />
                                <Autocomplete
                                    items={filteredUsers}
                                    isVirtualized
                                    className="w-1/2"
                                    variant="bordered"
                                    size="sm"
                                    label="Select a user to add..."
                                    labelPlacement="inside"
                                    inputValue={autocompleteText}
                                    onInputChange={setAutoCompleteText}
                                    onChange={(key: Key | null) => {
                                        setAutoCompleteText("");
                                        if (!key) return;
                                        setReviewers([
                                            ...reviewers,
                                            String(key),
                                        ]);
                                    }}
                                >
                                    {(user) => (
                                        <AutocompleteItem
                                            key={user.uuid}
                                            textValue={user.name}
                                        >
                                            <div className="flex gap-1 items-center">
                                                <div className="whitespace-nowrap">
                                                    {user.name}
                                                </div>
                                                <div className="text-xs font-bold">
                                                    ({user.email})
                                                </div>
                                            </div>
                                        </AutocompleteItem>
                                    )}
                                </Autocomplete>
                            </div>
                            <div
                                className={clsx(
                                    "bg-default-100 min-h-10 rounded-large p-2",
                                    "empty:after:content-['No_reviewers']",
                                    "flex flex-row flex-wrap gap-2 max-h-[400px] overflow-auto",
                                    "text-md empty:text-default-400 empty:flex",
                                    "empty:justify-center empty:items-center",
                                )}
                            >
                                {reviewers.map((uuid, idx) => (
                                    <UserChip
                                        user_uuid={uuid}
                                        user={users.find(
                                            (u) => u.uuid === uuid,
                                        )}
                                        roles={[]}
                                        onClick={() => {
                                            const newReviewers = [...reviewers];
                                            newReviewers.splice(idx, 1);
                                            setReviewers(newReviewers);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
                <div
                    className={clsx(
                        "flex flex-row self-end mt-auto",
                        "justify-between gap-2 w-full",
                        "sticky bottom-0 pointer-events-none",
                    )}
                >
                    <Button
                        variant="ghost"
                        color="default"
                        onPress={() => navigate("/admin/reviews")}
                        size="lg"
                        className="min-w-48 pointer-events-auto"
                        startContent={
                            <ArrowLeftIcon
                                className="size-4 -ml-2"
                                strokeWidth={3}
                            />
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="shadow"
                        color="primary"
                        isDisabled={!file || !parsed}
                        isLoading={mutation.isPending}
                        type="submit"
                        size="lg"
                        className="min-w-48 pointer-events-auto"
                    >
                        Create
                    </Button>
                </div>
            </Form>
        </div>
    );
}
