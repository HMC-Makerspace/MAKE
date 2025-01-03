import { UUID } from "common/global";
import { TFile } from "common/file";
import { File } from "models/file.model";
import mongoose from "mongoose";

/**
 * Get all files in the database
 * @returns A promise to list of TFile objects representing all files
 *      in the db
 */
export async function getFiles(): Promise<TFile[]> {
    const Files = mongoose.model("File", File);
    return Files.find();
}

/**
 * Get a specific file's information, searching by UUID
 * @param file_uuid The file's UUID to search by
 * @returns A promise to a TFile object, or null if no file has the given UUID
 */
export async function getFile(file_uuid: UUID) {
    const Files = mongoose.model("File", File);
    return Files.findOne({ uuid: file_uuid });
}

/**
 * Create a new file in the database. If a file with the same UUID already
 * exists, return null.
 * @param file_obj the complete file information
 * @returns The file object, or null if a file with the same UUID already exists
 */
export async function createFile(file_obj: TFile): Promise<TFile | null> {
    const Files = mongoose.model("File", File);
    // Check if the file already exists by UUID
    const existingFile = await Files.exists({
        uuid: file_obj.uuid,
    });
    if (existingFile) {
        // If so, return null, and don't create a new file
        return null;
    }
    // If the file doesn't exist, create a new file and return it
    const newFile = new Files(file_obj);
    return newFile.save();
}

/**
 * Delete a file in the database by UUID
 * @param file_uuid the specific file's unique id
 * @returns The deleted file object, or null if the file doesn't exist
 */
export async function deleteFile(file_uuid: UUID): Promise<TFile | null> {
    const Files = mongoose.model("File", File);
    // If the file exists, return it and delete it
    return Files.findOneAndDelete({ uuid: file_uuid });
}

/**
 * Update a file in the database, searching by UUID
 * @param file_obj the new file information
 * @returns The updated file object, or null if no file exists by the
 *      given UUID
 */
export async function updateFile(file_obj: TFile): Promise<TFile | null> {
    const Files = mongoose.model("File", File);
    // If the file exists, update it and return it
    return Files.findOneAndReplace({ uuid: file_obj.uuid }, file_obj, {
        returnDocument: "after",
    });
}
