import { timestampToZonedDateTime } from "../../website/utils";
import { TWorkshop } from "common/workshop";
import { TUser } from "common/user";
import { TConfig } from "common/config";
import { getLocalTimeZone, DateFormatter } from "@internationalized/date";

const WorkshopWaitlistTemplate = (
    workshop: TWorkshop,
    user: TUser,
    config: TConfig,
) => {
    const zonedStartTime = timestampToZonedDateTime(
        workshop.timestamp_start,
        getLocalTimeZone(),
    );
    const dateFormatter = new DateFormatter(config.schedule.locale, {
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
        timeZone: config.schedule.timezone,
    });
    const url = new URL("/workshops", process.env.SITE_URL);
    return (
        <>
            <h1>Workshop Waitlist Update</h1>
            <p>
                Hello {user.name},
                <br />
                <br />
                <b>
                    You have been moved off the waitlist and onto the RSVP list
                    for {workshop.title}.
                </b>
                <br />
                <br />
                As a reminder, the workshop will start on{" "}
                {dateFormatter.format(zonedStartTime.toDate())}. Please arrive
                on time, and <b>sign in with the instructor</b>.
                <br />
                <br />
                If you are unable to attend, please cancel on{" "}
                <a href={url.href}>{url.host}</a>.
            </p>

            <footer>
                <i>This email was sent automatically by MAKE</i>
            </footer>
        </>
    );
};

export default WorkshopWaitlistTemplate;
