import nodemailer from "nodemailer";
import type { Logger } from "pino";
import { JSX } from "react";
import { renderToString } from "react-dom/server";

// Create a Nodemailer transporter to send all messages
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_BOT_HOST,
    port: process.env.EMAIL_BOT_PORT,
    auth: {
        user: process.env.EMAIL_BOT_ADDRESS,
        pass: process.env.EMAIL_BOT_PASSWORD,
    },
});

/**
 * Send an email using the email bot information provided in `process.env`.
 * This function should only be called by the server, not from a route.
 * @param to The email address to send this message to
 * @param subject The subject line of the email
 * @param bodyHTML The HTML string to send as the body of the email
 * @param logger The logger object to send debug and error information to
 */
export function sendEmail(
    to: string,
    subject: string,
    bodyHTML: string,
    logger: Logger,
) {
    // Define nodemailer mail options
    const mail_options = {
        from: `${process.env.EMAIL_BOT_NAME} <${process.env.EMAIL_BOT_ADDRESS}>`,
        to: to,
        subject: subject,
        html: bodyHTML,
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
) {
    const bodyHTML = renderToString(template);
    sendEmail(to, subject, bodyHTML, logger);
}
