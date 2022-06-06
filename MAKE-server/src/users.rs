use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::quizzes::*;
use crate::inventory::*;
use crate::checkout::*;

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Users {
    users: HashMap<u64, User>,
}

impl Users {
    pub fn has_user(&self, user: &User) -> bool {
        self.users.contains_key(&user.college_id_number)
    }

    pub fn get_user(&self, user: &User) -> Option<User> {
        self.users.get(&user.college_id_number).cloned()
    }

    pub fn add_user(&mut self, user: User) {
        self.users.insert(user.college_id_number, user);
    }

    pub fn get_user_by_id(&self, id_number: &u64) -> Option<User> {
        self.users.get(id_number).cloned()
    }

    pub fn len(&self) -> usize {
        self.users.len()
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct User {
    name: String,
    college_id_number: u64,
    college_email: String,
    passed_quizzes: Vec<QuizName>,
}

impl User {
    pub fn from_response(response: &Response) -> Self {
        User {
            name: response.name.clone(),
            college_id_number: response.college_id,
            college_email: response.college_email.clone(),
            passed_quizzes: vec![],
        }
    }

    pub fn log_quiz(&mut self, quiz_name: QuizName, passed: bool) {
        if passed { self.passed_quizzes.push(quiz_name) };
    }

    pub fn get_id(&self) -> u64 {
        self.college_id_number
    }

    pub fn get_email(&self) -> String {
        self.college_email.to_string()
    }

    pub fn get_name(&self) -> String {
        self.name.to_string()
    }

    pub fn get_passed_quizzes(&self) -> Vec<QuizName> {
        self.passed_quizzes.clone()
    }

    pub fn get_pending_checked_out_items(&self, checkout_log: &CheckoutLog) -> Vec<CheckoutLogEntry> {
        checkout_log.log.iter()
            .filter(|x| x.user_id == self.get_id() && x.checked_in == false)
            .cloned()
            .collect()
    }

    pub fn get_all_checked_out_items(&self, checkout_log: &CheckoutLog) -> Vec<CheckoutLogEntry> {
        checkout_log.log.iter()
            .filter(|x| x.user_id == self.get_id())
            .cloned()
            .collect()
    }
}

pub fn create_users_from_quizzes(quizzes: &Vec<Quiz>) -> Users {
    let mut users = Users::default();

    for quiz in quizzes {
        for response in quiz.get_responses() {
            let mut user = User::from_response(response);

            if users.has_user(&user) {
                user = users.get_user(&user).unwrap().clone();
            }

            user.log_quiz(quiz.get_name().clone(), response.passed);

            users.add_user(user);
        }
    }

    users
}