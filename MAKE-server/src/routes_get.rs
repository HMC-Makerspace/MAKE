use crate::*;
use ::serde::{Deserialize, Serialize};
use actix_web::error::*;
use serde_json::json;

#[derive(Deserialize, Serialize, Clone)]
struct UserInfo {
    name: String,
    college_id: u64,
    college_email: String,
    passed_quizzes: Vec<QuizName>,
    pending_checkouts: Vec<CheckoutLogEntry>,
    all_checkouts: Vec<CheckoutLogEntry>,
    auth_level: AuthLevel,
}

impl UserInfo {
    fn from_user_and_checkouts(
        user: &User,
        pending_checkouts: Vec<CheckoutLogEntry>,
        all_checkouts: Vec<CheckoutLogEntry>,
    ) -> Self {
        UserInfo {
            name: user.get_name(),
            college_id: user.get_id(),
            college_email: user.get_email(),
            passed_quizzes: user.get_passed_quizzes(),
            pending_checkouts,
            all_checkouts,
            auth_level: user.get_auth_level(),
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
struct PrinterStatuses {
    printers: Vec<Printer>,
    pos_in_queue: Option<usize>,
    total_in_queue: usize,
}

impl PrinterStatuses {
    fn from_printers(
        printers: Vec<Printer>,
        pos_in_queue: Option<usize>,
        total_in_queue: usize,
    ) -> Self {
        PrinterStatuses {
            printers,
            pos_in_queue,
            total_in_queue,
        }
    }
}

/*

Redirect from http to https

*/
#[get("/")]
async fn handler(req: HttpRequest) -> HttpResponse {
    match req.app_config().local_addr().port() {
        443 => HttpResponse::Ok().body("Hello World from 443"),
        _ =>  HttpResponse::PermanentRedirect().append_header(("location", "https://make.hmc.edu")).finish(),
    }
}

/*

HELP

*/

/// Returns help page in ../Documentation/openapi/help.html
#[get("/api/v1/help")]
pub async fn help() -> Result<HttpResponse, Error> {
    let resp = HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("../../Documentation/api.md"));

    Ok(resp)
}

/*
================
    GET REQUESTS
================
*/

/// Returns a simple JSON object with:
/// - status: alive
/// - version: the version of the server
/// - time: the current time
/// - total_items: the number of items in the inventory
/// - total_checkouts: the number of checkouts in the database
/// - total_users: the number of users in the database
/// - last_update: last quiz update
#[get("/api/v1/status")]
pub async fn status() -> Result<HttpResponse, Error> {
    let time = Utc::now();
    let data = MEMORY_DATABASE.lock().await;

    let resp = HttpResponse::Ok()
        .content_type("application/json")
        .body(
            json!({
                "status": "alive",
                "version": env!("CARGO_PKG_VERSION"),
                "time": time.timestamp(),
                "total_items": data.inventory.items.len(),
                "total_checkouts": data.checkout_log.len(),
                "total_users": data.users.len(),
                "last_update": data.inventory.last_updated,
            })
            .to_string(),
        );

    Ok(resp)
}

#[get("/api/v1/inventory")]
pub async fn get_inventory(_path: web::Path<()>) -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let inventory = data.inventory.clone();
    Ok(HttpResponse::Ok().json(inventory))
}

#[get("/api/v1/quizzes/{api_key}")]
pub async fn get_quizzes(path: web::Path<String>) -> Result<HttpResponse, Error> {
    if API_KEYS.lock().await.validate_admin(&path.into_inner()) {
        let data = MEMORY_DATABASE.lock().await;
        let quizzes = data.quizzes.clone();
        Ok(HttpResponse::Ok().json(quizzes))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/users/all/{api_key}")]
pub async fn get_users(path: web::Path<String>) -> Result<HttpResponse, Error> {
    if API_KEYS.lock().await.validate_checkout(&path.into_inner()) {
        let data = MEMORY_DATABASE.lock().await;
        let users = data.users.clone();
        Ok(HttpResponse::Ok().json(users))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/users/for_cis/{api_key}")]
pub async fn get_swipe_access(path: web::Path<String>) -> Result<HttpResponse, Error> {
    if API_KEYS.lock().await.validate_checkout(&path.into_inner()) {
        let data = MEMORY_DATABASE.lock().await;
        let users = data.users.clone();
        Ok(HttpResponse::Ok().json(users))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/checkouts/log/{api_key}")]
pub async fn get_checkout_log(path: web::Path<String>) -> Result<HttpResponse, Error> {
    let api_key = path.into_inner();
    if API_KEYS.lock().await.validate_checkout(&api_key) {
        let data = MEMORY_DATABASE.lock().await;
        let checkout_log = data.checkout_log.clone();
        Ok(HttpResponse::Ok().json(checkout_log))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/users/info/{id_number}")]
pub async fn get_user_info(path: web::Path<u64>) -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let user = data.users.get_user_by_id(&path.into_inner());
    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    // Get checkout log entries for user
    let pending_checkouts = &user.get_pending_checked_out_items(&data.checkout_log);
    let all_checkouts = &user.get_all_checked_out_items(&data.checkout_log);

    let user_info = UserInfo::from_user_and_checkouts(
        &user,
        pending_checkouts.to_vec(),
        all_checkouts.to_vec(),
    );

    Ok(HttpResponse::Ok().json(user_info))
}

#[get("/api/v1/student_storage/user/{id_number}")]
pub async fn get_student_storage_for_user(path: web::Path<u64>) -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let user = data.users.get_user_by_id(&path.into_inner());
    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    let student_storage = data.student_storage.view_for_user(&user);

    Ok(HttpResponse::Ok().json(student_storage))
}

#[get("/api/v1/student_storage/all/{api_key}")]
pub async fn get_student_storage_for_all(path: web::Path<String>) -> Result<HttpResponse, Error> {
    let api_key = path.into_inner();
    if API_KEYS.lock().await.validate_student_storage(&api_key) {
        let data = MEMORY_DATABASE.lock().await;
        let student_storage = data.student_storage.clone();
        Ok(HttpResponse::Ok().json(student_storage))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/printers/{id_number}")]
pub async fn get_printers(path: web::Path<u64>) -> Result<HttpResponse, Error> {
    let id = path.into_inner();
    let data = MEMORY_DATABASE.lock().await;
    let printers = data.printers.get_printer_statuses();
    let pos_in_queue = data.printers.get_queue_pos_for(id);
    let total_in_queue = data.printers.get_print_queue_length();

    let printers = PrinterStatuses::from_printers(printers, pos_in_queue, total_in_queue);
    Ok(HttpResponse::Ok().json(printers))
}

#[get("/api/v1/printers/for_api/{api_key}")]
pub async fn get_printers_api_key(path: web::Path<String>) -> Result<HttpResponse, Error> {
    let api_key = path.into_inner();

    let api_keys = API_KEYS.lock().await;

    if api_keys.validate_printers(&api_key)
        || api_keys.validate_checkout(&api_key)
        || api_keys.validate_admin(&api_key)
    {
        let data = MEMORY_DATABASE.lock().await;
        let printers = data.printers.get_printer_statuses();

        Ok(HttpResponse::Ok().json(printers))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/schedule")]
pub async fn get_schedule() -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let schedule = data.schedule.clone().censor_names();

    drop(data);

    Ok(HttpResponse::Ok().json(schedule))
}

#[get("/api/v1/schedule/{api_key}")]
pub async fn get_schedule_api_key(path: web::Path<String>) -> Result<HttpResponse, Error> {
    let api_key = path.into_inner();
    if API_KEYS.lock().await.validate_admin(&api_key)
    {
        let data = MEMORY_DATABASE.lock().await;
        let schedule = data.schedule.clone();
        Ok(HttpResponse::Ok().json(schedule))
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[get("/api/v1/workshops")]
pub async fn get_workshops() -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let workshops = data.workshops.clone();
    drop(data);

    Ok(HttpResponse::Ok().json(workshops))
}
