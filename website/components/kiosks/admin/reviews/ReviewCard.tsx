import { Button, Card, useDisclosure } from "@heroui/react";
import { TConfig } from "common/config";
import { TReview } from "common/review";
import { timestampToZonedDateTime } from "../../../../utils";
import { DateFormatter } from "@internationalized/date";
import { ArrowRightIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { ReviewExportModal } from "./ReviewExportModal";
import { TUser } from "common/user";
import clsx from "clsx";
import { UserChip } from "../../../user/UserChip";

export function ReviewCard({
    review,
    users,
    config,
}: {
    review: TReview;
    users: TUser[];
    config?: TConfig;
}) {
    const navigate = useNavigate();
    const zdt = timestampToZonedDateTime(
        review.timestamp_created,
        config?.schedule.timezone,
    );

    const date_formatter = config?.schedule.locale
        ? new DateFormatter(config.schedule.locale, {
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : undefined;

    const { isOpen: exportModalOpen, onOpenChange: exportModalChange } =
        useDisclosure();
    return (
        <Card
            className={clsx(
                "bg-default-200 w-full h-full p-3",
                "px-4 flex-col gap-3 text-default-700",
            )}
            shadow="sm"
        >
            <div className="flex gap-2 justify-between items-center">
                <div className="text-2xl font-bold">{review.title}</div>
                <div className="font-semibold text-lg text-default-600">
                    Created:{" "}
                    {zdt &&
                        date_formatter &&
                        date_formatter.format(zdt.toDate())}
                </div>
            </div>
            <div
                className={clsx(
                    "p-3 pt-2 flex flex-col gap-2",
                    "text-lg bg-default-100 rounded-lg",
                    "font-bold ",
                    "border-2 border-primary-100",
                )}
            >
                Reviewers
                <div className="flex gap-2 flex-wrap w-full">
                    {Object.keys(review.ratings).map((reviewer) => (
                        <UserChip
                            user_uuid={reviewer}
                            user={users.find((u) => u.uuid === reviewer)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex w-full justify-between gap-2">
                <Button
                    endContent={
                        <ArrowUpTrayIcon className="size-5" strokeWidth={2} />
                    }
                    variant="solid"
                    color="primary"
                    className="w-fit self-end text-lg"
                    onPress={exportModalChange}
                >
                    Export
                </Button>
                <Button
                    endContent={
                        <ArrowRightIcon className="size-5" strokeWidth={2} />
                    }
                    variant="bordered"
                    color="primary"
                    className="w-fit self-end text-lg"
                    onPress={() => navigate(`/admin/reviews/${review.uuid}`)}
                >
                    Review
                </Button>
            </div>
            <ReviewExportModal
                review={review}
                users={users}
                isOpen={exportModalOpen}
                onOpenChange={exportModalChange}
            />
        </Card>
    );
}
