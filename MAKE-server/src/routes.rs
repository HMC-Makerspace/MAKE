#![feature(is_some_with)]

use crate::*;
use ::serde::{Deserialize, Serialize};
use actix_web::error::*;

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

HELP

*/

/// Returns help page in ../Documentation/openapi/help.html
#[get("/api/v1/help")]
pub async fn help() -> Result<HttpResponse, Error> {
    let resp = HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("../../Documentation/openapi/help.html"));

    Ok(resp)
}

#[get("/api/v1/openapi.yaml")]
pub async fn openapi() -> Result<HttpResponse, Error> {
    let resp = HttpResponse::Ok()
        .content_type("text/html")
        .body(include_str!("../../Documentation/openapi/openapi.yaml"));

    Ok(resp)
}

/*
================
    GET REQUESTS
================
*/

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
    if API_KEYS.lock().await.validate_admin(&path.into_inner()) {
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

/*
=================
    POST REQUESTS
=================
*/

#[derive(Deserialize)]
pub struct CheckoutItems {
    items: Vec<String>,
}
#[post("/api/v1/checkouts/add_entry/{id_number}/{sec_length}/{api_key}")]
pub async fn checkout_items(
    path: web::Path<(u64, u64, String)>,
    body: web::Json<CheckoutItems>,
) -> Result<HttpResponse, Error> {
    let (id_number, sec_length, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_checkout(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let user = data.users.get_user_by_id(&id_number);

        if user.is_none() {
            return Err(ErrorBadRequest("User not found".to_string()));
        }

        let user = user.unwrap();

        if user.get_auth_level() == AuthLevel::Banned {
            return Err(ErrorUnauthorized("User is banned".to_string()));
        }

        data.checkout_log.add_checkout(CheckoutLogEntry::new(
            user.get_id(),
            sec_length,
            body.items.clone(),
        ));

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/checkouts/check_in_entry/{uuid}/{api_key}")]
pub async fn checkin_items(
    path: web::Path<(String, String)>,
) -> Result<HttpResponse, Error> {
    let (uuid, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_checkout(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;
    
        let result = data.checkout_log.check_in(uuid);
    
        drop(data);
    
        if result.is_err() {
            return Err(ErrorBadRequest("Checkout not found".to_string()));
        }
    
        Ok(HttpResponse::Ok().finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/auth/set_level/{id_number}/{auth_level}/{api_key}")]
pub async fn set_auth_level(
    path: web::Path<(u64, AuthLevel, String)>,
) -> Result<HttpResponse, Error> {
    let (id_number, auth_level, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_admin(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let user = data.users.get_user_by_id(&id_number);

        if user.is_none() {
            return Err(ErrorBadRequest("User not found".to_string()));
        }

        let mut user = user.unwrap();

        user.set_auth_level(auth_level);

        data.users.add_set_user(user);

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/auth/set_quiz/{id_number}/{quiz_name}/{passed}/{api_key}")]
pub async fn set_quiz_passed(
    path: web::Path<(u64, QuizName, bool, String)>,
) -> Result<HttpResponse, Error> {
    let (id_number, quiz_name, passed, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_admin(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let user = data.users.get_user_by_id(&id_number);

        if user.is_none() {
            return Err(ErrorBadRequest("User not found".to_string()));
        }

        let mut user = user.unwrap();

        user.set_quiz_passed(&quiz_name, passed);

        data.users.add_set_user(user);

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/printers/update_status")]
pub async fn update_printer_status(
    _path: web::Path<()>,
    body: web::Json<PrinterWebhookUpdate>,
) -> Result<HttpResponse, Error> {
    let mut data = MEMORY_DATABASE.lock().await;

    let result = data.printers.add_printer_status(body.into_inner()).await;

    if result.is_err() {
        let error = result.unwrap_err();

        if error == "Invalid API Key" {
            warn!("Invalid printer API key!");
        } else {
            warn!("Error adding printer status: {}", error);
        }
    }

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[post("/api/v1/printers/join_queue/{id_number}")]
pub async fn join_printer_queue(path: web::Path<u64>) -> Result<HttpResponse, Error> {
    let id_number = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    if user.get_auth_level() == AuthLevel::Banned {
        return Err(ErrorUnauthorized("User is banned".to_string()));
    }

    let result = data.printers.add_user_to_queue(&user);

    if result.is_err() {
        return Err(ErrorBadRequest(result.unwrap_err()));
    }

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[post("/api/v1/printers/leave_queue/{id_number}")]
pub async fn leave_printer_queue(path: web::Path<u64>) -> Result<HttpResponse, Error> {
    let id_number = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    let result = data.printers.remove_user_from_queue(&user);

    if result.is_err() {
        return Err(ErrorBadRequest(result.unwrap_err()));
    }

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[post("/api/v1/student_storage/add_entry/{id_number}/{slot_id}/{api_key}")]
pub async fn checkout_student_storage(
    path: web::Path<(u64, String, String)>,
) -> Result<HttpResponse, Error> {
    let (id_number, slot_id, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_student_storage(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let user = data.users.get_user_by_id(&id_number);

        if user.is_none() {
            return Err(ErrorBadRequest("User not found".to_string()));
        }

        let user = user.unwrap();

        if user.get_auth_level() == AuthLevel::Banned {
            return Err(ErrorUnauthorized("User is banned".to_string()));
        }

        let finished = data
            .student_storage
            .checkout_slot_by_id(&user.get_id(), &slot_id);

        if !finished {
            return Err(ErrorBadRequest("Slot not found".to_string()));
        }

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/student_storage/renew/{id_number}/{slot_id}")]
pub async fn renew_student_storage_slot(
    path: web::Path<(u64, String)>,
) -> Result<HttpResponse, Error> {
    let (id_number, slot_id) = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    if user.get_auth_level() == AuthLevel::Banned {
        return Err(ErrorUnauthorized("User is banned".to_string()));
    }

    data.student_storage.renew_by_id(&user.get_id(), &slot_id);

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[post("/api/v1/student_storage/release/{id_number}/{slot_id}")]
pub async fn release_student_storage_slot(
    path: web::Path<(u64, String)>,
) -> Result<HttpResponse, Error> {
    let (id_number, slot_id) = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let user = user.unwrap();

    data.student_storage.release_by_id(&user.get_id(), &slot_id);

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}
