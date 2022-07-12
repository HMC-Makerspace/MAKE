#![feature(is_some_with)]

use uuid::Uuid;

use crate::*;
use std::time::SystemTime;

/// Struct that handles the checkout process.
/// 
/// Contains two fields:
/// - `currently_checked_out`: A list of the items that are currently checked out.
/// - `checkout_history`: A list of the items that have been checked out, but were returned.
/// 
/// You can call the various methods on this struct to check out and return items.
#[derive(Default, Deserialize, Serialize, Clone)]
pub struct CheckoutLog {
    /// Currently checked out items.
    pub currently_checked_out: Vec<CheckoutLogEntry>,
    /// History of checked out items.
    pub checkout_history: Vec<CheckoutLogEntry>,
}

impl CheckoutLog {
    /// Adds an item to the checkout log.
    /// Takes a completed CheckoutLogEntry struct.
    /// 
    /// Should only be called by the checkout kiosk
    pub fn add_checkout(&mut self, entry: CheckoutLogEntry) {
        info!("Adding checkout entry: {:?}", entry);
        self.currently_checked_out.push(entry);
    }

    /// Given the UUID of the checkout entry, check back in the item(s).
    /// 
    /// Should only be called by the checkout kiosk
    pub fn check_in(&mut self, checkout_uuid: String) {
        info!("Checking in checkout entry: {:?}", checkout_uuid);
        let mut index = 0;
        for entry in self.currently_checked_out.iter() {
            if entry.checkout_uuid == checkout_uuid {
                self.checkout_history.push(entry.clone());
                self.currently_checked_out.remove(index);
                break;
            }
            index += 1;
        }

        if index == self.currently_checked_out.len() {
            error!("Could not find checkout entry with UUID: {:?}", checkout_uuid);
        }
    }
}

/// Struct that contains information about a single checkout transaction
/// 
/// Contains the following fields:
/// - `college_id`: the ID of the user
/// - `checkout_uuid`: A UUID that identifies the transaction.
/// - `items`: A list of the items that were checked out.
/// - `checked_in`: Whether or not the items have been checked in.
/// - `timestamp_checked_out`: The time the items were checked out.
/// - `timestamp_checked_in`: The time the items were checked in.
/// - `timestamp_expires`: The time that the checkout will expire at, if not checked in.
/// This triggers an email notification to the user, which will repeat every 24 hours.
#[derive(Default, Deserialize, Serialize, Clone, Debug)]
pub struct CheckoutLogEntry {
    pub college_id: u64,
    pub checkout_uuid: String,
    pub items: Vec<String>,
    pub checked_in: bool,
    pub timestamp_checked_out: u64,
    pub timestamp_expires: u64,
    pub timestamp_checked_in: Option<u64>,
    pub num_time_notified: u64,
}

impl CheckoutLogEntry {
    pub fn new(college_id: u64, length: u64, items: Vec<String>) -> Self {
        let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();
        let expires = now + length;
        let checkout_uuid = Uuid::new_v4().to_string();
        CheckoutLogEntry {
            college_id,
            checkout_uuid,
            items,
            checked_in: false,
            timestamp_checked_out: now,
            timestamp_expires: expires,
            timestamp_checked_in: None,
            num_time_notified: 0,
        }
    }
}
