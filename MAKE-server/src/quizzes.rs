use std::time::SystemTime;

use log::info;
use serde::{Deserialize, Serialize};

const BASE_QUIZ_URL: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid=";
const POST_QUIZ_URL: &str = "&single=true&output=csv";

const GENERAL: &str = "66546920";
const LASER3D: &str = "1524924728";
const SPRAY_PAINT: &str = "1841312496";
const COMPOSITE: &str = "913890505";
const WELDING: &str = "482685426";
const STUDIO: &str = "2079405017";
const WATERJET: &str = "2100779718";

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

        let response = reqwest::get(format!("{}{}{}", BASE_QUIZ_URL, self.id, POST_QUIZ_URL))
            .await;

        if let Ok(response) = response {
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
        let mut id_str = id_str;

        if let Some(index) = id_str.find('-') {
            id_str.truncate(index);
        }

        // Remove all non-numeric characters
        id_str.retain(|c| c.is_numeric());

        // Parse to u64
        

        id_str.parse::<u64>().unwrap_or(0)
    }

    pub fn determine_if_passed(score_str: String) -> bool {
        let score = score_str.split('/').collect::<Vec<&str>>();

        // Check if both sides equal each other, eg '100 / 100'
        score[0].trim() == score[1].trim()
    }
}

pub fn get_quiz_url(quiz_id: &str) -> String {
    format!("{}{}{}", BASE_QUIZ_URL, quiz_id, POST_QUIZ_URL)
}

pub fn get_all_quizzes() -> Vec<Quiz> {
    vec![
        Quiz::new(GENERAL, QuizName::General),
        Quiz::new(LASER3D, QuizName::Laser3D),
        Quiz::new(SPRAY_PAINT, QuizName::SprayPaint),
        Quiz::new(COMPOSITE, QuizName::Composite),
        Quiz::new(WELDING, QuizName::Welding),
        Quiz::new(STUDIO, QuizName::Studio),
        Quiz::new(WATERJET, QuizName::Waterjet),
    ]
}