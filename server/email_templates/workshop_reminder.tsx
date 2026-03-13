import type { UnixTimestamp } from "common/global";
import { relativeTimestampToString } from "../../website/utils";

// TODO: update this with new workshop information, like WorkshopConfirmationTemplate
const WorkshopReminderTemplate = (
    workshop: string,
    time_until: UnixTimestamp,
) => {
    const url = new URL("/workshops", process.env.SITE_URL);
    return (
        <>
            <h1>Workshop Reminder</h1>
            <p>
                Hello,
                <br />
                <br />
                This is a reminder the following workshop
                <br />
                <br />
                {workshop}
                <br />
                <br />
                starts in{" "}
                <b>
                    {relativeTimestampToString(time_until - (time_until % 60))}
                </b>
                . If you are unable to attend, please cancel on{" "}
                <a href={url.href}>{url.host}</a>
                .
                <br />
                <br />
                When you arrive, please <b>sign in with the instructor</b>.
            </p>

            <footer>
                <i>This email was sent automatically by MAKE</i>
            </footer>
        </>
    );
};

export default WorkshopReminderTemplate;
