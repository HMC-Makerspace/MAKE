use lettre::smtp::authentication::Credentials;

use lettre::{SmtpClient, Transport};
use lettre_email::*;

use crate::*;

pub async fn send_bulk_emails(recipients: Vec<String>, subject: String, body: String) {
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

pub async fn send_individual_email(recipient: String, subject: String, body: String) {
    let lock = API_KEYS.lock().await;
    let (email, password) = lock.get_gmail_tuple();
    drop(lock);

    let mut mailer = SmtpClient::new_simple(SMTP_URL)
        .unwrap()
        .credentials(Credentials::new(email.clone(), password))
        .transport();

    let content = EmailBuilder::new()
        .to(recipient.clone())
        .from(email)
        .subject(subject.clone())
        .html(body.clone())
        .build()
        .unwrap();

    let result = mailer.send(content.into());

    if result.is_ok() {
        info!("Emailed user {}", recipient.clone());
    } else {
        error!("Error sending email: {:?}", result);
    }
}