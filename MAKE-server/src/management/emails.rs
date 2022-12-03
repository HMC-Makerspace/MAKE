use lettre::smtp::authentication::Credentials;

use lettre::{SmtpClient, Transport};
use lettre_email::*;

use crate::*;

pub async fn _send_bulk_emails(recipients: Vec<String>, subject: String, body: String) {
    let lock = API_KEYS.lock().await;
    let (email, password) = lock.get_gmail_tuple();

    let mut mailer = SmtpClient::new_simple(SMTP_URL)
        .unwrap()
        .credentials(Credentials::new(email.clone(), password))
        .transport();

    for recipient in recipients {
        let content = EmailBuilder::new()
            .to(recipient.clone())
            .from(email.clone())
            .subject(subject.clone())
            .text(body.clone())
            .build()
            .unwrap();

        let result = mailer.send(content.into());

        if result.is_ok() {
            info!("Emailed user {}", recipient.clone());
        } else {
            error!("Error sending email: {:?}", result);
        }
    }
}

pub async fn send_individual_email(
    recipient: String,
    cc_recipients: Option<Vec<String>>,
    subject: String,
    body: String,
) -> std::result::Result<lettre::smtp::response::Response, lettre::smtp::error::Error> {
    let lock = API_KEYS.lock().await;
    let (email, password) = lock.get_gmail_tuple();
    drop(lock);

    
    let mut mailer = SmtpClient::new_simple(SMTP_URL)
        .unwrap()
        .credentials(Credentials::new(email.clone(), password))
        .transport();

    let mut content = EmailBuilder::new()
        .to(recipient.clone())
        .from(email)
        .subject(subject.clone())
        .html(body.clone());

    let finished_content = match cc_recipients {
        Some(cc_recipients) => {
            for cc_recipient in cc_recipients {
                content = content.cc(cc_recipient);
            }
            content.build().unwrap()
        },
        None => content.build().unwrap(),
    };

    let result = mailer.send(finished_content.into());

    if &result.is_ok() == &true {
        info!("Emailed user {}", recipient.clone());
    } else {
        error!("Error sending email: {:?}", result);
    }

    result
}
