/*

INITIAL SETUP STEPS:
- Setup .env file ✔
- Create initial admin ✔
- Create default config ✔
- Create default schedule ✔
- Initialize SSL
- nodemailer config
    - Assign an email address to use for sending all automated emails from the server
        - Optionally, create an alias (Google Group) under a parent account which can be used for login
    - Create a Google Cloud project
    - Set it to internal view
    - Create a client
        - Application type: Web Application
        - Authorized JavaScript Origins: http://localhost:3000 (or preferred port in .env)
        - Authorized redirect URIs: http://localhost:3000/api/v3/oauth
        - Save client id/secret pair
    - Grant https://mail.google.com scopes
    - Generate a default consent screen
    - run the server in development mode with --setup-email to get an OAuthURL in the console
    - Once the OAuth is approved

*/

import {
    initializeAdmin,
    initializeAdminRole,
} from "controllers/user.controller";
import fs from "fs/promises";
import prompt from "prompt";
import colors from "@colors/colors/safe";
import connectDB from "core/db";
import dotenv from "dotenv";
import {
    createConfig,
    getConfig,
    setConfig,
} from "controllers/config.controller";
import {
    TCheckoutConfig,
    TConfig,
    TFileConfig,
    TGeneralConfig,
    TScheduleConfig,
    TWorkshopConfig,
} from "common/config";
import {
    createSchedule,
    setActiveSchedule,
    setStagingSchedule,
} from "controllers/schedule.controller";

const TIME_PATTERN = /^(\d+|\d+ minutes?|\d+ hours?|\d+ days?|\d weeks?)$/g;

function simplifyNumericString(str: string): string {
    const parts = str.split(" ");
    if (parts.length === 1) {
        // String is already numeric
        return parts[0];
    }
    const factor = parseInt(parts[0]);
    const suffix = parts[1];
    if (suffix.startsWith("minute")) {
        return (factor * 60).toString(); // 60 seconds in a minute
    } else if (suffix.startsWith("hour")) {
        return (factor * 3600).toString(); // 3600 seconds in a hour
    } else if (suffix.startsWith("day")) {
        return (factor * 86400).toString(); // 86400 seconds in a day
    } else if (suffix.startsWith("week")) {
        return (factor * 604800).toString(); // 604800 seconds in a week
    } else if (suffix.startsWith("MB")) {
        return (factor * 1000 * 1000).toString(); // MB to bytes
    } else if (suffix.startsWith("GB")) {
        return (factor * 1000 * 1000 * 1000).toString(); // GB to bytes
    } else {
        return factor.toString(); // unknown suffix, default to factor
    }
}

// Prompt setup
prompt.start();
prompt.message = "";
prompt.delimiter = " >";
console.log(colors.magenta("\nWelcome to the MAKE project setup!"));

// --- 1. .env Configuration ---
console.log("\n1. Would you like to copy the default environment setup?");
console.log(
    colors.blue(
        colors.italic(
            "You can always modify the .env file after setup, " +
                "but it is recommended to use the default values.",
        ),
    ),
);
const { copyEnv } = await prompt.get([
    {
        name: "copyEnv",
        description: "Copy default .env [Y/n]",
        pattern: /^(y|n)$/gi,
        message: "Please enter y (for yes) or n (for no).",
        before: (val) => (val ? val.toLowerCase() : "y"),
    },
]);

if (copyEnv === "y") {
    if (await fs.exists(".env")) {
        console.log(
            colors.yellow(
                "WARN: .env file already exists, will not overwrite.",
            ),
        );
    } else {
        try {
            await fs.copyFile("template.env", ".env");
            // Reload environment variables
            dotenv.config({ path: ".env" });
            console.log(
                colors.green("Successfully copied default environment."),
            );
        } catch (e) {
            console.log(
                colors.red(`ERROR: Could not copy template.env to .env: ${e}`),
            );
        }
    }
}

try {
    connectDB();
    console.log(colors.green("Database is properly configured."));
} catch {
    console.log(
        colors.red(
            "ERROR: MongoDB database is not properly set up.\nPlease " +
                "ensure the MONGO_URI environment variable is configured properly",
        ),
    );
}

// --- 2. Initialize default administrator account ---
console.log("\n2. Would you like to create a default administrator user?");
console.log(
    colors.blue(
        colors.italic(
            "This is highly recommended for most use cases, " +
                "and is required for local development.",
        ),
    ),
);

const { createAdmin } = await prompt.get([
    {
        name: "createAdmin",
        description: "Create default admin user [Y/n]",
        pattern: /^(y|n)$/gi,
        message: "Please enter y (for yes) or n (for no).",
        before: (val) => (val ? val.toLowerCase() : "y"),
    },
]);

if (createAdmin === "y") {
    const initial_admin_role = await initializeAdminRole();
    if (!initial_admin_role) {
        console.log(
            colors.yellow(
                "WARN: An admin role already exists, aborting default admin creation.",
            ),
        );
    } else {
        console.log(
            colors.green("Successfully created default admin role"),
            colors.gray(`{${initial_admin_role}}`),
        );
        const initial_admin = await initializeAdmin(initial_admin_role.uuid);
        if (!initial_admin) {
            console.log(colors.red("ERROR: Could not create default admin."));
        } else {
            console.log(
                colors.green("Successfully created default admin user"),
                colors.gray(`{${initial_admin.uuid}}`),
            );
        }
    }
}

// --- 3. Initialize default site config ---
console.log("\n3. Would you like to use the interactive site config setup?");
console.log(
    colors.blue(
        colors.italic(
            "If not, a default config object will be created. " +
                "If a config object already exists, no changes will be made.\n" +
                "You can modify the config later using the administrative console.",
        ),
    ),
);

const { interactiveConfig } = await prompt.get([
    {
        name: "interactiveConfig",
        description: "Run interactive config [Y/n]",
        pattern: /^(y|n)$/gi,
        message: "Please enter y (for yes) or n (for no).",
        before: (val) => (val ? val.toLowerCase() : "y"),
    },
]);

const existingConfig = await getConfig();

if (existingConfig) {
    // Config already exists, skip
    console.log(colors.yellow("WARN: Config already exists, continuing"));
} else if (interactiveConfig === "n") {
    // Create default config
    await createConfig({
        timestamp: Date.now() / 1000,
        general: {
            tagline: "Welcome to MAKE!",
            branding_url: "",
            discord_url: "",
            instagram_url: "",
            tiktok_url: "",
            extra_urls: [],
        },
        checkout: {
            notification_interval_sec: 0, // No checkout reminder emails
        },
        file: {
            max_upload_capacity: 2000000000, // 2 GB per file
            max_upload_count: 10,
        },
        schedule: {
            days_open: [0, 1, 2, 3, 4, 5, 6], // Open every day of the week
            first_display_day: 0, // Sunday
            worker_roles: [],
            increment_sec: 3600, // 1 hour shift delineation
            first_names_only: true, // Only show worker first names on public schedule
            timezone: "America/Los_Angeles",
            locale: "en-US",
        },
        workshop: {
            reminder_times: [], // No workshop reminder emails
        },
    });
    console.log(colors.green("Created default config."));
} else {
    // Interactive config setup
    console.log(colors.cyan("\n--- GENERAL ---"));
    const {
        brandingURL,
        discordURL,
        instagramURL,
        tiktokURL,
        extraURLs,
        tagline,
    } = await prompt.get([
        {
            description:
                colors.cyan(
                    "Where should the branding image link to? " +
                        "This is likely your college's website.\n" +
                        "Please include https:// at the start." +
                        " or press enter to skip.",
                ) + "\nGeneral: Branding URL",
            name: "brandingURL",
        },
        {
            description:
                colors.cyan(
                    "Do you have a Discord server that you'd " +
                        "like to link on the front page?\n" +
                        "Please include https:// at the start." +
                        " or press enter to skip.",
                ) + "\nGeneral: Discord URL",
            name: "discordURL",
        },
        {
            description:
                colors.cyan(
                    "Do you have a Instagram channel that you'd " +
                        "like to link on the front page?\n" +
                        "Please include https:// at the start." +
                        " or press enter to skip.",
                ) + "\nGeneral: Instagram URL",
            name: "instagramURL",
        },
        {
            description:
                colors.cyan(
                    "Do you have an TikTok channel that you'd " +
                        "like to link on the front page?\n" +
                        "Please include https:// at the start." +
                        " or press enter to skip.",
                ) + "\nGeneral: TikTok URL",
            name: "tiktokURL",
        },
        {
            description:
                colors.cyan(
                    "Do you have any other URLs that you'd " +
                        "like to link on the front page?\n" +
                        "Please include https:// at the start " +
                        "of each, separated by commas," +
                        " or press enter to skip.",
                ) + "\nGeneral: Extra URLs",
            name: "extraURLs",
        },
        {
            description:
                colors.cyan(
                    "What should the tagline on the front page say? This" +
                        " text is between the MAKE title and the URLs. " +
                        "Press enter to have no tagline.",
                ) + "\nGeneral: Tagline",
            name: "tagline",
        },
    ]);

    const extraURLsList = extraURLs.toString().replace(/\s/g, "").split(",");

    const generalConfig: TGeneralConfig = {
        branding_url: brandingURL.toString(),
        discord_url: discordURL.toString(),
        instagram_url: instagramURL.toString(),
        tiktok_url: tiktokURL.toString(),
        extra_urls: extraURLsList.filter((u) => u), // filter out empty urls
        tagline: tagline.toString(),
    };

    console.log(colors.cyan("--- CHECKOUTS ---"));
    console.log(
        colors.cyan(
            "On what interval should users be sent reminder emails " +
                "about late item checkouts? Options are: " +
                "\n  - 0 (no reminder emails sent, default)" +
                "\n  - 1 hour (email sent every hour after checkout ends)" +
                "\n  - x hours (where x is an integer)" +
                "\n  - 1 day (email sent daily when checkout ended)" +
                "\n  - x days (where x is an integer)" +
                "\n  - 1 week (email sent on same day of checkout)" +
                "\n  - x weeks (where x is an integer)" +
                "\n  - any valid integer in seconds",
        ),
    );
    const { notificationInterval } = await prompt.get({
        name: "notificationInterval",
        description: "Checkout: Notification Interval",
        message: "Invalid option.",
        pattern: TIME_PATTERN,
        before: simplifyNumericString,
    });

    const checkoutConfig: TCheckoutConfig = {
        notification_interval_sec: parseInt(notificationInterval.toString()),
    };

    console.log(colors.cyan("--- FILES ---"));
    console.log(
        colors.cyan(
            "What is the maximum upload usage available to " +
                "non-administrative users? Options are: " +
                "\n  - 0 (no uploads allowed)" +
                "\n  - x MB (where x is an integer)" +
                "\n  - x GB (where x is an integer)" +
                "\n  - any integer in bytes",
        ),
    );
    const { maxUploadCapacity } = await prompt.get({
        name: "maxUploadCapacity",
        description: "Files: User Upload Capacity (default 1 GB)",
        message: "Invalid option.",
        pattern: /^(\d+|\d+ MB|\d+ GB)$/,
        before: (s) => (s ? simplifyNumericString(s) : "2000000000"), // 2 GB
    });
    console.log(
        colors.cyan(
            "What is the maximum number of files each" +
                " non-administrative user can upload?",
        ),
    );
    const { maxUploadCount } = await prompt.get({
        name: "maxUploadCount",
        description: "Files: Max User Upload Count (default 10)",
        message: "Please enter an integer.",
        pattern: /^\d+$/,
        before: (s) => (s ? s : "10"),
    });

    console.log(
        colors.cyan(
            "How long should user-uploaded files remain on the server? Options are:" +
                "\n  - x hours (where x is an integer)" +
                "\n  - x days (where x is an integer)" +
                "\n  - x weeks (where x is an integer)" +
                "\n  - any valid integer in seconds",
        ),
    );
    const { uploadDuration } = await prompt.get({
        name: "uploadDuration",
        description: "Files: User Upload Duration (default 1 week)",
        message: "Invalid option.",
        pattern: TIME_PATTERN,
        before: (s) => (s ? simplifyNumericString(s) : "604800"), // 1 week in seconds
    });

    const fileConfig: TFileConfig = {
        max_upload_capacity: parseInt(maxUploadCapacity.toString()),
        max_upload_count: parseInt(maxUploadCount.toString()),
        upload_duration: parseInt(uploadDuration.toString()),
    };

    console.log(colors.cyan("--- SCHEDULE ---"));
    console.log(
        colors.cyan(
            "What days of the week should be visible on the schedule?" +
                "Enter a list of days as integers\nseparated by commas," +
                "where Sunday is 0, Monday is 1, etc.\nLeave blank if all" +
                "days should be visible.",
        ),
    );

    const { daysOpenPrompt } = await prompt.get({
        name: "daysOpenPrompt",
        description: "Schedule: Days Open (default all days)",
        message: "Please enter a list of days as integers separated by commas.",
        pattern: /^\d(,\d)*$/,
        before: (s) => (s ? s : "0,1,2,3,4,5,6"), // default open every day
    });

    let daysOpen = daysOpenPrompt.toString().split(",").map(parseInt);

    console.log(
        colors.cyan(
            "What day should be displayed first on the schedule?" +
                "\nAs before, Sunday is 0, Monday is 1, etc.",
        ),
    );

    const { firstDisplayDay } = await prompt.get({
        name: "firstDisplayDay",
        description: "Schedule: First Display Day (default Sunday - 0)",
        message: "Please enter a day as an integer.",
        pattern: /^\d$/,
        before: (s) => (s ? s : "0"), // default Sunday (0)
    });

    console.log(
        colors.cyan(
            "How long should each worker shift be? This will be the delineation\n" +
                "of blocks on the schedule. Note that workers cannot drop half of a shift.\n" +
                "Options are:" +
                "\n  - x minutes (where x is an integer)" +
                "\n  - x hours (where x is an integer)" +
                "\n  - any valid integer in seconds",
        ),
    );

    const { incrementSec } = await prompt.get({
        name: "incrementSec",
        description: "Schedule: Shift Duration (default 1 hour)",
        message: "Please enter a valid time.",
        pattern: TIME_PATTERN,
        before: (s) => (s ? simplifyNumericString(s) : "3600"), // 1 hour in seconds
    });

    console.log(
        colors.cyan("Should the public schedule show worker first names only?"),
    );
    const { firstNamesOnly } = await prompt.get({
        name: "firstNamesOnly",
        description: "Schedule: First Names Only [Y/n]",
        pattern: /^(y|n)$/gi,
        message: "Please enter y (for yes) or n (for no).",
        before: (val) => (val ? val.toLowerCase() : "y"),
    });

    console.log(
        colors.cyan(
            "What timezone should be used for all server times?\nPlease enter" +
                " a valid IANA time zone string like `America/Los_Angeles`\n" +
                "IANA time zones can be found here: " +
                "https://data.iana.org/time-zones/tzdb-2021a/zone1970.tab",
        ),
    );

    const { timezone } = await prompt.get({
        name: "timezone",
        description: "Schedule: Timezone (default America/Los_Angeles)",
        conform: (tz) => !tz || Intl.supportedValuesOf("timeZone").includes(tz),
        before: (tz) => (tz ? tz : "America/Los_Angeles"), // default timezone
        message: "Please enter a valid IANA timezone",
    });

    console.log(
        colors.cyan(
            "What language locale should the site use? This is used to " +
                "properly format dates.\nExample: `en-US`. See here for valid " +
                "options: https://randombits.dev/articles/number-localization/locale-list",
        ),
    );

    const { locale } = await prompt.get({
        name: "locale",
        description: "Schedule: Locale (default en-US)",
        conform: (loc) => {
            if (!loc) return true;
            try {
                Intl.getCanonicalLocales(loc);
                return true;
            } catch (err) {
                return false;
            }
        },
        before: (loc) => (loc ? Intl.getCanonicalLocales(loc)[0] : "en-US"), // default locale
        message: "Please enter a valid IANA locale",
    });

    const scheduleConfig: TScheduleConfig = {
        days_open: daysOpen,
        first_display_day: parseInt(firstDisplayDay.toString()),
        worker_roles: [], // Set in dashboard
        increment_sec: parseInt(incrementSec.toString()),
        first_names_only: firstNamesOnly == "y",
        timezone: timezone.toString(),
        locale: locale.toString(),
    };

    console.log(colors.cyan("--- WORKSHOPS ---"));
    console.log(
        colors.cyan(
            "When should users be sent email reminders about workshops?\nEach " +
                "entry should be a number in seconds before the workshop occurs," +
                "\nseparated by commas. Default none.",
        ),
    );

    const { reminderTimesPrompt } = await prompt.get({
        name: "reminderTimesPrompt",
        pattern: /^\d+(,\d+)*$/,
        description: "Workshops: Reminder Email Times",
        message: "Please enter integers separated by commas.",
    });

    const reminderTimes = reminderTimesPrompt
        .toString()
        .split(",")
        .map(parseInt);

    const workshopConfig: TWorkshopConfig = {
        reminder_times: reminderTimes,
    };

    const config: TConfig = {
        timestamp: Date.now() / 1000,
        general: generalConfig,
        checkout: checkoutConfig,
        file: fileConfig,
        schedule: scheduleConfig,
        workshop: workshopConfig,
    };

    await createConfig(config);

    console.log(colors.green("Configuration complete."));
}

// --- 3. Initialize blank schedule ---
console.log("\n3. Would you like to create a new blank schedule?");
console.log(
    colors.blue(
        colors.italic(
            "If you do not already have a schedule to import, this is " +
                "highly recommended.",
        ),
    ),
);

const { createSchedule: createBlankSchedule } = await prompt.get([
    {
        name: "createSchedule",
        description: "Create blank schedule [Y/n]",
        pattern: /^(y|n)$/gi,
        message: "Please enter y (for yes) or n (for no).",
        before: (val) => (val ? val.toLowerCase() : "y"),
    },
]);

if (createBlankSchedule === "y") {
    const blankSchedule = {
        uuid: crypto.randomUUID(),
        name: "Blank Schedule",
        timestamp_start: Date.now() / 1000,
        timestamp_end: Date.now() / 1000 + 24 * 3600,
        shifts: [],
        alerts: [],
        daily_open_time: 12 * 3600, // open at noon
        daily_close_time: 22 * 3600, // close at 10pm
        active: false,
        staged: false,
    };
    await createSchedule(blankSchedule);
    // Stage and activate schedule
    await setStagingSchedule(blankSchedule.uuid);
    await setActiveSchedule(blankSchedule.uuid);
    console.log(colors.green("Created blank schedule."));
}

console.log(colors.magenta("\nProject setup complete!"));
prompt.stop();
process.exit(0);