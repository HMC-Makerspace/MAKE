use std::io::Read;
use std::io::Write;
use std::process::exit;
use std::thread;
use std::fs::OpenOptions;

use actix_cors::*;
use actix_web::*;
use actix_web::rt::spawn;
use actix_web_static_files::ResourceFiles;

use env_logger::Logger;
use lazy_static::__Deref;
use log::*;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use tokio::time;
use std::time::Duration;
use koit::{FileDatabase, format::Json};
use serde::{Deserialize, Serialize};

mod routes;
mod inventory;
mod laser_cutter;
mod permissions;
mod printers;
mod quizzes;
mod users;
mod checkout;
mod student_storage;

use crate::routes::*;
use crate::inventory::*;
use crate::laser_cutter::*;
use crate::permissions::*;
use crate::printers::*;
use crate::quizzes::*;
use crate::users::*;
use crate::checkout::*;
use crate::student_storage::*;

use lazy_static::lazy_static;
use tokio::sync::Mutex;
use std::{sync::Arc};

// Debug vs release address
#[cfg(debug_assertions)]
const ADDRESS: &str = "127.0.0.1:8080";
#[cfg(not(debug_assertions))]
const ADDRESS: &str = "0.0.0.0:8080";

include!(concat!(env!("OUT_DIR"), "/generated.rs"));

#[derive(Default, Deserialize, Serialize)]
pub struct Data {
    pub inventory: Inventory,
    pub users: Users,
    pub printers: Printers,
    pub quizzes: Vec<Quiz>,
    pub checkout_log: CheckoutLog,
    pub student_storage: StudentStorage,
}

#[derive(Default, Deserialize, Serialize)]
pub struct ApiKeysToml {
    pub api_keys: ApiKeys,
}

#[derive(Default, Deserialize, Serialize)]
pub struct ApiKeys {
    checkout: String,
    student_storage: String,
    printers: String,
}

impl ApiKeys {
    // Print the keys to the console, only showing the first few characters of each key
    pub fn peek_print(&self) {
        info!("Checkout key:         {}...", &self.checkout[..10]);
        info!("Student storage key:  {}...", &self.student_storage[..10]);
        info!("Printers key:         {}...", &self.printers[..10]);
    }
}

lazy_static! {
    pub static ref MEMORY_DATABASE: Arc<Mutex<Data>> =
        Arc::new(Mutex::new(Data::default()));
    
    pub static ref API_KEYS: Arc<Mutex<ApiKeys>> =
        Arc::new(Mutex::new(ApiKeys::default()));
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
        return Ok(Data::default());
    } else {
        let mut file = file.unwrap();

        let mut data = String::new();
        file.read_to_string(&mut data)?;
        let data: Data = from_slice_lenient(&data.as_bytes()).unwrap();
        Ok(data)
    }
}

pub async fn save_database() -> Result<(), Error> {
    let mut file = OpenOptions::new().write(true).create(true).open(DB_NAME)?;
    let data = MEMORY_DATABASE.lock().await;
    
    // Get data struct from mutex guard
    let data = data.deref();

    let data = serde_json::to_string_pretty(&data)?;
    file.write_all(data.as_bytes())?;
    Ok(())
}

pub async fn load_api_keys() -> Result<(), Error> {
    info!("Loading API keys...");

    let mut file = OpenOptions::new().read(true).open("api_keys.toml").expect("Failed to open api_keys.toml");
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
    // Load api keys
    load_api_keys().await.expect("Could not load API keys!");

    // Load all databases
    let data = load_database().unwrap();
    let mut lock = MEMORY_DATABASE.lock().await;
    *lock = data;
    drop(lock);

    info!("Database(s) loaded!");

    spawn(async move {
        let mut interval = time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            update_loop().await;
            save_database().await;
        }
    });

    // Create builder without ssl
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_header()
            .allow_any_method()
            .send_wildcard()
            .max_age(3600);

        App::new()
            .wrap(actix_web::middleware::Logger::default())
            .wrap(actix_web::middleware::Compress::default())
            .wrap(cors)
            // Static files for frontend website
            .service(get_inventory)
            .service(get_quizzes)
            .service(get_users)
            .service(checkout_item_by_name)
            .service(checkout_item_by_uuid)
            .service(get_checkout_log)
            .service(get_user_info)
            .service(set_auth_level)
            .service(set_quiz_passed)
            .service(update_printer_status)
            .service(ResourceFiles::new("/", generate()))
    })
    .bind(ADDRESS)?
    .run()
    .await
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
    let mut inventory = Inventory::new();
    
    let update_result = inventory.update().await;

    if update_result.is_err() {
        info!("Failed to update inventory: {}", update_result.err().unwrap());
    } else {
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

}