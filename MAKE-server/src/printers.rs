use log::info;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, time::SystemTime};

use crate::API_KEYS;

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookUpdate {
    id: String,
    api_key: String,
    topic: String,
    message: String,
    state: PrinterWebhookState,
    job: PrinterWebhookJob,
    progress: PrinterWebhookProgress,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookState {
    text: String,
    flags: PrinterWebhookStateFlags,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookStateFlags {
    operational: bool,
    printing: bool,
    cancelling: bool,
    pausing: bool,
    resuming: bool,
    finishing: bool,
    closedOrError: bool,
    error: bool,
    paused: bool,
    ready: bool,
    sdReady: bool,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookJob {
    file: PrinterWebhookJobFile,
    estimatedPrintTime: f64,
    averagePrintTime: f64,
    lastPrintTime: f64,
    user: String,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookJobFile {
    name: String,
    path: String,
    display: String,
    origin: String,
    size: u64,
    date: u64,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct PrinterWebhookProgress {
    completion: f64,
    filepos: u64,
    printTime: u64,
    printTimeLeft: u64,
    printTimeLeftOrigin: String,
}

#[derive(Deserialize, Serialize, Clone)]
pub enum PrinterStatus {
    Idle,
    Printing,
    Paused,
    Offline,
    Error,
}

impl Default for PrinterStatus {
    fn default() -> Self {
        PrinterStatus::Idle
    }
}

impl PrinterStatus {
    pub fn from_webhook(state: &PrinterWebhookState) -> Self {
        if state.flags.operational {
            if state.flags.printing {
                PrinterStatus::Printing
            } else if state.flags.paused {
                PrinterStatus::Paused
            } else if state.flags.error {
                PrinterStatus::Error
            } else {
                PrinterStatus::Idle
            }
        } else {
            PrinterStatus::Offline
        }
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

    pub async fn add_printer_status(&mut self, printer_webhook_update: PrinterWebhookUpdate) -> Result<(), String> {
        // Validate api key
        if printer_webhook_update.api_key != API_KEYS.lock().await.printers {
            return Err("Invalid API key".to_string());
        }

        let mut printer = self.get_printer_by_id(&printer_webhook_update.id).unwrap();

        info!("Updating printer {} status: {:?}", &printer.id, printer_webhook_update.message);

        printer.status = PrinterStatus::from_webhook(&printer_webhook_update.state);
        printer.last_updated = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        printer.current_time_left = printer_webhook_update.progress.printTimeLeft;

        self.add_set_printer(printer);

        Ok(())
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