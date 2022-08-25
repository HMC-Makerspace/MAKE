use std::cmp::min;
use std::fs::OpenOptions;
use std::io::Read;
use std::io::Write;
use std::process::exit;
use std::thread;
use std::time::SystemTime;

use actix_cors::*;
use actix_web::rt::spawn;
use actix_web::rt::System;
use actix_web::*;
use actix_web_static_files::ResourceFiles;
use actix_web_middleware_redirect_scheme::RedirectSchemeBuilder;

use chrono::Timelike;
use chrono::Utc;
use lazy_static::__Deref;

use log::*;

use openssl::ssl::SslAcceptor;
use openssl::ssl::SslFiletype;
use openssl::ssl::SslMethod;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time;

mod checkout;
mod emails;
mod inventory;
mod laser_cutter;
mod permissions;
mod printers;
mod quizzes;
mod routes;
mod student_storage;
mod users;
mod usage;

use crate::checkout::*;
use crate::emails::*;
use crate::inventory::*;
use crate::laser_cutter::*;
use crate::permissions::*;
use crate::printers::*;
use crate::quizzes::*;
use crate::routes::*;
use crate::student_storage::*;
use crate::users::*;
use crate::usage::*;

use lazy_static::lazy_static;
use std::sync::Arc;
use tokio::sync::Mutex;

// Debug vs release address
#[cfg(debug_assertions)]
const ADDRESS: &str = "127.0.0.1:8080";
#[cfg(not(debug_assertions))]
const ADDRESS: &str = "0.0.0.0:8080";

#[cfg(debug_assertions)]
const URL: &str = "127.0.0.1:8080";
#[cfg(not(debug_assertions))]
const URL: &str = "https://make.hmc.edu";

const SMTP_URL: &str = "smtp.gmail.com";
const MAKERSPACE_MANAGER_EMAIL: &str = "kneal@g.hmc.edu";
const UPDATE_INTERVAL: u64 = 60;
const TIME_SEND_EMAIL_HOUR: u32 = 6; // 6am UTC, eg 11pm PDT
                                     // Initial checkout period of 1 month
const INITIAL_CHECKOUT_PERIOD: u64 = 30 * 24 * 60 * 60;
// Renew period of 2 weeks
const RENEW_LENGTH: u64 = 2 * 7 * 24 * 60 * 60;
// Number of renewals allowed
const RENEWALS_ALLOWED: u64 = 2;

const LOGGER_STR: &str = "\nMAKE Log @ %t\nIP: %a (%{r}a)\nRequest: \"%r\"\nAgent: \"%{Referer}i\" \"%{User-Agent}i\"\nResponse: STATUS %s for %b bytes in %D ms";

const VERSION_STRING: &str = env!("CARGO_PKG_VERSION");
const STARTUP_TITLE: &str = "
██████   ██████   █████████   █████   ████ ██████████
░░██████ ██████   ███░░░░░███ ░░███   ███░ ░░███░░░░░█
 ░███░█████░███  ░███    ░███  ░███  ███    ░███  █ ░ 
 ░███░░███ ░███  ░███████████  ░███████     ░██████   
 ░███ ░░░  ░███  ░███░░░░░███  ░███░░███    ░███░░█   
 ░███      ░███  ░███    ░███  ░███ ░░███   ░███ ░   █
 █████     █████ █████   █████ █████ ░░████ ██████████
░░░░░     ░░░░░ ░░░░░   ░░░░░ ░░░░░   ░░░░ ░░░░░░░░░░ ";

include!(concat!(env!("OUT_DIR"), "/generated.rs"));

#[derive(Default, Deserialize, Serialize)]
pub struct Data {
    pub inventory: Inventory,
    pub users: Users,
    pub printers: Printers,
    pub quizzes: Vec<Quiz>,
    pub checkout_log: CheckoutLog,
    pub student_storage: StudentStorage,
    pub button_log: ButtonRecordLog,
}

#[derive(Default, Deserialize, Serialize)]
pub struct ApiKeysToml {
    pub api_keys: ApiKeys,
}

#[derive(Default, Deserialize, Serialize)]
pub struct ApiKeys {
    admin: String,
    checkout: String,
    student_storage: String,
    printers: String,
    gmail_email: String,
    gmail_password: String,
}

impl ApiKeys {
    // Print the keys to the console, only showing the first few characters of each key
    pub fn peek_print(&self) {
        info!("Admin key:             {}...", &self.admin[..5]);
        info!("Checkout key:          {}...", &self.checkout[..5]);
        info!("Student storage key:   {}...", &self.student_storage[..5]);
        info!("Printers key:          {}...", &self.printers[..5]);
        info!("Gmail email:           {}...", &self.gmail_email[..5]);
        info!("Gmail password:        {}...", &self.gmail_password[..5]);
    }

    pub fn validate_admin(&self, key: &str) -> bool {
        self.admin == key
    }

    pub fn validate_checkout(&self, key: &str) -> bool {
        self.checkout == key || self.admin == key
    }

    pub fn validate_student_storage(&self, key: &str) -> bool {
        self.student_storage == key || self.admin == key
    }

    pub fn validate_printers(&self, key: &str) -> bool {
        self.printers == key || self.admin == key
    }

    pub fn get_gmail_tuple(&self) -> (String, String) {
        (self.gmail_email.clone(), self.gmail_password.clone())
    }
}

#[derive(Default, Deserialize, Serialize)]
pub struct EmailTemplates {
    pub print_queue: String,
    pub expired_student_storage: String,
    pub expired_checkout: String,
    pub restock_notice: String,
}

impl EmailTemplates {
    pub fn load_templates(&mut self) {
        self.print_queue = self.html_file_to_string("email_templates/print_queue.html");
        self.expired_student_storage =
            self.html_file_to_string("email_templates/expired_student_storage.html");
        self.expired_checkout = self.html_file_to_string("email_templates/expired_checkout.html");
        self.restock_notice = self.html_file_to_string("email_templates/restock_notice.html");
    }

    pub fn html_file_to_string(&self, filename: &str) -> String {
        let mut file = OpenOptions::new().read(true).open(filename).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        contents
    }

    pub fn get_print_queue(&self, acceptance_uuid: &str) -> String {
        let html = self.print_queue.clone();
        html.replace("{acceptance_uuid}", acceptance_uuid)
    }

    pub fn get_expired_student_storage(&self, slot_id: &str) -> String {
        let html = self.expired_student_storage.clone();
        html.replace("{slot_id}", slot_id)
    }

    pub fn get_expired_checkout(&self, tool_list: &str) -> String {
        let html = self.expired_checkout.clone();
        html.replace("{tool_list}", tool_list)
    }

    pub fn get_restock_notice(&self, list: &str) -> String {
        let html = self.restock_notice.clone();
        html.replace("{list}", list)
    }
}

lazy_static! {
    pub static ref MEMORY_DATABASE: Arc<Mutex<Data>> = Arc::new(Mutex::new(Data::default()));
    pub static ref API_KEYS: Arc<Mutex<ApiKeys>> = Arc::new(Mutex::new(ApiKeys::default()));
    pub static ref EMAIL_TEMPLATES: Arc<Mutex<EmailTemplates>> =
        Arc::new(Mutex::new(EmailTemplates::default()));
}

const DB_NAME: &str = "db.json";

fn from_slice_lenient<'a, T: ::serde::Deserialize<'a>>(
    v: &'a [u8],
) -> Result<T, serde_json::Error> {
    let mut cur = std::io::Cursor::new(v);
    let mut de = serde_json::Deserializer::new(serde_json::de::IoRead::new(&mut cur));
    ::serde::Deserialize::deserialize(&mut de)
    // note the lack of: de.end()
}

pub fn load_database() -> Result<Data, Error> {
    let file = OpenOptions::new().read(true).open(DB_NAME);

    if file.is_err() {
        Ok(Data::default())
    } else {
        let mut file = file.unwrap();

        let mut data = String::new();
        file.read_to_string(&mut data)?;
        let data: Data = from_slice_lenient(data.as_bytes()).unwrap();
        Ok(data)
    }
}

pub async fn save_database() -> Result<(), Error> {
    info!("Saving database...");
    let mut file = OpenOptions::new().write(true).create(true).open(DB_NAME)?;
    let data = MEMORY_DATABASE.lock().await;

    // Get data struct from mutex guard
    let data = data.deref();

    let data = serde_json::to_string_pretty(&data)?;
    file.write_all(data.as_bytes())?;
    info!("Database saved.");
    Ok(())
}

pub async fn load_api_keys() -> Result<(), Error> {
    info!("Loading API keys...");

    let mut file = OpenOptions::new()
        .read(true)
        .open("api_keys.toml")
        .expect("Failed to open api_keys.toml");
    let mut data = String::new();
    file.read_to_string(&mut data)?;

    let data: ApiKeysToml = toml::from_str(&data).expect("Failed to parse api_keys.toml");

    let api_keys = data.api_keys;

    api_keys.peek_print();

    let mut lock = API_KEYS.lock().await;

    *lock = api_keys;

    info!("API keys loaded!");

    Ok(())
}
/// Main function to run both actix_web server and API update loop
/// API update loops lives inside a tokio thread while the actix_web
/// server is run in the main thread and blocks until done.
async fn async_main() -> std::io::Result<()> {
    // Print startup text
    info!("Starting up...");
    println!("██████████████████████████████████████████████████████████████");
    println!("{}", STARTUP_TITLE);
    println!("Version {}", VERSION_STRING);
    println!("██████████████████████████████████████████████████████████████");

    // Load api keys
    load_api_keys().await.expect("Could not load API keys!");

    // Load all databases
    let data = load_database().unwrap();
    let mut lock = MEMORY_DATABASE.lock().await;
    *lock = data;
    drop(lock);

    info!("Database(s) loaded!");

    info!("Loading 3D printers...");
    MEMORY_DATABASE.lock().await.printers.load_printers();
    info!("3D printers loaded!");

    info!("Loading email templates...");
    EMAIL_TEMPLATES.lock().await.load_templates();
    info!("Email templates loaded!");

    info!("Checking student storage validity...");
    let needs_update = MEMORY_DATABASE.lock().await.student_storage.needs_update();

    if needs_update {
        info!("Student storage validity check failed. Updating...");
        MEMORY_DATABASE.lock().await.student_storage = StudentStorage::default();
        info!("Student storage updated!");
    } else {
        info!("Student storage validity check passed.");
    }

    spawn(async move {
        let mut interval = time::interval(Duration::from_secs(UPDATE_INTERVAL));
        loop {
            interval.tick().await;
            update_loop().await;
            save_database().await;
        }
    });

    if cfg!(debug_assertions) {
        // Create builder without ssl
        return HttpServer::new(move || {
            let cors = Cors::default()
                .allow_any_origin()
                .allow_any_header()
                .allow_any_method()
                .send_wildcard()
                .max_age(3600);

            App::new()
                .wrap(actix_web::middleware::Logger::new(LOGGER_STR))
                .wrap(actix_web::middleware::Compress::default())
                .wrap(cors)
                .service(get_inventory)
                .service(get_quizzes)
                .service(get_users)
                .service(checkout_items)
                .service(checkin_items)
                .service(get_checkout_log)
                .service(get_user_info)
                .service(set_auth_level)
                .service(set_quiz_passed)
                .service(update_printer_status)
                .service(get_student_storage_for_user)
                .service(checkout_student_storage)
                .service(renew_student_storage_slot)
                .service(release_student_storage_slot)
                .service(get_student_storage_for_all)
                .service(get_printers)
                .service(join_printer_queue)
                .service(leave_printer_queue)
                .service(get_printers_api_key)
                .service(add_restock_notice)
                .service(get_swipe_access)
                .service(add_button_log)
                .service(help)
                .service(openapi)
                .service(ResourceFiles::new("/", generate()))
        })
        .bind(ADDRESS)?
        .run()
        .await;
    } else {
        let mut builder = SslAcceptor::mozilla_intermediate(SslMethod::tls()).unwrap();
        builder
            .set_private_key_file(
                "/etc/letsencrypt/live/make.hmc.edu/privkey.pem",
                SslFiletype::PEM,
            )
            .unwrap();
        builder
            .set_certificate_chain_file("/etc/letsencrypt/live/make.hmc.edu/fullchain.pem")
            .unwrap();

        // Create builder without ssl
        return HttpServer::new(move || {
            let cors = Cors::default()
                .allowed_origin("https://make.hmc.edu")
                .allowed_origin("http://make.hmc.edu")
                .allow_any_header()
                .allow_any_method()
                .send_wildcard()
                .max_age(3600);

            App::new()
                .wrap(RedirectSchemeBuilder::new().replacements(&[(":8080", ":8080")]).build())
                .wrap(actix_web::middleware::Logger::new(LOGGER_STR))
                .wrap(actix_web::middleware::Compress::default())
                .wrap(cors)
                .service(get_inventory)
                .service(get_quizzes)
                .service(get_users)
                .service(checkout_items)
                .service(checkin_items)
                .service(get_checkout_log)
                .service(get_user_info)
                .service(set_auth_level)
                .service(set_quiz_passed)
                .service(update_printer_status)
                .service(get_student_storage_for_user)
                .service(checkout_student_storage)
                .service(renew_student_storage_slot)
                .service(release_student_storage_slot)
                .service(get_student_storage_for_all)
                .service(get_printers)
                .service(join_printer_queue)
                .service(leave_printer_queue)
                .service(get_printers_api_key)
                .service(add_restock_notice)
                .service(get_swipe_access)
                .service(add_button_log)
                .service(help)
                .service(openapi)
                .service(ResourceFiles::new("/", generate()))
        })
        .bind_openssl(ADDRESS, builder)?
        .run()
        .await;

    }
}
fn main() {
    std::env::set_var("RUST_LOG", "info, actix_web=trace");
    env_logger::init();

    ctrlc::set_handler(move || {
        info!("Exiting...");
        thread::sleep(Duration::from_secs(2));
        exit(0);
    })
    .expect("Error setting Ctrl-C handler");

    let _ = actix_web::rt::System::with_tokio_rt(|| {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .worker_threads(1)
            .thread_name("main-tokio")
            .build()
            .unwrap()
    })
    .block_on(async_main());
}

async fn update_loop() {
    // Update inventory
    let mut inventory = MEMORY_DATABASE.lock().await.inventory.clone();

    let update_result = inventory.update().await;

    if update_result.is_err() {
        info!(
            "Failed to update inventory: {}",
            update_result.err().unwrap()
        );
    } else {
        let current_checkouts = MEMORY_DATABASE
            .lock()
            .await
            .checkout_log
            .get_current_checkouts();

        inventory.update_from_checkouts(&current_checkouts);

        // Get current time of day
        let now = Utc::now();
        let now_time = now.time();

        if now_time.hour() < TIME_SEND_EMAIL_HOUR {
            inventory.sent_restock_notice = false;
        } else if inventory.sent_restock_notice == false && now_time.hour() >= TIME_SEND_EMAIL_HOUR
        {
            inventory.send_restock_notice().await;
        }

        MEMORY_DATABASE.lock().await.inventory = inventory;
        info!("Inventory updated!");
    }

    // Update quizzes
    let mut quizzes = get_all_quizzes();

    info!("Updating quizzes...");

    for quiz in quizzes.iter_mut() {
        let update_result = quiz.update().await;

        if update_result.is_err() {
            warn!("Failed to update quiz: {}", update_result.err().unwrap());
        }
    }

    info!("Quizzes updated!");

    MEMORY_DATABASE.lock().await.quizzes = quizzes.clone();

    // Update users
    let users = create_users_from_quizzes(&quizzes);

    info!("Updated {} users!", users.len());

    MEMORY_DATABASE.lock().await.users.update_from(&users);

    // Update and check print queue
    // First, get num of available printers
    let mut printers = MEMORY_DATABASE.lock().await.printers.clone();

    let printers_avail = printers.get_available_printers();

    info!("{} printers currently available", printers_avail.len());

    printers.cleanup_print_queue();

    MEMORY_DATABASE.lock().await.printers = printers.clone();

    // Then, get first x people in queue, where x is the number of available printers
    for i in 0..min(printers_avail.len(), printers.get_print_queue_length()) {
        let mut entry = MEMORY_DATABASE
            .lock()
            .await
            .printers
            .get_queue_at(i)
            .unwrap();

        if entry.was_notified() {
            continue;
        } else {
            entry.notify().await;
        }

        MEMORY_DATABASE
            .lock()
            .await
            .printers
            .update_queue_at(i, entry);
    }

    // Check each checkout log entry for expiration
    let checkout_log = MEMORY_DATABASE.lock().await.checkout_log.clone();

    let mut expired_items = 0;

    let mut current_checkouts = checkout_log.get_current_checkouts();

    for entry in current_checkouts.iter_mut() {
        if entry.is_expired() {
            expired_items += 1;
            let user = MEMORY_DATABASE
                .lock()
                .await
                .users
                .get_user_by_id(&entry.get_college_id());

            // If user is not found, just continue to next item
            if user.is_none() {
                warn!("User {} not found in database", entry.get_college_id());
                continue;
            }

            let user = user.unwrap();

            // Case one: item just expired, no emails have been sent
            if entry.get_emails_sent() == 0 {
                // Send email to user
                let email_result = send_individual_email(
                    user.get_email(),
                    None,
                    "MAKE Tool Checkout Notification #1".to_string(),
                    EMAIL_TEMPLATES
                        .lock()
                        .await
                        .get_expired_checkout(&entry.get_items_as_string()),
                )
                .await;

                if email_result.is_ok() {
                    entry.add_email_sent();
                }
            } else if entry.get_emails_sent() == entry.num_24_hours_passed() {
                // Case two: item is expired, and the number of emails sent is equal to the number of 24 hours since the item was checked out
                // Send email to user

                let email_result = send_individual_email(
                    user.get_email(),
                    None,
                    format!(
                        "MAKE Tool Checkout Notification #{}",
                        entry.get_emails_sent() + 1
                    ),
                    EMAIL_TEMPLATES
                        .lock()
                        .await
                        .get_expired_checkout(&entry.get_items_as_string()),
                )
                .await;

                if email_result.is_ok() {
                    entry.add_email_sent();
                }
            }
        }
    }

    if expired_items > 0 {
        info!("{} checkouts expired!", expired_items);
        MEMORY_DATABASE
            .lock()
            .await
            .checkout_log
            .currently_checked_out = current_checkouts;
    } else {
        info!("No checkouts expired!");
    }
}
