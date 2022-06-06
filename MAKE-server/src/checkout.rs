use crate::*;
use std::time::SystemTime;

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct CheckoutLog {
    pub log: Vec<CheckoutLogEntry>,
}

impl CheckoutLog {
    pub fn add_checkout(&mut self, entry: CheckoutLogEntry) {
        info!("Adding checkout entry: {:?}", entry);
        self.log.push(entry);
    }
}

#[derive(Default, Deserialize, Serialize, Clone, Debug)]
pub struct CheckoutLogEntry {
    pub user_id: u64,
    pub timestamp: u64,
    pub item_name: String,
    pub item_uuid: String,
    pub checked_in: bool,
}

impl CheckoutLogEntry {
    pub fn new(user: &User, item: &InventoryItem) -> Self {
        CheckoutLogEntry {
            user_id: user.get_id(),
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
            item_name: item.name.clone(),
            item_uuid: item.uuid.clone(),
            checked_in: false,
        }
    }
}