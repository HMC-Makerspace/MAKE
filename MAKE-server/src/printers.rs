use log::*;
use serde::{Deserialize, Serialize};
use std::io::Read;
use std::{collections::HashMap, time::SystemTime};
use toml::Value;

use crate::emails::send_individual_email;
use crate::{users::User, API_KEYS};
use crate::{EMAIL_TEMPLATES};

const PRINT_QUEUE_ENTRY_EXPIRATION_TIME: u64 = 60 * 15; // 15 minutes

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

#[derive(Deserialize, Serialize, Clone, PartialEq)]
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
    queue: Vec<PrintQueueEntry>,
    queue_log: Vec<PrintQueueEntry>,
}

impl Printers {
    pub fn new() -> Self {
        Printers {
            printers: HashMap::new(),
            print_log: Vec::new(),
            queue: Vec::new(),
            queue_log: Vec::new(),
        }
    }

    pub fn load_printers(&mut self) {
        // Open printers.toml
        let mut file = std::fs::File::open("printers.toml").unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        let printer_ids: Value = toml::from_str(&contents).unwrap();
        let printer_ids: Vec<String> = printer_ids
            .get("ids")
            .unwrap()
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        
        for printer_id in printer_ids {
            self.printers.insert(printer_id.clone(), Printer::new(&printer_id));
        }
    }

    pub fn get_printer_statuses(&self) -> Vec<Printer> {
        let mut printers: Vec<Printer> = self.printers
            .values().cloned()
            .collect();
        
        printers.sort_by(|a, b| a.id.cmp(&b.id));

        printers
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

    pub fn create_add_log(&mut self, printer_id: String, college_id: u64) {
        let entry = PrintLogEntry {
            printer_id,
            college_id,
            timestamp: SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
        };

        self.add_log(entry);
    }

    pub async fn add_printer_status(
        &mut self,
        printer_webhook_update: PrinterWebhookUpdate,
    ) -> Result<(), String> {
        // Validate api key
        if printer_webhook_update.api_key != API_KEYS.lock().await.printers {
            return Err("Invalid API key".to_string());
        }

        let mut printer = self.get_printer_by_id(&printer_webhook_update.id).unwrap();

        info!(
            "Updating printer {} status: {:?}",
            &printer.id, printer_webhook_update.message
        );

        printer.status = PrinterStatus::from_webhook(&printer_webhook_update.state);
        printer.last_updated = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();

        printer.current_time_left = printer_webhook_update.progress.printTimeLeft;

        self.add_set_printer(printer);

        Ok(())
    }

    pub fn add_user_to_queue(&mut self, user: &User) -> Result<(), String> {
        // Check if user is already in queue
        if self
            .queue
            .iter()
            .any(|entry| entry.college_id == user.get_id())
        {
            return Err("User is already in queue".to_string());
        }

        let queue_entry = user.create_print_queue_entry();

        self.queue.push(queue_entry);

        Ok(())
    }

    pub fn remove_user_from_queue(&mut self, user: &User) -> Result<(), String> {
        let queue_entry = self
            .queue
            .iter()
            .position(|entry| entry.college_id == user.get_id());

        if queue_entry.is_none() {
            Err("User is not in queue".to_string())
        } else {
            let queue_entry = queue_entry.unwrap();
            self.queue.remove(queue_entry);

            Ok(())
        }
    }

    pub async fn process_next_queue_entry(&mut self) {
        if self.queue.is_empty() {
            return;
        }

        let mut queue_entry = self.queue.remove(0);

        queue_entry.notify().await;

        self.queue_log.push(queue_entry);
    }

    pub fn get_available_printers(&self) -> Vec<Printer> {
        self.printers
            .values()
            .filter(|printer| printer.status == PrinterStatus::Idle)
            .cloned()
            .collect()
    }

    /// Push anyone who is
    ///
    /// - in the print queue
    /// - has been notified
    /// - has had 15 minutes since last notification
    /// - has NOT accepted
    ///
    /// OR
    ///
    /// - has accepted
    /// - has had 15 minutes since acceptance
    ///
    /// To the print log, removing them from the queue.
    pub fn cleanup_print_queue(&mut self) {
        self.queue = self
            .queue
            .iter()
            .filter(|queue_entry| {
                if (queue_entry.was_notified()
                    && !queue_entry.was_accepted()
                    && queue_entry.has_expired())
                    || (queue_entry.was_accepted() && queue_entry.has_expired())
                {
                    self.queue_log.push(queue_entry.clone().clone());
                    false
                } else {
                    true
                }
            }).cloned()
            .collect();
    }

    pub fn get_print_queue_length(&self) -> usize {
        self.queue.len()
    }

    pub fn get_queue_at(&self, index: usize) -> Option<PrintQueueEntry> {
        self.queue.get(index).cloned()
    }

    pub fn update_queue_at(&mut self, index: usize, queue_entry: PrintQueueEntry) {
        self.queue[index] = queue_entry;
    }

    pub fn get_queue_pos_for(&self, college_id: u64) -> Option<usize> {
        self.queue.iter().position(|entry| entry.college_id == college_id)
    }

    // tee hee
    pub fn move_queue_index(&mut self, from: usize, to: usize) {
        let queue_entry = self.queue.remove(from);
        self.queue.insert(to, queue_entry);
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct PrintQueueEntry {
    pub uuid: String,
    pub college_id: u64,
    pub email: String,
    pub timestamp_submitted: u64,
    pub timestamp_notified: Option<u64>,
    pub timestamp_accepted: Option<u64>,
}

impl PrintQueueEntry {
    /// Notify user that they have been added to the queue
    /// Email credentials should be stored in the api_keys.toml file
    /// Follow this link to get the credentials: https://support.google.com/accounts/answer/185833
    pub async fn notify(&mut self) {
        send_individual_email(
            self.email.clone(),
            None,
            "MAKE Print Notification".to_string(),
            EMAIL_TEMPLATES
                .lock()
                .await
                .get_print_queue(&self.uuid.clone()),
        )
        .await;

        self.timestamp_notified = Some(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
        );
    }

    pub fn accept(&mut self) {
        self.timestamp_accepted = Some(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs(),
        );
    }

    pub fn was_notified(&self) -> bool {
        self.timestamp_notified.is_some()
    }

    pub fn was_accepted(&self) -> bool {
        self.timestamp_accepted.is_some()
    }

    pub fn has_expired(&self) -> bool {
        if self.timestamp_accepted.is_some() {
            self.timestamp_accepted.unwrap() + PRINT_QUEUE_ENTRY_EXPIRATION_TIME
                < SystemTime::now()
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_secs()
        } else {
            self.timestamp_notified.is_some()
                && self.timestamp_notified.unwrap() + PRINT_QUEUE_ENTRY_EXPIRATION_TIME
                    < SystemTime::now()
                        .duration_since(SystemTime::UNIX_EPOCH)
                        .expect("Time went backwards")
                        .as_secs()
        }
    }
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct PrintLogEntry {
    pub timestamp: u64,
    pub printer_id: String,
    pub college_id: u64,
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Printer {
    id: String,
    status: PrinterStatus,
    last_updated: u64,
    current_time_left: u64,
}

impl Printer {
    pub fn new(id: &str) -> Self {
        Printer {
            id: id.to_string(),
            status: PrinterStatus::default(),
            last_updated: 0,
            current_time_left: 0,
        }
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
