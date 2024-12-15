/**
 * Printerlog - Object to store information about the IP logs
 * @property uuid - the unique identifier for the Printer log
 * @property printer_name - the name of the printer being logged
 * @property printer_online - if the printer is or isn't online
 * @property printer_json - a dictionary of the printer log
 */
export type TPrinterlog = {
    uuid: UUID;
    printer_name: string;
    printer_online: Boolean;
    printer_json?: {
        [key: string]: any;
    };
};