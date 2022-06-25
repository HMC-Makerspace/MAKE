use std::{time::SystemTime, io::ErrorKind};
use serde::{Deserialize, Serialize};

use crate::users::User;

// Renew period of 2 weeks
const RENEW_LENGTH: u64 = 2 * 7 * 24 * 60 * 60;

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
        let levels = ['A', 'B', 'C', 'D'];
        let num_slots = 10;

        let mut slots = Vec::new();

        for level in levels.iter() {
            for i in 0..num_slots {
                slots.push(Slot::new(format!("{}{}", level, i)));
            }
        }

        StudentStorage {
            slots,
        }
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

    pub fn renew_by_id(&mut self, college_id: &u64, slot_id: &String) {
        for slot in self.slots.iter_mut() {
            if slot.is_owner(college_id) && slot.get_id() == slot_id {
                slot.renew();
            }
        }
    }

    pub fn checkout_slot_by_id(&mut self, college_id: &u64, slot_id: &String) -> bool {
        for slot in self.slots.iter_mut() {
            if slot.get_id() == slot_id {
                slot.checkout(college_id.clone());
                return true;
            }
        }
        false
    }

    pub fn release_by_id(&mut self, college_id: &u64, slot_id: &String) {
        for slot in self.slots.iter_mut() {
            if slot.get_id() == slot_id {
                slot.release(college_id.clone());
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
        self.occupied_details = Some(OccupiedDetails::new(college_id, RENEW_LENGTH));
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
        return self.occupied_details.clone();
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

    pub fn renew(&mut self) {
        if let Some(details) = &self.occupied_details {
            let mut details = details.clone();

            details.renew();

            self.occupied_details = Some(details);
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

    pub fn censor(&self) -> Self {
        OccupiedDetails {
            college_id: 0,
            timestamp_start: self.timestamp_start,
            timestamp_end: self.timestamp_end,
        }
    }

    pub fn renew(&mut self) {
        self.extend_checkout(RENEW_LENGTH);
    }
}
