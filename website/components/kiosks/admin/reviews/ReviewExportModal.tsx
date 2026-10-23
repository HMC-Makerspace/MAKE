import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@heroui/react";
import clsx from "clsx";
import { TReview } from "common/review";
import { TUser } from "common/user";
import Papa from "papaparse";

export function ReviewExportModal({
    review,
    users,
    isOpen,
    onOpenChange,
}: {
    review: TReview;
    users: TUser[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const reviewers = Object.keys(review.ratings);
    const expectedRatings = review.responses.reduce(
        (acc, res) => acc + res.required_reviewers.length,
        0,
    );
    const totalRatings = Object.values(review.ratings).reduce(
        (acc, rat) => acc + rat.length,
        0,
    );
    const onExport = async () => {
        const response_uuids = review.responses.map((res) => res.uuid);

        const responder_uuids = review.responses.map(
            (res) => res.associated_uuid || "",
        );
        const responder_names = responder_uuids.map(
            (uuid) => users.find((u) => u.uuid === uuid)?.name || "",
        );
        const reviewer_cols: Record<string, (string | number)[]> = {};
        for (const [reviewer_uuid, ratings] of Object.entries(review.ratings)) {
            const reviewer_name =
                users.find((u) => u.uuid === reviewer_uuid)?.name ??
                reviewer_uuid;
            const rating_col = response_uuids.map((response_uuid) => {
                // Find rating for this response
                const rating = ratings.find(
                    (rat) => response_uuid === rat.response_uuid,
                );
                // Average rubric values
                return rating
                    ? rating.rubric_values.reduce(
                          (sum, rv) => sum + rv.value,
                          0,
                      ) / rating.rubric_values.length
                    : "";
            });
            reviewer_cols[reviewer_name] = rating_col;
        }
        const output: Record<string, string | number>[] = response_uuids.map(
            (response_uuid, index) => {
                const base: Record<string, string | number> = {
                    "Response UUID": response_uuid,
                    "Responder UUID": responder_uuids[index],
                    Name: responder_names[index],
                };
                for (const [reviewer_uuid, values] of Object.entries(
                    reviewer_cols,
                )) {
                    base[reviewer_uuid] = values[index];
                }
                return base;
            },
        );
        const csv = Papa.unparse(output);
        const blob = new Blob([csv]);

        const a = document.createElement("a");
        a.style.display = "none";
        document.body.appendChild(a);

        a.href = URL.createObjectURL(blob);
        a.download = `${review.title} Ratings.csv`;
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };
    return (
        <Modal size="2xl" isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                <ModalHeader className="text-xl pb-1">
                    Export {review.title}
                </ModalHeader>
                <ModalBody>
                    <div className="flex gap-4 text-lg">
                        <div className="flex gap-2">
                            Responses:
                            <div className="text-primary-400">
                                {review.responses.length}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            Reviewers:
                            <div className="text-primary-400">
                                {reviewers.length}
                            </div>
                        </div>
                        <div className="ml-auto flex gap-2">
                            Expected Ratings:
                            <div className="text-primary-400">
                                {expectedRatings}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            Total Ratings:
                            <div
                                className={clsx(
                                    totalRatings < expectedRatings
                                        ? "text-danger-400"
                                        : "text-success-400",
                                )}
                            >
                                {totalRatings}
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        endContent={
                            <ArrowUpTrayIcon
                                className="size-5"
                                strokeWidth={2}
                            />
                        }
                        variant="solid"
                        color="primary"
                        className="w-fit self-end text-medium"
                        onPress={onExport}
                    >
                        Export
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
