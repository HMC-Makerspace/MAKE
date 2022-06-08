use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::quizzes::*;
use crate::inventory::*;
use crate::checkout::*;

#[derive(Deserialize, Serialize, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum AuthLevel {
    User,
    Steward,
    Admin,
    System,
}

impl Default for AuthLevel {
    fn default() -> Self {
        AuthLevel::User
    }
}

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

    pub fn add_set_user(&mut self, user: User) {
        self.users.insert(user.college_id_number, user);
    }

    pub fn get_user_by_id(&self, id_number: &u64) -> Option<User> {
        self.users.get(id_number).cloned()
    }

    pub fn len(&self) -> usize {
        self.users.len()
    }

    pub fn update_from(&mut self, other: &Users) {
        // If the user doesn't exist, add it
        for (id_number, user) in other.users.iter() {
            if !self.users.contains_key(id_number) {
                self.users.insert(*id_number, user.clone());
            } else {
                // If the user exists, update passed quizzes, but don't delete any quizzes
                        
                let mut current_user = self.users.get(id_number).unwrap().clone();

                current_user.update_soft_from(user);

                self.users.insert(*id_number, current_user.clone());
            }            
        }
    }

    pub fn exists(&self, id_number: &u64) -> bool {
        self.users.contains_key(id_number)
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct User {
    name: String,
    college_id_number: u64,
    college_email: String,
    passed_quizzes: Vec<QuizName>,
    auth_level: AuthLevel,
}

impl User {
    pub fn from_response(response: &Response) -> Self {
        User {
            name: response.name.clone(),
            college_id_number: response.college_id,
            college_email: response.college_email.clone(),
            passed_quizzes: vec![],
            auth_level: AuthLevel::User,
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

    pub fn update_soft_from(&mut self, other: &User) {
        // Take union of passed quizzes
        self.passed_quizzes = self.passed_quizzes
            .iter()
            .chain(other.passed_quizzes.iter())
            .cloned()
            .collect();

        // Remove duplicates
        self.passed_quizzes.sort();
        self.passed_quizzes.dedup();

        // Then, update auth level
        if other.auth_level > self.auth_level {
            self.auth_level = other.auth_level.clone();
        }
    }

    pub fn get_auth_level(&self) -> AuthLevel {
        self.auth_level.clone()
    }

    pub fn set_auth_level(&mut self, auth_level: AuthLevel) {
        self.auth_level = auth_level;
    }

    pub fn set_quiz_passed(&mut self, quiz_name: &QuizName, passed: bool) {
        if passed {
            self.passed_quizzes.push(quiz_name.clone());
        } else {
            self.passed_quizzes.retain(|x| x != quiz_name);
        }
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

            users.add_set_user(user);
        }
    }

    users
}