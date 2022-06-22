use std::time::SystemTime;
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct StudentStorage {
    pub slots: Vec<Slot>,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct Slot {
    pub id: String,
    pub occupied: bool,
    pub occupied_details: Option<OccupiedDetails>,
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct OccupiedDetails {
    pub user_id: String,
    pub timestamp_start: u64,
    pub timestamp_end: u64,
}

impl OccupiedDetails {
    pub fn new(user_id: String, length_of_checkout: u64) -> Self {
        let timestamp_start = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let timestamp_end = timestamp_start + length_of_checkout;
        
        OccupiedDetails {
            user_id,
            timestamp_start,
            timestamp_end,
        }
    }

    pub fn is_overdue(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        now > self.timestamp_end
    }

    pub fn get_length_of_checkout(&self) -> u64 {
        self.timestamp_end - self.timestamp_start
    }

    pub fn extend_checkout(&mut self, length_of_checkout: u64) {
        self.timestamp_end += length_of_checkout;
    }
}