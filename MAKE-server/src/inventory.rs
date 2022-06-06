use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use csv;

const INVENTORY_URL: &str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzvLVGN2H5mFpQLpstQyT5kgEu1CI8qlhY60j78mO0LQgDnTHs_ZKx39xiIO1h-w09ZXyOZ5GqOf5q/pub?gid=0&single=true&output=csv";

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct Inventory {
    pub last_updated: u64,
    pub items: Vec<InventoryItem>,
}

impl Inventory {
    pub fn new() -> Self {
        Inventory {
            last_updated: 0,
            items: Vec::new(),
        }
    }

    pub async fn update(&mut self) -> Result<(), reqwest::Error> {
        // Get time as unix timestamp
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        let response = reqwest::get(INVENTORY_URL)
            .await;

        if let Ok(mut response) = response {
            
            let data = response.text().await.expect("Failed to read inventory");

            // Fetch csv file
            let rdr = csv::Reader::from_reader(data.as_bytes());

            // Parse csv file
            let mut items = Vec::new();

            for result in rdr.into_records() {
                if let Ok(result) = result {
                    // Create new item
                    let item =
                        InventoryItem::new_from_line(result.iter().map(|x| x.to_string()).collect());

                    items.push(item);
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
        self.items.iter().find(|item| item.uuid == uuid).cloned()
    }
}

#[derive(Default, Debug, Serialize, Deserialize, Clone)]
pub struct InventoryItem {
    pub name: String,
    pub is_material: bool,
    pub is_tool: bool,
    pub quantity: i64, // -1 is low, -2 is medium, -3 is high
    pub location_room: String,
    pub location_area: String,
    pub reorder_url: String,
    pub specific_name: String,
    pub serial_number: String,
    pub brand: String,
    pub model_number: String,
    pub uuid: String,
}

impl InventoryItem {
    pub fn new_from_line(line: Vec<String>) -> Self {
        InventoryItem {
            name: line[0].clone(),
            is_material: line[1] == "M",
            is_tool: line[1] == "T",
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
            uuid: line[10].clone(),
        }
    }
}
