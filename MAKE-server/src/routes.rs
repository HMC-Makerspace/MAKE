#![feature(is_some_with)]

use crate::*;
use ::serde::{Deserialize, Serialize};
use actix_web::{error::*, *};
use openssl::stack::Stack;

#[derive(Deserialize, Serialize, Clone)]
struct UserInfo {
    name: String,
    college_id_number: u64,
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
            college_id_number: user.get_id(),
            college_email: user.get_email(),
            passed_quizzes: user.get_passed_quizzes(),
            pending_checkouts,
            all_checkouts,
            auth_level: user.get_auth_level(),
        }
    }
}

/*
================
    GET REQUESTS
================
*/

#[get("/v1/inventory")]
pub async fn get_inventory(path: web::Path<()>) -> Result<HttpResponse, Error> {
    let mut data = MEMORY_DATABASE.lock().await;
    let inventory = data.inventory.clone();
    Ok(HttpResponse::Ok().json(inventory))
}

#[get("/v1/quizzes")]
pub async fn get_quizzes(path: web::Path<()>) -> Result<HttpResponse, Error> {
    let mut data = MEMORY_DATABASE.lock().await;
    let quizzes = data.quizzes.clone();
    Ok(HttpResponse::Ok().json(quizzes))
}

#[get("/v1/users")]
pub async fn get_users(path: web::Path<()>) -> Result<HttpResponse, Error> {
    let mut data = MEMORY_DATABASE.lock().await;
    let users = data.users.clone();
    Ok(HttpResponse::Ok().json(users))
}

#[post("/v1/checkout/{id_number}/{item_name}")]
pub async fn checkout_item_by_name(path: web::Path<(u64, String)>) -> Result<HttpResponse, Error> {
    let (id_number, item_name) = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let item = data.inventory.get_item_by_name(&item_name);

    if item.is_none() {
        return Err(ErrorBadRequest("Item not found".to_string()));
    }

    data.checkout_log
        .add_checkout(CheckoutLogEntry::new(&user.unwrap(), &item.unwrap()));

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[get("/v1/checkout_log")]
pub async fn get_checkout_log(path: web::Path<()>) -> Result<HttpResponse, Error> {
    let data = MEMORY_DATABASE.lock().await;
    let checkout_log = data.checkout_log.clone();
    Ok(HttpResponse::Ok().json(checkout_log))
}

#[get("/v1/user_info/{id_number}")]
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

/*
=================
    POST REQUESTS
=================
*/

#[post("/v1/checkout_uuid/{id_number}/{item_uuid}")]
pub async fn checkout_item_by_uuid(path: web::Path<(u64, String)>) -> Result<HttpResponse, Error> {
    let (id_number, item_uuid) = path.into_inner();

    let mut data = MEMORY_DATABASE.lock().await;

    let user = data.users.get_user_by_id(&id_number);

    if user.is_none() {
        return Err(ErrorBadRequest("User not found".to_string()));
    }

    let item = data.inventory.get_item_by_uuid(&item_uuid);

    if item.is_none() {
        return Err(ErrorBadRequest("Item not found".to_string()));
    }

    data.checkout_log
        .add_checkout(CheckoutLogEntry::new(&user.unwrap(), &item.unwrap()));

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}

#[post("/v1/auth/set_level/{id_number}/{auth_level}")]
pub async fn set_auth_level(path: web::Path<(u64, AuthLevel)>) -> Result<HttpResponse, Error> {
    let (id_number, auth_level) = path.into_inner();

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
}

#[post("/v1/auth/set_quiz/{id_number}/{quiz_name}/{passed}")]
pub async fn set_quiz_passed(
    path: web::Path<(u64, QuizName, bool)>,
) -> Result<HttpResponse, Error> {
    let (id_number, quiz_name, passed) = path.into_inner();

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
}

#[post("/v1/printers/update_status")]
pub async fn update_printer_status(
    path: web::Path<()>,
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
