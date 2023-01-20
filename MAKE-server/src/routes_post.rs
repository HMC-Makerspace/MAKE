use crate::*;
use ::serde::{Deserialize};
use actix_web::error::*;


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

        drop(data);

        let _ = save_database().await;

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        
        Ok(HttpResponse::Unauthorized().finish())
    }

}

#[post("/api/v1/checkouts/extend/{uuid}/{sec_length}/{api_key}")]
pub async fn extend_checkout_by_uuid(path: web::Path<(String, u64, String)>) -> Result<HttpResponse, Error> {
    let (uuid, sec_length, api_key) = path.into_inner();

    if API_KEYS.lock().await.validate_checkout(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let checkout = data.checkout_log.extend_checkout(uuid, sec_length);

        if checkout.is_err() {
            return Err(ErrorBadRequest(checkout.err().unwrap().to_string()));
        }

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}
    
#[post("/api/v1/checkouts/add_reservation/{id_number}/{start_time}/{sec_length}/{api_key}")]
pub async fn reserve_items(
    path: web::Path<(u64, u64, u64, String)>,
    body: web::Json<CheckoutItems>,
) -> Result<HttpResponse, Error> {
    let (id_number, start_time, sec_length, api_key) = path.into_inner();

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
        data.checkout_log.add_reservation(CheckoutLogEntry::new_reservation(
            user.get_id(),
            start_time,
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
        
        let _ = save_database().await;

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

    let result = data.student_storage.renew_by_id(&user.get_id(), &slot_id);

    if result.is_err() {
        return Err(ErrorBadRequest(result.unwrap_err()));
    }

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

#[post("/api/v1/inventory/add_restock_notice/{api_key}")]
pub async fn add_restock_notice(
    body: web::Json<RestockNotice>,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    if API_KEYS.lock().await.validate_checkout(&path.into_inner()) {
        let mut data = MEMORY_DATABASE.lock().await;

        let mut notice = body.into_inner();

        notice.authorized = true;

        data.inventory.add_restock_notice(notice);

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}

#[post("/api/v1/inventory/add_restock_notice_user")]
pub async fn add_user_restock_notice(
    body: web::Json<RestockNotice>,
) -> Result<HttpResponse, Error> {
    let mut data = MEMORY_DATABASE.lock().await;

    let mut notice = body.into_inner();

    notice.authorized = false;

    data.inventory.add_restock_notice(notice);

    Ok(HttpResponse::Ok()
        .status(http::StatusCode::CREATED)
        .finish())
}


#[post("/api/v1/usage/add_button_log/{api_key}")]
pub async fn add_button_log(
    path: web::Path<String>,
    button_record: web::Json<ButtonRecord>,
) -> Result<HttpResponse, Error> {
    let api_key = path.into_inner();

    if API_KEYS.lock().await.validate_admin(&api_key) {
        let mut data = MEMORY_DATABASE.lock().await;

        let button_record = button_record.into_inner();

        data.button_log.add(button_record);

        Ok(HttpResponse::Ok()
            .status(http::StatusCode::CREATED)
            .finish())
    } else {
        Ok(HttpResponse::Unauthorized().finish())
    }
}