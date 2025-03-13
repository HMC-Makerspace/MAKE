import { UUID } from "common/global";
import { FILE_RESOURCE_TYPE, TFile } from "common/file";
import { File } from "models/file.model";
import mongoose from "mongoose";
import fs from "fs/promises";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { User } from "models/user.model";
import { Area } from "models/area.model";
import { Workshop } from "models/workshop.model";
import { Machine } from "models/machine.model";

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
 * Get all files related to a specific resource. This could be all uploads for
 * a specific user, or all images for a specific area, machine, or workshop
 * @param resource_uuid The UUID of the workshop to search by
 * @param resource_type The type of resource to search by
 * @returns The list of TFile objects uploaded by the user
 */
export async function getFilesByResource(
    resource_uuid: UUID,
    resource_type: FILE_RESOURCE_TYPE,
): Promise<TFile[]> {
    const Files = mongoose.model("File", File);
    return Files.find({
        resource_type: resource_type,
        resource_uuid: resource_uuid,
    });
}

/**
 * Create a new file in the database. If a file with the same UUID already
 * exists, return null.
 * @param file_obj the complete file information
 * @returns The file object, or null if a file with the same UUID already exists
 * @throws An error if a file with the same UUID already exists, if the resource
 *     type is invalid, or if the resource UUID is invalid
 */
export async function createFile(file_obj: TFile): Promise<TFile | null> {
    const Files = mongoose.model("File", File);
    // Check if any file already exists by the given UUID
    const existingFile = await Files.exists({
        uuid: file_obj.uuid,
    });
    if (existingFile) {
        // If so, return null, and don't create a new file
        throw new Error("File already exists with the given UUID");
    }
    // If the file doesn't exist, create a new file
    const newFile = new Files(file_obj);
    // Save the file to the database
    await newFile.save();

    if (file_obj.resource_type === FILE_RESOURCE_TYPE.USER) {
        // If the file is a user file, add the file's UUID to the user's file list
        const Users = mongoose.model("User", User);
        const user = await Users.findOne({ uuid: file_obj.resource_uuid });
        // If the user doesn't exist, throw an error
        if (!user) {
            throw new Error("User not found");
        }
        // Add the file's UUID to the user's file list and save the user
        if (!user.files) {
            user.files = [];
        }
        user.files.push(file_obj.uuid);
        await user.save();
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.AREA) {
        // If the file is an area image, add the file's UUID to the area's image list
        const Areas = mongoose.model("Area", Area);
        const area = await Areas.findOne({ uuid: file_obj.resource_uuid });
        // If the area doesn't exist, throw an error
        if (!area) {
            throw new Error("Area not found");
        }
        // Add the file's UUID to the area's image list and save the area
        if (!area.images) {
            area.images = [];
        }
        area.images.push(file_obj.uuid);
        await area.save();
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.MACHINE) {
        // If the file is a machine image, add the file's UUID to the machine's image list
        const Machines = mongoose.model("Machine", Machine);
        const machine = await Machines.findOne({
            uuid: file_obj.resource_uuid,
        });
        // If the machine doesn't exist, throw an error
        if (!machine) {
            throw new Error("Machine not found");
        }
        // Add the file's UUID to the machine's image list and save the machine
        if (!machine.images) {
            machine.images = [];
        }
        machine.images.push(file_obj.uuid);
        await machine.save();
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.WORKSHOP) {
        // If the file is a workshop image, add the file's UUID to the workshop's image list
        const Workshops = mongoose.model("Workshop", Workshop);
        const workshop = await Workshops.findOne({
            uuid: file_obj.resource_uuid,
        });
        // If the workshop doesn't exist, throw an error
        if (!workshop) {
            throw new Error("Workshop not found");
        }
        // Add the file's UUID to the workshop's image list and save the workshop
        if (!workshop.images) {
            workshop.images = [];
        }
        workshop.images.push(file_obj.uuid);
        await workshop.save();
    } else {
        // If the resource type is invalid, throw an error
        throw new Error("Invalid resource type");
    }
    return newFile;
}

/**
 * A helper function to move a file from a temporary location to a target path,
 * effectively creating the file on the server. If there is an error, it will
 * be logged and rethrown to be caught by the caller.
 * @param temp_path The temporary path of the file to move
 * @param target_path The target path to move the file to
 * @param req The request object to log errors and info
 * @param res The response object to send errors to
 * @returns A promise to move the file, which can be chained
 */
export async function moveTempFileOnServer(
    temp_path: string,
    target_path: string,
    req: Request,
) {
    return fs
        .rename(temp_path, target_path) // Attempt to move the file
        .then(() => {
            // If the file was successfully moved, log accordingly
            req.log.debug({
                msg: `File at path ${temp_path} moved to ${target_path}`,
            });
        })
        .catch((err) => {
            // If there was an error moving the file, log the error and return
            // an error message
            req.log.error({
                msg: `Error saving file from ${temp_path} to ${target_path}`,
                error: err,
            });
            throw err; // Rethrow the error so it can be caught by the caller
        });
}

/**
 * A helper function to delete/unlink a file from the server
 * @param file_path The path to the file to delete
 * @param req The request object to log errors and info
 * @param res The response object to send errors to
 * @param unauthorized_creation Whether the user was authorized to create
 *     the file. If not, the error message will be different
 * @returns The promise to unlink the file, which can be chained
 */
export async function deleteFileOnServer(
    file_path: string,
    req: Request,
    res: Response,
    unauthorized_creation: boolean = false,
) {
    return fs
        .unlink(file_path) // Attempt to delete the file
        .then(() => {
            // If the file was successfully deleted, log accordingly
            if (unauthorized_creation) {
                req.log.info({
                    msg: "Unlinked forbidden file",
                    file_path: file_path,
                });
            } else {
                req.log.debug({ msg: `File at path ${file_path} deleted` });
            }
            res.status(StatusCodes.ACCEPTED).json({
                error: "Successfully deleted file",
            });
        })
        .catch((err) => {
            // If there was an error unlinking the file, and the user was not
            // authorized to create the file, return a distinct error
            if (unauthorized_creation) {
                //
                req.log.fatal({
                    msg:
                        "Requesting user was not authorized to create a file, " +
                        "and there was an error unlinking the provided file",
                    file_path: file_path,
                    error: err,
                });
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error:
                        "The requesting user is not authorized to create a " +
                        "file, and there was an error unlinking the " +
                        "provided file. If you are seeing this error, " +
                        "please contact a site administrator.",
                });
            } else {
                // Otherwise, if the user was authorized to delete the file, log
                // the error and return a generic error message
                req.log.error({
                    msg: `Error deleting file at ${file_path}`,
                    error: err,
                });
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: "Error deleting file",
                });
            }
            return Promise.reject(err); // Return a rejected promise to stop the chain
        }); // Return the promise so more .then chains can be added
}

/**
 * Delete a file in the database by UUID
 * @param file_uuid the specific file's unique id
 * @returns The deleted file object, or null if the file doesn't exist
 */
export async function deleteFile(file_uuid: UUID): Promise<TFile | null> {
    const Files = mongoose.model("File", File);
    // If the file exists, return it and delete it
    const file = await Files.findOneAndDelete({ uuid: file_uuid });
    if (!file) {
        return null;
    }
    // If the file exists, remove the file's UUID from the resource's list
    if (file.resource_type === FILE_RESOURCE_TYPE.USER) {
        // If the file is a user file, remove the file's UUID from the user's file list
        const Users = mongoose.model("User", User);
        const user = await Users.findOne({ uuid: file.resource_uuid });
        // If the user doesn't exist, throw an error
        if (!user) {
            throw new Error("User not found");
        }
        // Remove the file's UUID from the user's file list and save the user
        user.files = user.files!.filter((file_uuid) => file_uuid !== file.uuid);
        await user.save();
    } else if (file.resource_type === FILE_RESOURCE_TYPE.AREA) {
        // If the file is an area image, remove the file's UUID from the area's image list
        const Areas = mongoose.model("Area", Area);
        const area = await Areas.findOne({ uuid: file.resource_uuid });
        // If the area doesn't exist, throw an error
        if (!area) {
            throw new Error("Area not found");
        }
        // Remove the file's UUID from the area's image list and save the area
        area.images = area.images!.filter(
            (file_uuid) => file_uuid !== file.uuid,
        );
        await area.save();
    } else if (file.resource_type === FILE_RESOURCE_TYPE.MACHINE) {
        // If the file is a machine image, remove the file's UUID from the machine's image list
        const Machines = mongoose.model("Machine", Machine);
        const machine = await Machines.findOne({
            uuid: file.resource_uuid,
        });
        // If the machine doesn't exist, throw an error
        if (!machine) {
            throw new Error("Machine not found");
        }
        // Remove the file's UUID from the machine's image list and save the machine
        machine.images = machine.images!.filter(
            (file_uuid) => file_uuid !== file.uuid,
        );
        await machine.save();
    } else if (file.resource_type === FILE_RESOURCE_TYPE.WORKSHOP) {
        // If the file is a workshop image, remove the file's UUID from the workshop's image list
        const Workshops = mongoose.model("Workshop", Workshop);
        const workshop = await Workshops.findOne({
            uuid: file.resource_uuid,
        });
        // If the workshop doesn't exist, throw an error
        if (!workshop) {
            throw new Error("Workshop not found");
        }
        // Remove the file's UUID from the workshop's image list and save the workshop
        workshop.images = workshop.images!.filter(
            (file_uuid) => file_uuid !== file.uuid,
        );
        await workshop.save();
    }
    return file;
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
