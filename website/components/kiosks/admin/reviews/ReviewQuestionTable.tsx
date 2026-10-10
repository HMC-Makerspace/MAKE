import {
    ScrollShadow,
    Select,
    Selection,
    SelectItem,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { useState } from "react";
import { TReviewQuestion } from "common/review";

const QUESTION_TYPES: { type: TReviewQuestion["type"]; name: string }[] = [
    {
        type: "text",
        name: "Text",
    },
    {
        type: "timestamp",
        name: "Timestamp",
    },
    {
        type: "email",
        name: "Email",
    },
    {
        type: "selection",
        name: "Selection",
    },
    {
        type: "confidential",
        name: "Confidential",
    },
    {
        type: "ignore",
        name: "Ignore",
    },
];

export function ReviewQuestionTable({
    questions,
    setQuestions,
}: {
    questions: TReviewQuestion[];
    setQuestions: (qs: TReviewQuestion[]) => void;
}) {
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
    return (
        <Table
            isHeaderSticky
            aria-label="A table for content"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
            showSelectionCheckboxes
            classNames={{
                base: "h-[415px] w-2/3 overflow-auto pt-3",
                tbody: "[&>tr[data-disabled='true']]:opacity-50",
            }}
            isCompact
        >
            <TableHeader>
                <TableColumn key="field" align="start" className="text-lg">
                    Questions
                </TableColumn>
                <TableColumn key="type" align="start" className="text-sm">
                    Value Type
                </TableColumn>
            </TableHeader>
            <TableBody>
                {questions.map((item, idx) => (
                    <TableRow key={item.uuid}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                            <Select
                                size="sm"
                                aria-label="Type"
                                items={QUESTION_TYPES}
                                selectedKeys={[item.type]}
                                onSelectionChange={(value) => {
                                    if (!value.currentKey) return;
                                    const type =
                                        value.currentKey as TReviewQuestion["type"];
                                    if (
                                        selectedKeys === "all" ||
                                        selectedKeys.has(item.uuid)
                                    ) {
                                        // Update all selected questions
                                        const newQuestions = questions.map(
                                            (q) => ({
                                                ...q,
                                                type:
                                                    selectedKeys === "all" ||
                                                    selectedKeys.has(q.uuid)
                                                        ? type
                                                        : q.type,
                                            }),
                                        );
                                        setQuestions(newQuestions);
                                    } else {
                                        // Only update this question
                                        const newQuestions = [...questions];
                                        newQuestions[idx] = {
                                            ...item,
                                            type,
                                        };
                                        setQuestions(newQuestions);
                                    }
                                }}
                                variant="bordered"
                                classNames={{
                                    base: "min-w-36",
                                }}
                            >
                                {(item) => (
                                    <SelectItem key={item.type}>
                                        {item.name}
                                    </SelectItem>
                                )}
                            </Select>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
