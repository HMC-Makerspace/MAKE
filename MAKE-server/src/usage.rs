use crate::*;

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub enum College {
    #[default]
    NA,
    HarveyMudd,
    ClaremontMcKenna,
    Scripps,
    Pitzer,
    Pomona,
    KeckGraduateInstitute,
    ClaremontGraduateUniversity,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct ButtonRecordLog {
    pub log: Vec<ButtonRecord>,
    pub last_update: u64,
}

impl ButtonRecordLog {
    pub fn new() -> Self {
        ButtonRecordLog {
            log: Vec::new(),
            last_update: 0,
        }
    }

    pub fn add(&mut self, record: ButtonRecord) {
        self.last_update = record.timestamp;
        self.log.push(record);
    }

    pub fn get_last_update(&self) -> u64 {
        self.last_update
    }

    pub fn get_log(&self) -> &Vec<ButtonRecord> {
        &self.log
    }

    pub fn get_log_mut(&mut self) -> &mut Vec<ButtonRecord> {
        &mut self.log
    }

    pub fn get_log_by_timerange(&self, start: u64, end: u64) -> Vec<ButtonRecord> {
        self.log
            .iter()
            .filter(|r| r.timestamp >= start && r.timestamp <= end)
            .cloned()
            .collect()
    }

    pub fn make_csv(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut wtr = csv::Writer::from_path("button_log.csv")?;
        for record in &self.log {
            wtr.write_record(&[
                format!("{}", &record.timestamp),
                record.station_id.clone(),
                format!("{:?}", &record.college),
            ])?;
        }
        Ok(())
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct ButtonRecord {
    pub college: College,
    pub timestamp: u64,
    pub station_id: String,
    pub length_milliseconds: u64,
}
