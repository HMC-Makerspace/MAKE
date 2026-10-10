import AdminLayout from "../../layouts/AdminLayout";
import { Button, Card, Spinner, useDisclosure } from "@heroui/react";
import clsx from "clsx";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ReviewCard } from "../../components/kiosks/admin/reviews/ReviewCard";
import ReviewUpload from "../../components/kiosks/admin/reviews/ReviewUpload";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TUser } from "common/user";
import { TReview } from "common/review";
import { TConfig } from "common/config";
import { timestampToZonedDateTime } from "../../utils";
import { DateFormatter } from "@internationalized/date";
import { ReviewInfo } from "../../components/kiosks/admin/reviews/ReviewInfo";

export default function ReviewsKiosk() {
    const { data: users } = useQuery<TUser[]>({
        queryKey: ["user"],
        refetchOnWindowFocus: false,
    });
    const { data: reviews } = useQuery<TReview[]>({
        queryKey: ["review"],
        refetchOnWindowFocus: false,
    });
    const { data: config } = useQuery<TConfig>({
        queryKey: ["config"],
        refetchOnWindowFocus: false,
    });
    const { data: self } = useQuery<TUser>({ queryKey: ["user", "self"] });
    const params = useParams();
    const navigate = useNavigate();
    const reviewUuid = params.review_uuid;
    const isNew = reviewUuid === "new";

    // Solo review
    const review = isNew
        ? undefined
        : reviews?.find((r) => r.uuid === reviewUuid);
    const zdt = review
        ? timestampToZonedDateTime(
              review.timestamp_created,
              config?.schedule.timezone,
          )
        : undefined;
    const date_formatter = config?.schedule.locale
        ? new DateFormatter(config.schedule.locale, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
          })
        : undefined;
    //once all data has been queried, render the page inside the admin nav wrapper
    //and passes all data down to StatisticsDisplay to be displayed
    return (
        <AdminLayout pageHref="/admin/reviews">
            <div className="size-full flex flex-col gap-3">
                <div
                    className={clsx(
                        "py-3 px-5 rounded-lg",
                        "flex gap-4 items-center",
                        !isNew && "bg-default-200",
                    )}
                >
                    {reviewUuid && !isNew ? (
                        <div className="flex-1 mr-auto flex gap-3 items-center justify-start ">
                            <Button
                                variant="flat"
                                color="default"
                                onPress={() => navigate("/admin/reviews")}
                                size="lg"
                                className="min-w-48 pointer-events-auto bg-default-100"
                                startContent={
                                    <ArrowLeftIcon
                                        className="size-4 -ml-2"
                                        strokeWidth={3}
                                    />
                                }
                            >
                                Back
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 mr-auto"></div>
                    )}
                    <span className="flex justify-center flex-1 text-xl text-default-700 font-bold">
                        {isNew
                            ? "Create Review"
                            : reviewUuid
                              ? review?.title
                              : "Reviews"}
                    </span>
                    {isNew ? (
                        <div className="flex-1"></div>
                    ) : reviewUuid ? (
                        <div className="flex-1 ml-auto flex justify-end font-semibold text-lg">
                            Created:{" "}
                            {zdt &&
                                date_formatter &&
                                date_formatter.format(zdt.toDate())}
                        </div>
                    ) : (
                        <div className="flex-1 ml-auto flex gap-3 items-center justify-end">
                            <Button
                                isIconOnly
                                color="primary"
                                variant="ghost"
                                aria-label="Upload review CSV"
                                onPress={() => navigate("/admin/reviews/new")}
                            >
                                <PlusIcon className="size-7" strokeWidth={2} />
                            </Button>
                        </div>
                    )}
                </div>
                {isNew ? (
                    <ReviewUpload users={users ?? []} />
                ) : reviewUuid ? (
                    review && config && self ? (
                        <ReviewInfo
                            self={self}
                            review={review}
                            users={users ?? []}
                            config={config}
                        />
                    ) : (
                        <div>Unknown review uuid.</div>
                    )
                ) : (
                    <div
                        className={clsx(
                            "w-full min-h-fit overflow-auto",
                            "gap-4 grid grid-cols-1",
                            "md:grid-cols-2 3xl:grid-cols-3",
                        )}
                    >
                        {reviews?.map((review) => (
                            <ReviewCard
                                review={review}
                                config={config}
                                users={users || []}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
