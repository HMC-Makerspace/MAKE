import { TConfig } from "common/config";
import { TUser } from "common/user";
import { TWorkshop } from "common/workshop";
import { timestampToZonedDateTime } from "../../website/utils";
import { DateFormatter } from "@internationalized/date";

const WorkshopConfirmationTemplate = (
    workshop: TWorkshop,
    user: TUser,
    config: TConfig,
) => {
    const onWaitList =
        workshop.capacity &&
        workshop.capacity > 0 &&
        workshop.rsvp_list.findIndex((rs) => rs.user_uuid === user.uuid) >=
            workshop.capacity;

    const zonedStartTime = timestampToZonedDateTime(
        workshop.timestamp_start,
        config.schedule.timezone,
    );
    const dateFormatter = new DateFormatter("en-US", {
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        timeZone: "America/Los_Angeles",
        timeZoneName: "short",
    });
    return (
        <>
            <h1>Workshop RSVP</h1>
            <p>
                Hello {user.name},
                <br />
                <br />
                <b>
                    {onWaitList
                        ? "You have joined the waiting list for "
                        : "You have RSVP'd for "}
                    {workshop.title}.
                </b>
                <br />
                <br />
                The workshop will start at{" "}
                {dateFormatter.format(zonedStartTime.toDate())}! Please arrive
                on time, and <b>sign in with the instructor</b>. If you're on
                the waiting list, we will allocate spots on a first-come
                first-serve basis. Please show up on time to increase your
                chances of getting in! We most likely will have some spots open
                up.
                <br />
                <br />
                If you are unable to attend, please cancel on{" "}
                <a href="https://make.hmc.edu/workshops">make.hmc.edu</a>.
            </p>

            <footer>
                <i>This email was sent automatically by MAKE</i>
            </footer>
        </>
    );
};

export default WorkshopConfirmationTemplate;
