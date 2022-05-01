use std::process::exit;
use std::thread;

use actix_cors::*;
use actix_web::*;
use env_logger::Logger;
use log::info;
use openssl::ssl::{SslAcceptor, SslFiletype, SslMethod};
use std::time::Duration;

mod inventory;
mod laser_cutter;
mod permissions;
mod printers;
mod quizzes;
mod users;

use crate::inventory::*;
use crate::laser_cutter::*;
use crate::permissions::*;
use crate::printers::*;
use crate::quizzes::*;
use crate::users::*;

/// Main function to run both actix_web server and API update loop
/// API update loops lives inside a tokio thread while the actix_web
/// server is run in the main thread and blocks until done.
async fn async_main() -> std::io::Result<()> {
    // Load all databases

    info!("Database(s) loaded!");

    tokio::spawn(async move {
        let _ = update_loop().await;
    });

    // Create builder without ssl
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_header()
            .allow_any_method()
            .send_wildcard()
            .max_age(3600);

        App::new()
            .wrap(actix_web::middleware::Logger::default())
            .wrap(cors)
    })
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
