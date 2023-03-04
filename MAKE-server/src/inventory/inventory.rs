use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

use crate::{
    inventory::checkout::CheckoutLogEntry, management::emails::send_individual_email,
    EMAIL_TEMPLATES, MAKERSPACE_MANAGER_EMAIL, MEMORY_DATABASE,
};

const INVENTORY_URL: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzvLVGN2H5mFpQLpstQyT5kgEu1CI8qlhY60j78mO0LQgDnTHs_ZKx39xiIO1h-w09ZXyOZ5GqOf5q/pub?gid=0&single=true&output=csv";

/// The state of the inventory.
/// Contains the timestamp of the last update and the inventory.
#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct Inventory {
    pub last_updated: u64,
    pub items: Vec<InventoryItem>,
    pub needs_restock: Vec<RestockNotice>,
    pub sent_restock_notice: bool,
}

impl Inventory {
    pub fn new() -> Self {
        Inventory {
            last_updated: 0,
            items: Vec::new(),
            needs_restock: Vec::new(),
            sent_restock_notice: false,
        }
    }

    pub async fn update(&mut self) -> Result<(), reqwest::Error> {
        // Get time as unix timestamp
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        let response = reqwest::get(INVENTORY_URL).await;

        if let Ok(response) = response {
            let data = response.text().await.expect("Failed to read inventory");

            // Fetch csv file
            let rdr = csv::Reader::from_reader(data.as_bytes());

            // Parse csv file
            let mut items = Vec::new();

            let mut kits: Vec<String> = Vec::new();

            for result in rdr.into_records() {
                if let Ok(result) = result {
                    // Create new item
                    let item = InventoryItem::new_from_line(
                        result.iter().map(|x| x.to_string()).collect(),
                    );

                    if item.kit.is_some() {
                        kits.push(item.clone().kit.unwrap());
                    }

                    items.push(item);
                }
            }

            // Add is_kit to kits
            for kit_name in kits {
                let pos = items.iter().position(|x| x.name == kit_name);

                let kit_items = items
                    .iter()
                    .filter(|x| x.kit == Some(kit_name.clone()) && x.name != kit_name)
                    .map(|x| x.name.clone())
                    .collect::<Vec<String>>();

                if let Some(pos) = pos {
                    items[pos].is_kit = true;
                    items[pos].kit_items = kit_items;
                } else {
                    warn!("Kit \"{}\" not found in inventory", kit_name);
                }
            }

            // If everything is ok, update timestamp and items
            self.last_updated = now;
            self.items = items;

            Ok(())
        } else {
            Err(response.unwrap_err())
        }
    }

    pub fn get_item_by_name(&self, name: &str) -> Option<InventoryItem> {
        self.items.iter().find(|item| item.name == name).cloned()
    }

    pub fn get_item_by_uuid(&self, uuid: &str) -> Option<InventoryItem> {
        self.items
            .iter()
            .find(|item| item.uuids.contains(&uuid.to_string()))
            .cloned()
    }

    pub fn update_item(&mut self, item: InventoryItem) {
        let pos = self.items.iter().position(|x| x.name == item.name);
        if let Some(pos) = pos {
            self.items[pos] = item;
        } else {
            self.items.push(item);
        }
    }

    pub fn update_from_checkouts(&mut self, checkouts: &Vec<CheckoutLogEntry>) {
        self.items = self
            .items
            .iter_mut()
            .map(|item| {
                let mut item = item.clone();
                item.checked_quantity = checkouts
                    .iter()
                    .filter(|x| x.items.contains(&item.name))
                    .count() as u64;
                item
            })
            .collect();
    }

    pub fn add_restock_notice(&mut self, notice: RestockNotice) {
        self.needs_restock.push(notice);
    }

    pub async fn send_restock_notice(&mut self) {
        self.sent_restock_notice = true;

        let users = MEMORY_DATABASE.lock().await.users.clone();

        let steward_items: Vec<String> = self.needs_restock
            .iter_mut()
            .filter(|x| x.notified == false && x.authorized == true)
            .map(|x| {
                x.notified = true;

                format!(
                    "<tr style=\"border: 1px solid black; border-collapse: collapse;\">
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{} (Steward)</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td> 
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                    </tr>",
                    x.name, x.current_quantity, x.requested_quantity, x.notes, x.email
                )
            })
            .collect();

        let user_items: Vec<String> = self.needs_restock
            .iter_mut()
            .filter(|x| x.notified == false && x.authorized == false)
            .map(|x| {
                x.notified = true;

                // Figure out if user email is in database
                let user = users.get_user_by_email(&x.email);

                let name = if let Some(user) = user {
                    format!("{} ({:?})", x.name, user.get_auth_level())
                } else {
                    format!("{} (User)", x.name)
                };


                format!(
                    "<tr style=\"border: 1px solid black; border-collapse: collapse;\">
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td> 
                        <td style=\"border: 1px solid black; border-collapse: collapse; padding: 5px;\">{}</td>
                    </tr>",
                    name, x.current_quantity, x.requested_quantity, x.notes, x.email
                )
            })
            .collect();

        let items = steward_items
            .iter()
            .map(|x| x.clone())
            .chain(user_items.iter().map(|x| x.clone()))
            .collect::<Vec<String>>();

            
        if items.len() == 0 {
            return;
        } else {
            info!("Sending restock notice email");

            let _ = send_individual_email(
                MAKERSPACE_MANAGER_EMAIL.to_string(),
                Some(vec!["evazquez@g.hmc.edu".to_string()]),
                "Restock Notice".to_string(),
                EMAIL_TEMPLATES
                    .lock()
                    .await
                    .get_restock_notice(&items.join("\n")),
            )
            .await;

            info!("Sent!");
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct InventoryItem {
    pub name: String,
    pub is_material: bool,
    pub is_tool: bool,
    pub checked_quantity: u64,
    pub quantity: i64, // -1 is low, -2 is medium, -3 is high
    pub location_room: String,
    pub location_area: String,
    pub reorder_url: String,
    pub specific_name: String,
    pub serial_number: String,
    pub brand: String,
    pub model_number: String,
    pub uuids: Vec<String>,
    pub is_kit: bool,
    pub kit: Option<String>,
    pub kit_items: Vec<String>,
}

impl InventoryItem {
    pub fn new_from_line(line: Vec<String>) -> Self {
        InventoryItem {
            name: line[0].clone(),
            is_material: line[1] == "M",
            is_tool: line[1] == "T",
            checked_quantity: 0,
            quantity: {
                if line[2] == "Low" {
                    -1
                } else if line[2] == "Medium" {
                    -2
                } else if line[2] == "High" {
                    -3
                } else {
                    line[2].parse::<i64>().unwrap_or(0)
                }
            },
            location_room: line[3].clone(),
            location_area: line[4].clone(),
            reorder_url: line[5].clone(),
            specific_name: line[6].clone(),
            serial_number: line[7].clone(),
            brand: line[8].clone(),
            model_number: line[9].clone(),
            uuids: line[10]
                .split(&[',', '\n'][..])
                .map(|x| x.to_string())
                .collect::<Vec<String>>(),
            kit: {
                let trimmed = line[11].trim();
                if trimmed.len() > 0 {
                    Some(trimmed.to_string())
                } else {
                    None
                }
            },
            is_kit: false,
            kit_items: Vec::new(),
        }
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct RestockNotice {
    pub name: String,
    pub current_quantity: String,
    pub requested_quantity: String,
    pub notes: String,
    pub notified: bool,
    pub email: String,
    pub authorized: bool,
}
