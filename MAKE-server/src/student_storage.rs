use std::{time::SystemTime};
use serde::{Deserialize, Serialize};

use crate::users::User;


// Initial checkout period of 1 month
const INITIAL_CHECKOUT_PERIOD: u64 = 30 * 24 * 60 * 60;
// Renew period of 2 weeks
const RENEW_LENGTH: u64 = 2 * 7 * 24 * 60 * 60;
// Number of renewals allowed
const RENEWALS_ALLOWED: u64 = 2;

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
        let levels_16 = ['A', 'B', 'C', 'D'];
        let levels_4 = ['E', 'F', 'G', 'H'];

        let mut slots = Vec::new();

        for level in levels_16 {
            for i in 1..17 {
                slots.push(Slot::new(format!("{}{}", level, i)));
            }
        }

        for level in levels_4 {
            for i in 1..5 {
                slots.push(Slot::new(format!("{level}{i}")));
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

    pub fn renew(&mut self) {
        // Extend checkout length by RENEW_LENGTH from now
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        if self.timestamp_end < now {
            self.timestamp_end = now + RENEW_LENGTH;
            self.renewals_left -= 1;
        }
    }
}
