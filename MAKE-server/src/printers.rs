use serde::{Deserialize, Serialize};


#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Printers {
    printers: Vec<Printer>,
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Printer {
    name: String,
}