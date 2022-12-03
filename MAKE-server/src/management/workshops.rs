use serde::{Serialize, Deserialize};

const WORKSHOPS_URL: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5JYAVvKE2Jy-o0DPVA8Xt5fj188wVr91Z1gBNjVmXRvHuB-svJl244mhv46PDW_IS61H_4k_giMnY/pub?gid=986877356&single=true&output=csv";


#[derive(Default, Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
#[serde(default)]
pub struct Workshops {
    pub workshops: Vec<Workshop>,
}

impl Workshops {
    pub fn new() -> Self {
        Self {
            workshops: Vec::new(),
        }
    }

    pub async fn update(&mut self) {
        let workshops_response = reqwest::get(WORKSHOPS_URL).await;

        if let Ok(workshops_response) = workshops_response {
            let workshops_csv = workshops_response.text().await.unwrap();
            let mut rdr = csv::Reader::from_reader(workshops_csv.as_bytes());

            self.workshops = Vec::new();

            // Read until row's first cell is empty
            for result in rdr.records() {
                if let Ok(result) = result {

                    if result.get(0).unwrap().is_empty() {
                        break;
                    }

                    let workshop = Workshop::new(result);

                    self.workshops.push(workshop);
                }
            }
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, Eq, Ord)]
#[serde(default)]
pub struct Workshop {
    pub title: String,
    pub date: String,
    pub time: String,
    pub instructor: String,
    pub description: String,
    pub slots_available: String,
}

impl Workshop {
    pub fn new(result: csv::StringRecord) -> Self {
        Self {
            title: result[3].to_string(),
            date: result[0].to_string(),
            time: result[1].to_string(),
            instructor: result[2].to_string(),
            description: result[4].to_string(),
            slots_available: result[5].to_string(),
        }
    }
}