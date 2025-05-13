import nodemailer from "nodemailer";
import type { Logger } from "pino";
import { JSX } from "react";
import { renderToString } from "react-dom/server";
import fs from "fs/promises";
import { OAuth2Client } from "google-auth-library";

const oAuth2Client = new OAuth2Client(
    process.env.EMAIL_BOT_CLIENT_ID,
    process.env.EMAIL_BOT_CLIENT_SECRET,
    `http://localhost:${process.env.VITE_PORT ?? 3000}/api/v3/oauth`,
);

/**
 * Send an email using the email bot information provided in `process.env`.
 * This function should only be called by the server, not from a route.
 * @param to The email address to send this message to
 * @param subject The subject line of the email
 * @param bodyHTML The HTML string to send as the body of the email
 * @param logger The logger object to send debug and error information to
 */
export async function sendEmail(
    to: string,
    subject: string,
    bodyHTML: string,
    logger: Logger,
    cc?: string[],
    bcc?: string[],
) {
    const tokens = await getOAuthToken(logger);

    if (!tokens) {
        logger.error("No OAuth configuration set.");
        return;
    }

    // Create a Nodemailer transporter to send the message
    // From https://nodemailer.com/smtp/oauth2/
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_BOT_HOST,
        port: process.env.EMAIL_BOT_PORT,
        auth: {
            type: "OAUTH2",
            user: process.env.EMAIL_BOT_OAUTH_ADDRESS,
            clientId: process.env.EMAIL_BOT_CLIENT_ID,
            clientSecret: process.env.EMAIL_BOT_CLIENT_SECRET,
            refreshToken: tokens.refresh_token,
            accessToken: tokens.access_token,
        },
    });

    // Define nodemailer mail options
    const mail_options = {
        from: `${process.env.EMAIL_BOT_NAME} <${process.env.EMAIL_BOT_DISPLAY_ADDRESS}>`,
        to: to,
        subject: subject,
        html: bodyHTML,
        cc: cc,
        bcc: bcc,
    };
    logger.debug({
        msg: `Sending email to ${to}`,
        mail_options: mail_options,
    });
    transporter.sendMail(mail_options, (error, info) => {
        // If the email encountered an error, log all error information
        if (error) {
            logger.error({
                msg: `Error sending email to ${to}`,
                error: error,
            });
        } else {
            // Otherwise, just log information about the successful message
            logger.info({
                msg: `Email successfully sent to ${to}`,
                email_info: info,
            });
        }
    });
}

/**
 * Send a templated email to a recipient. Email templates are functions found
 * in the `email_templates` folder that take parameters and return a JSX
 * element that is populated using those parameters.
 * @param to The email address to send this message to
 * @param subject The subject line of the email
 * @param template The JSX element returned by the template function
 * @param logger The logger object to send debug and error information to
 */
export async function sendTemplatedEmail(
    to: string,
    subject: string,
    template: JSX.Element,
    logger: Logger,
    cc?: string[],
    bcc?: string[],
) {
    const bodyHTML = renderToString(template);
    sendEmail(to, subject, bodyHTML, logger, cc, bcc);
}

// ----- Google OAuth -----

/**
 * Generate an OAuth authentication url using the client id/secret in the environment.
 * This method is called if no OAuth token exists on startup
 * @returns The authentication URL as a string.
 */
export function getOAuthURL() {
    return oAuth2Client.generateAuthUrl({
        access_type: "offline", // offline access gives a refresh token, which means fewer logins
        scope: "https://mail.google.com",
    });
}

/**
 * Get the active OAuth access and refresh tokens from file.
 * @param logger The Pino logger to output success/warning messages to
 * @returns The token file containing the access and refresh tokens as strings
 */
export async function getOAuthToken(logger: Logger) {
    return fs
        .readFile("oauthtoken.json")
        .then((data) => {
            logger.debug("Found OAuth token file.");
            try {
                const tokenFile: {
                    access_token: string;
                    refresh_token: string;
                    scope: string;
                    token_type: string;
                    expiry_date: number;
                } = JSON.parse(data.toString());
                return tokenFile;
            } catch (e) {
                logger.error({
                    msg: "Found OAuth token file but failed to parse",
                    error: e,
                });
                return undefined;
            }
        })
        .catch((err) => {
            logger.fatal({
                msg: "Error reading OAuth token file.",
                error: err,
            });
            return undefined;
        });
}

/**
 * Given an OAuth authentication code, save the associated token to file.
 * @param code The OAuth code sent as a query parameter from the OAuth URL
 * @param logger The Pino logger to output success/warning messages to
 * @returns A boolean indicating if the token was successfully saved or not.
 */
export async function saveOAuthToken(code: string, logger: Logger) {
    return oAuth2Client
        .getToken(code)
        .then((tokenResponse) =>
            fs
                .writeFile(
                    "oauthtoken.json",
                    JSON.stringify(tokenResponse.tokens),
                )
                .then(() => {
                    logger.debug("Wrote OAuth token to file.");
                    return true;
                })
                .catch((writeErr) => {
                    logger.fatal({
                        msg: "Error saving OAuth token file.",
                        error: writeErr,
                    });
                    return false;
                }),
        )
        .catch((tokenErr) => {
            logger.fatal({
                msg: "OAuth code did not produce a valid token.",
                error: tokenErr,
            });
            return false;
        });
}
