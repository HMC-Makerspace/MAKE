import mongoose from "mongoose";
import type { TIPLog, TPrinterLog, TRedirect } from "common/log";

/**
 * See {@link TIPLog} documentation for type information.
 */
export const IPLog = new mongoose.Schema<TIPLog>({
    uuid: { type: String, required: true },
    ip: { type: String, required: true },
    timestamp: { type: Number, required: true },
    request: { type: mongoose.Schema.Types.Map, required: true },
});

/**
 * See {@link TRedirect} documentation for type information.
 */
export const Redirect = new mongoose.Schema<TRedirect>({
    uuid: { type: String, required: true },
    path: { type: String, required: true },
    redirect: { type: String, required: true },
    logs: { type: [IPLog], required: true },
});

/**
 * See {@link TPrinterLog} documentation for type information.
 */
export const PrinterLog = new mongoose.Schema<TPrinterLog>({
    uuid: { type: String, required: true },
    printer_name: { type: String, required: true },
    printer_online: { type: Boolean, required: true },
    printer_json: { type: mongoose.Schema.Types.Map, required: true },
});
