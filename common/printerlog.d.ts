import type { UUID } from "./global";

/**
 * PrinterLog - Object to store information about Bambu Printer logs
 * @property uuid - the unique identifier for the Printer log
 * @property printer_name - the name of the printer being logged
 * @property printer_online - if the printer is or isn't online
 * @property printer_json - a dictionary of the printer log
 * @see {@link https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md#pushingpushall | The OpenBambuAPI}
 * for information about `printer_json`
 */
export type TPrinterLog = {
    uuid: UUID;
    printer_name: string;
    printer_online: boolean;
    printer_json?: {
        [key: string]: any;
    };
};
