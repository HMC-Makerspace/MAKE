use std::time::SystemTime;

use log::info;
use serde::{Deserialize, Serialize};

const base_quiz_url: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid=";
const post_quiz_url: &str = "&single=true&output=csv";

const general: &str = "66546920";
const laser3d: &str = "1524924728";
const spray_paint: &str = "1841312496";
const composite: &str = "913890505";
const welding: &str = "482685426";
const studio: &str = "2079405017";
const waterjet: &str = "2100779718";

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
pub enum QuizName {
    General,
    Laser3D,
    SprayPaint,
    Composite,
    Welding,
    Studio,
    Waterjet
}

impl Default for QuizName {
    fn default() -> Self { QuizName::General }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct Quiz {
    pub last_updated: u64,
    pub responses: Vec<Response>,
    pub id: String,
    pub name: QuizName,
}

impl Quiz {
    pub fn new(id: &str, name: QuizName) -> Self {
        Quiz {
            last_updated: 0,
            responses: Vec::new(),
            id: id.to_string(),
            name,
        }
    }

    pub async fn update(&mut self) -> Result<(), reqwest::Error> {
        // Get time as unix timestamp
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        let response = reqwest::get(format!("{}{}{}", base_quiz_url, self.id, post_quiz_url))
            .await;

        if let Ok(mut response) = response {
            let data = response.text().await.expect("Failed to read quiz");

            // Fetch csv file
            let rdr = csv::Reader::from_reader(data.as_bytes());

            // Parse csv file
            let mut responses = Vec::new();

            for result in rdr.into_records() {
                if let Ok(result) = result {
                    // Create new item
                    let response = Response::new_from_line(result.iter().map(|x| x.to_string()).collect());

                    responses.push(response);
                }
            }

            // If everything is ok, update timestamp and items
            self.last_updated = now;
            self.responses = responses;

            info!("Updated quiz {:20?} with {} passing / {} responses", self.name, self.responses.iter().filter(|x| x.passed).count(), self.responses.len());
            Ok(())
        } else {
            Err(response.unwrap_err())
        }
    }

    pub fn passed_by(&self, college_id: &u64) -> bool {
        self.responses.iter().any(|x| &x.college_id == college_id) 
    }

    pub fn get_responses(&self) -> &Vec<Response> {
        &self.responses
    }

    pub fn get_name(&self) -> &QuizName {
        &self.name
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct Response {
    pub timestamp: String,
    pub name: String,
    pub college_id: u64,
    pub college_email: String,
    pub passed: bool,
}

impl Response {
    pub fn new_from_line(line: Vec<String>) -> Self {
        Response {
            timestamp: line[0].clone(),
            passed: Response::determine_if_passed(line[1].clone()),
            name: line[2].clone(),
            college_id: Response::parse_college_id(line[3].clone()),
            college_email: line[4].clone(),
        }
    }

    pub fn parse_college_id(id_str: String) -> u64 {
        // First, if it has a '-', remove everything after it
        let mut id_str = id_str.clone();

        if let Some(index) = id_str.find('-') {
            id_str.truncate(index);
        }

        // Remove all non-numeric characters
        id_str.retain(|c| c.is_numeric());

        // Parse to u64
        let id = id_str.parse::<u64>().unwrap_or(0);

        id
    }

    pub fn determine_if_passed(score_str: String) -> bool {
        let score = score_str.split("/").collect::<Vec<&str>>();

        // Check if both sides equal each other, eg '100 / 100'
        score[0].trim() == score[1].trim()
    }
}

pub fn get_quiz_url(quiz_id: &str) -> String {
    format!("{}{}{}", base_quiz_url, quiz_id, post_quiz_url)
}

pub fn get_all_quizzes() -> Vec<Quiz> {
    vec![
        Quiz::new(general, QuizName::General),
        Quiz::new(laser3d, QuizName::Laser3D),
        Quiz::new(spray_paint, QuizName::SprayPaint),
        Quiz::new(composite, QuizName::Composite),
        Quiz::new(welding, QuizName::Welding),
        Quiz::new(studio, QuizName::Studio),
        Quiz::new(waterjet, QuizName::Waterjet),
    ]
}