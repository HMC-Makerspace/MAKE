use crate::*; 
use serde::{Deserialize, Serialize};

const PROFICIENCIES: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYlLMDI2Sv1e8MDpCmtshaFu8MnS5g0xPkmf3ZFEntx8j1kJbfup6uqFPGh2bpxt_IwY9qyEZk4hDS/pub?gid=954325037&single=true&output=csv";
const SHIFT_SCHEDULES: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE5Daf9Y_ydDpyAvxickgTRJcTNpE4V-Vj0W4VxkGgXHmIwq4EtVeyeSRJDzEotfSVDK82H8aetzK5/pub?gid=0&single=true&output=csv";


#[derive(Default, Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
#[serde(default)]
pub struct Schedule {
    pub days: Vec<ScheduleDay>,
    pub all_proficiencies: Vec<String>,
}

impl Schedule {
    pub async fn update(&mut self) -> Result<(), reqwest::Error> {
        let prof_response = reqwest::get(PROFICIENCIES).await;
        let shift_response = reqwest::get(SHIFT_SCHEDULES).await;

        if let Ok(shift_response) = shift_response {
            let shift_csv = shift_response.text().await.unwrap();
            let mut rdr = csv::Reader::from_reader(shift_csv.as_bytes());
            
            let days = vec![
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ];

            let mut days: Vec<ScheduleDay> = days.iter().map(|day| {
                let day = ScheduleDay::new(day.to_string());
                day
            }).collect();

            // discard first row

            // Read until row's first cell is empty
            for result in rdr.records() {
                if let Ok(result) = result {

                    if result.get(0).unwrap().is_empty() {
                        break;
                    }

                    let shift = Shift::new(result[0].to_string());

                    for (i, cell) in result.iter().enumerate().skip(1) {
                        let mut current_shift = shift.clone();
                        
                        if cell.trim().len() > 0 {
                            current_shift.stewards = cell.split(",").map(|x| x.trim().to_string()).collect();
                            current_shift.num_stewards = current_shift.stewards.len() as u32;
    
                            days[i - 1].add_shift(current_shift);
                        }
                    }
                }
            }

            if let Ok(prof_response) = prof_response {
                let prof_csv = prof_response.text().await.unwrap();
                let mut rdr = csv::Reader::from_reader(prof_csv.as_bytes());

                // discard first two rows
                let _ = rdr.records().next();

                // Read until row's first cell is empty
                for result in rdr.records() {
                    if let Ok(result) = result {
                        let steward_name = result[1].to_string();
                        
                        let mut profs: Vec<String> = result.iter().skip(3).map(|x| x.to_string()).collect();
                        self.all_proficiencies.append(&mut profs.clone());

                        // Delete empty cells
                        profs = profs.into_iter().filter(|x| !x.is_empty()).collect();

                        for day in &mut days {
                            for shift in &mut day.shifts {
                                if shift.stewards.contains(&steward_name) {
                                    for prof in &profs {
                                        if !shift.proficiencies.contains(prof) {
                                            shift.proficiencies.push(prof.to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                self.days = days;
            }
        }

        self.all_proficiencies.sort();
        self.all_proficiencies.dedup();
        self.all_proficiencies.retain(|x| !x.is_empty() || x.len() > 0);
        
        Ok(())
    }

    pub fn censor_names(&mut self) {
        for day in &mut self.days {
            for shift in &mut day.shifts {
                shift.stewards = vec!["Steward".to_string(); shift.stewards.len()];
            }
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
pub struct ScheduleDay {
    pub day: String,
    pub shifts: Vec<Shift>,
}

impl ScheduleDay {
    pub fn new(day: String) -> Self {
        ScheduleDay {
            day,
            shifts: Vec::new(),
        }
    }

    pub fn add_shift(&mut self, shift: Shift) {
        self.shifts.push(shift);
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
pub struct Shift {
    pub time_string: String,
    pub stewards: Vec<String>,
    pub num_stewards: u32,
    pub proficiencies: Vec<String>,
}

impl Shift {
    pub fn new(time_string: String) -> Self {
        Shift {
            time_string,
            stewards: Vec::new(),
            num_stewards: 0,
            proficiencies: Vec::new(),
        }
    }
}