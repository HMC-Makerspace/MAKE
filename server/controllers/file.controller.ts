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
import { Logger } from "pino";

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

        for (const user_resource_uuid of file_obj.resource_uuid) {
            const user = await Users.findOne({ uuid: user_resource_uuid });
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
        }
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.AREA) {
        // If the file is an area image, add the file's UUID to the area's image list
        const Areas = mongoose.model("Area", Area);

        for (const file_resource_uuid of file_obj.resource_uuid) {
            const area = await Areas.findOne({ uuid: file_resource_uuid });
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
        }
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.MACHINE) {
        // If the file is a machine image, add the file's UUID to the machine's image list
        const Machines = mongoose.model("Machine", Machine);

        for (const file_resource_uuid of file_obj.resource_uuid) {
            const machine = await Machines.findOne({
                uuid: file_resource_uuid,
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
        }
    } else if (file_obj.resource_type === FILE_RESOURCE_TYPE.WORKSHOP) {
        // If the file is a workshop image, add the file's UUID to the workshop's image list
        const Workshops = mongoose.model("Workshop", Workshop);

        for (const file_resource_uuid of file_obj.resource_uuid) {
            const workshop = await Workshops.findOne({
                uuid: file_resource_uuid,
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
        }
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
 * Remove a resource from an associated file in the database by UUID
 * @param file_uuid the specific file's unique id
 * @returns The deleted file object, or null if the file doesn't exist
 */
export async function removeResourceFromFile(
    file_uuid: UUID,
    resource_uuids: UUID[],
): Promise<TFile | null> {
    // find file by uuid
    const requested_file = await getFile(file_uuid);
    // if file doesn't exist, return null
    if (!requested_file) {
        return null;
    }


    // Remove the user from the resource_uuid list by filtering them out
    requested_file.resource_uuid = requested_file.resource_uuid.filter(
        (uuid) => !resource_uuids.includes(uuid),
    );

    for (const resource_uuid of resource_uuids) {

        // If the file exists, remove the file's UUID from the resource's list
        if (requested_file.resource_type === FILE_RESOURCE_TYPE.USER) {
            // If the file is a user file, remove the file's UUID from the user's file list
            const Users = mongoose.model("User", User);
            const user = await Users.findOne({ uuid: resource_uuid });
            // If the user doesn't exist, throw an error
            if (!user) {
                throw new Error("User not found");
            }
            // Remove the file's UUID from the user's file list and save the user
            user.files = (user.files ?? []).filter(
                (file_uuid) => file_uuid !== requested_file.uuid,
            );
            await user.save();
        } else if (requested_file.resource_type === FILE_RESOURCE_TYPE.AREA) {
            // If the file is an area image, remove the file's UUID from the area's image list
            const Areas = mongoose.model("Area", Area);
            const area = await Areas.findOne({ uuid: resource_uuid });
            // If the area doesn't exist, throw an error
            if (!area) {
                throw new Error("Area not found");
            }
            // Remove the file's UUID from the area's image list and save the area
            area.images = (area.images ?? []).filter(
                (file_uuid) => file_uuid !== requested_file.uuid,
            );
            await area.save();
        } else if (
            requested_file.resource_type === FILE_RESOURCE_TYPE.MACHINE
        ) {
            // If the file is a machine image, remove the file's UUID from the machine's image list
            const Machines = mongoose.model("Machine", Machine);
            const machine = await Machines.findOne({
                uuid: resource_uuid,
            });
            // If the machine doesn't exist, throw an error
            if (!machine) {
                throw new Error("Machine not found");
            }
            // Remove the file's UUID from the machine's image list and save the machine
            machine.images = (machine.images ?? []).filter(
                (file_uuid) => file_uuid !== requested_file.uuid,
            );
            await machine.save();
        } else if (
            requested_file.resource_type === FILE_RESOURCE_TYPE.WORKSHOP
        ) {
            // If the file is a workshop image, remove the file's UUID from the workshop's image list
            const Workshops = mongoose.model("Workshop", Workshop);
            const workshop = await Workshops.findOne({
                uuid: resource_uuid,
            });
            // If the workshop doesn't exist, throw an error
            if (!workshop) {
                throw new Error("Workshop not found");
            }
            // Remove the file's UUID from the workshop's image list and save the workshop
            workshop.images = (workshop.images ?? []).filter(
                (file_uuid) => file_uuid !== requested_file.uuid,
            );
            await workshop.save();
        }
    }

    return requested_file.save();
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
    error_message: string = "authorized",
) {
    return fs
        .exists(file_path) // Check that the file exists first
        .then(() =>
            fs
                .unlink(file_path) // Attempt to delete the file
                .then(() => {
                    // If the file was successfully deleted, log accordingly
                    if (error_message === "authorized") {
                        req.log.info({
                            msg: `Successfully deleted file`,
                            file_path: file_path,
                        });
                        return "Successfully deleted file";
                    } else {
                        req.log.info({
                            msg: `File successfully deleted: ${error_message}`,
                            file_path: file_path,
                        });
                        return error_message;
                    }
                })
                .catch((err) => {
                    // If there was an error unlinking the file, and the user was not
                    // authorized to create the file, return a distinct error
                    if (error_message === "authorized") {
                        // Otherwise, if the user was authorized to delete the file, log
                        // the error and return a generic error message
                        req.log.error({
                            msg: `Error deleting file at ${file_path}`,
                            error: err,
                        });
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                            error: "Error deleting file",
                        });
                    } else {
                        //
                        req.log.fatal({
                            msg:
                                "Requesting user was not authorized to create a file, " +
                                "and there was an error unlinking the provided file",
                            error_message: error_message,
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
                    }
                    return Promise.reject(err); // Return a rejected promise to stop the chain
                }),
        )
        .catch((err) => {
            // If the file does not exist, log an error.
            req.log.error({
                msg: `File not found: ${file_path}`,
                error: err,
            });
            res.status(StatusCodes.NOT_FOUND).json({
                error: "File not found",
            });
            return Promise.reject(err); // Return a rejected promise to stop the chain
        }); // Return the promise so more .then chains can be added
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
export async function deleteFilesOnServer(
    file_paths: string[],
    req: Request,
    res: Response,
    error_message: "authorized" | string = "authorized",
) {
    return Promise.all(
        file_paths.map((file_path) =>
            fs.unlink(file_path).then(() => file_path),
        ),
    )
        .then(() => {
            // All files deleted successfully
            if (error_message === "authorized") {
                req.log.info({
                    msg: `Successfully deleted files`,
                    file_paths: file_paths,
                });
                res.status(StatusCodes.ACCEPTED).json({
                    error: "Successfully deleted files",
                });
            } else {
                req.log.info({
                    msg: `File successfully deleted: ${error_message}`,
                    file_paths: file_paths,
                });
                res.status(StatusCodes.FORBIDDEN).json({
                    error: error_message,
                });
            }
        })
        .catch((err) => {
            // If there was an error unlinking any file, and the user was
            // authorized to create the file, return a distinct error
            if (error_message === "authorized") {
                // Otherwise, if the user was authorized to delete the file, log
                // the error and return a generic error message
                req.log.error({
                    msg: `Error deleting file`,
                    error: err,
                });
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: "Error deleting file",
                });
            } else {
                req.log.fatal({
                    msg:
                        "Requesting user was not authorized to create a file, " +
                        "and there was an error unlinking the provided file",
                    error_message: error_message,
                    file_paths: file_paths,
                    error: err,
                });
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error:
                        "The requesting user is not authorized to create a " +
                        "file, and there was an error unlinking the " +
                        "provided file. If you are seeing this error, " +
                        "please contact a site administrator.",
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

export async function clearExpiredFilesCron(logger: Logger) {
    logger.info("Cron: Clearing expired files.");
    const Files = mongoose.model("File", File);
    const now = Date.now() / 1000;

    // Find all files that have expired
    const expired_files = await Files.find({
        timestamp_expires: { $lte: now },
    });

    for (const file of expired_files) {
        // Delete the actual file on the server
        await fs.unlink(file.path).catch((err) =>
            logger.error({
                msg: `Unable to unlink file with uuid ${file.uuid} at path ${file.path}`,
                err: err,
            }),
        );
        // Delete the file's metadata
        try {
            await deleteFile(file.uuid);
        } catch (err) {
            logger.error({
                msg: `Error deleting file on server with uuid ${file.uuid}`,
                err: err,
            });
        }
    }
}
