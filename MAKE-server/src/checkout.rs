#![feature(is_some_with)]

use crate::*;
use std::time::SystemTime;

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct CheckoutLog {
    pub currently_checked_out: Vec<CheckoutLogEntry>,
    pub checkout_history: Vec<CheckoutLogEntry>,
}

impl CheckoutLog {
    pub fn add_checkout(&mut self, entry: CheckoutLogEntry) {
        info!("Adding checkout entry: {:?}", entry);
        self.currently_checked_out.push(entry);
    }

    pub fn check_in_by_name(&mut self, name: String) {
        info!("Checking in: {:?}", name);
        let mut found = false;
        for entry in self.currently_checked_out.iter_mut() {
            if entry.item_name == name {
                found = true;
                entry.checked_in = true;
                entry.timestamp_checked_in = Some(
                    SystemTime::now()
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .expect("Time went backwards")
                        .as_secs(),
                );
            }
        }
        if !found {
            warn!("Could not find checkout entry for: {:?}", name);
        }
    }

    pub fn check_in_by_uuid(&mut self, uuid: String) {
        info!("Checking in: {:?}", uuid);
        let mut found = false;
        for entry in self.currently_checked_out.iter_mut() {
            if entry.item_uuid.is_some() {
                if entry.item_uuid.clone().unwrap() == uuid {
                    found = true;
                    entry.checked_in = true;
                    entry.timestamp_checked_in = Some(
                        SystemTime::now()
                            .duration_since(SystemTime::UNIX_EPOCH)
                            .expect("Time went backwards")
                            .as_secs(),
                    );
                }
            }
        }
        if !found {
            warn!("Could not find checkout entry for: {:?}", uuid);
        }
    }
}

#[derive(Default, Deserialize, Serialize, Clone, Debug)]
pub struct CheckoutLogEntry {
    pub college_id: u64,
    pub item_name: String,
    pub item_uuid: Option<String>,
    pub checked_in: bool,
    pub timestamp_checked: u64,
    pub timestamp_expires: u64,
    pub timestamp_checked_in: Option<u64>,
}

impl CheckoutLogEntry {
    pub fn new(
        user: &User,
        item: &InventoryItem,
        uuid: Option<String>,
        timestamp_expires: u64,
    ) -> Self {
        CheckoutLogEntry {
            college_id: user.get_id(),
            item_name: item.name.clone(),
            item_uuid: uuid,
            checked_in: false,
            timestamp_checked: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
            timestamp_expires,
            timestamp_checked_in: None,
        }
    }
}
