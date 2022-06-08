use serde::{Deserialize, Serialize};
use std::{collections::HashMap, time::SystemTime};

#[derive(Deserialize, Serialize, Clone)]
pub enum PrinterStatus {
    Idle,
    Printing,
    Offline,
    FilamentRunout,
    Error,
}

impl Default for PrinterStatus {
    fn default() -> Self {
        PrinterStatus::Idle
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Printers {
    printers: HashMap<String, Printer>,
    print_log: Vec<PrintLogEntry>,
}

impl Printers {
    pub fn new() -> Self {
        Printers {
            printers: HashMap::new(),
            print_log: Vec::new(),
        }
    }

    pub fn get_printer_by_id(&self, id: &str) -> Option<Printer> {
        self.printers.get(id).cloned()
    }

    pub fn add_set_printer(&mut self, printer: Printer) {
        self.printers.insert(printer.id.clone(), printer);
    }

    pub fn exists(&self, id: &str) -> bool {
        self.printers.contains_key(id)
    }

    pub fn add_log(&mut self, entry: PrintLogEntry) {
        self.print_log.push(entry);
    }

    pub fn create_add_log(&mut self, printer_id: String, college_id_number: u64) {
        let entry = PrintLogEntry {
            printer_id,
            college_id_number,
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
        };

        self.add_log(entry);
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct PrintLogEntry {
    pub timestamp: u64,
    pub printer_id: String,
    pub college_id_number: u64,
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Printer {
    name: String,
    id: String,
    status: PrinterStatus,
    last_updated: u64,
    current_time_left: u64,
}

impl Printer {
    pub fn new(name: &str, id: &str) -> Self {
        Printer {
            name: name.to_string(),
            id: id.to_string(),
            status: PrinterStatus::default(),
            last_updated: 0,
            current_time_left: 0,
        }
    }

    pub fn get_name(&self) -> &str {
        &self.name
    }

    pub fn set_status(&mut self, status: PrinterStatus) {
        self.status = status;
        self.last_updated = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
    }

    pub fn get_status(&self) -> PrinterStatus {
        self.status.clone()
    }

    pub fn set_time_left(&mut self, time_left: u64) {
        self.current_time_left = time_left;
    }
}