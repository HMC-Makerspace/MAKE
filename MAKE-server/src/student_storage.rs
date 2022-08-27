use std::{time::SystemTime};
use serde::{Deserialize, Serialize};
use toml::Value;

use crate::users::User;
use crate::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StudentStorage {
    pub slots: Vec<Slot>,
}

impl StudentStorage {
    pub fn new() -> Self {
        StudentStorage {
            slots: Vec::new(),
        }
    }

    pub fn new_defined() -> Self {
        let mut file = std::fs::File::open("student_storage.toml").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        let storage_rows: Value = toml::from_str(&contents).unwrap();
        let storage_rows: Vec<(String, i64)> = storage_rows
            .get("sizings")
            .unwrap()
            .as_table()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.to_string(), v.as_integer().unwrap()))
            .collect();
        
        let mut slots = Vec::new();
        for (name, size) in storage_rows {
            for i in 0..size {
                slots.push(Slot::new(format!("{}{}", name, i+1)));
            }
        }

        StudentStorage {
            slots,
        }
    }

    pub fn needs_update(&self) -> bool {
        let new = StudentStorage::new_defined();

        new.slots.len() != self.slots.len() ||
            new.slots.iter().enumerate().any(|(i, s)| s.id != self.slots[i].id)
    }

    pub fn view_for_id(&self, college_id: &u64) -> Self {
        let mut slots = Vec::new();

        for slot in self.slots.iter() {
            if slot.is_owner(college_id) {
                slots.push(slot.clone());
            } else {
                slots.push(slot.clone().censor());
            }
        }

        StudentStorage {
            slots,
        }
    }

    pub fn view_for_user(&self, user: &User) -> Self {
        self.view_for_id(&user.get_id())
    }

    pub fn renew_by_id(&mut self, college_id: &u64, slot_id: &String) -> Result<(), String>  {
        for slot in self.slots.iter_mut() {
            if slot.is_owner(college_id) && slot.get_id() == slot_id {
                return slot.renew();
            }
        }

        Err(format!("No slot found with id {}", slot_id))
    }

    pub fn checkout_slot_by_id(&mut self, college_id: &u64, slot_id: &String) -> bool {
        for slot in self.slots.iter_mut() {
            if slot.get_id() == slot_id {
                slot.checkout(*college_id);
                return true;
            }
        }
        false
    }

    pub fn release_by_id(&mut self, college_id: &u64, slot_id: &String) {
        for slot in self.slots.iter_mut() {
            if slot.get_id() == slot_id {
                slot.release(*college_id);
            }
        }
    }
}

impl Default for StudentStorage {
    fn default() -> Self {
        StudentStorage::new_defined()
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct Slot {
    pub id: String,
    pub occupied: bool,
    pub occupied_details: Option<OccupiedDetails>,
}

impl Slot {
    pub fn new(id: String) -> Self {
        Slot {
            id,
            occupied: false,
            occupied_details: None,
        }
    }

    pub fn checkout(&mut self, college_id: u64) {
        self.occupied = true;
        self.occupied_details = Some(OccupiedDetails::new(college_id, INITIAL_CHECKOUT_PERIOD));
    }

    pub fn censor(&self) -> Self {
        let details = self.get_details();
        
        if let Some(details) = details {
            Slot {
                id: self.id.clone(),
                occupied: self.is_occupied(),
                occupied_details: Some(details.censor()),
            }
        } else {
            Slot {
                id: self.id.clone(),
                occupied: self.is_occupied(),
                occupied_details: None,
            }
        }        
    }

    pub fn is_occupied(&self) -> bool {
        self.occupied
    }

    pub fn get_details(&self) -> Option<OccupiedDetails> {
        self.occupied_details.clone()
    }

    pub fn is_owner(&self, id: &u64) -> bool {
        if let Some(details) = &self.occupied_details {
            details.college_id == *id
        } else {
            false
        }
    }

    pub fn get_id(&self) -> &String {
        &self.id
    }

    pub fn renew(&mut self) -> Result<(), String> {
        if let Some(details) = &self.occupied_details {
            let mut details = details.clone();

            let r = details.renew();

            self.occupied_details = Some(details);

            r
        } else {
            Err(format!("No slot found with id {}", self.id))
        }
    }

    pub fn release(&mut self, college_id: u64) {
        if let Some(details) = &self.occupied_details {
            if details.college_id == college_id {
                self.occupied = false;
                self.occupied_details = None;
            }
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct OccupiedDetails {
    pub college_id: u64,
    pub timestamp_start: u64,
    pub timestamp_end: u64,
    pub renewals_left: u64,
}

impl OccupiedDetails {
    pub fn new(college_id: u64, length_of_checkout: u64) -> Self {
        let timestamp_start = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        
        let timestamp_end = timestamp_start + length_of_checkout;
        
        OccupiedDetails {
            college_id,
            timestamp_start,
            timestamp_end,
            renewals_left: RENEWALS_ALLOWED,
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

    pub fn set_timestamp_end(&mut self, timestamp_end: u64) {
        self.timestamp_end = timestamp_end;
    }

    pub fn censor(&self) -> Self {
        OccupiedDetails {
            college_id: 0,
            timestamp_start: self.timestamp_start,
            timestamp_end: self.timestamp_end,
            renewals_left: 0,
        }
    }

    pub fn renew(&mut self) -> Result<(), String> {
        // Extend checkout length by RENEW_LENGTH from now
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        if self.renewals_left <= 0 {
            return Err(format!("No renewals left"));
        }

        // Allow a 24 hour renewal period
        if self.timestamp_end < now + 24 * 60 * 60 {
            self.timestamp_end = now + RENEW_LENGTH;
            self.renewals_left -= 1;
            Ok(())
        } else {
            Err(format!("Cannot renew slot until expiry date"))
        }
    }
}
