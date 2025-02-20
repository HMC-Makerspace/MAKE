import { FILE_RESOURCE_TYPE, TFile } from "common/file";
import { API_SCOPE } from "common/global";
import {
    ErrorResponse,
    FORBIDDEN_ERROR,
    SuccessfulResponse,
    UNAUTHORIZED_ERROR,
    VerifyRequestHeader,
} from "common/verify";
import {
    getFiles,
    getFile,
    createFile,
    deleteFile,
    getFilesByResource,
    deleteFileOnServer,
    moveTempFileOnServer,
} from "controllers/file.controller";
import { verifyRequest } from "controllers/verify.controller";
import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import upload from "../core/upload";

const router = Router();

/*
☑ get all
☑ get one
☑ delete one
TODO: rename one
TODO: extend one
☑ get by user
☑ create for user
☑ get by workshop
☑ create for workshop
☑ get by machine
☑ create for machine
*/

// --- Request & Response Types ---
type FileResponse = Response<TFile | ErrorResponse>;
type FilesResponse = Response<TFile[] | ErrorResponse>;

const UPLOAD_PATH = process.env.UPLOAD_PATH || "/uploads";

// --- File Routes ---

/**
 * Download a file by UUID to be served to the user. This is a public route.
 */
router.get("/download/:UUID", async (req: Request, res: Response) => {
    const file_uuid = req.params.UUID;
    // TODO: Consider authorization?
    const file = await getFile(file_uuid);
    if (!file) {
        req.log.warn(`File not found by uuid ${file_uuid}`);
        res.status(StatusCodes.NOT_FOUND).json({
            error: `No file found with uuid \`${file_uuid}\`.`,
        });
        return;
    }
    res.sendFile(file.path);
    return;
});

/**
 * Get all files made by a specific user. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.GET_FILES_BY_USER} scope. If the requesting user is
 * the same as the user being queried, the {@link API_SCOPE.GET_OWN_FILES}
 * scope is allowed instead. This route will return a list of files made by
 * the user, or a 403 error if the user is not authorized to view the files.
 */
router.get(
    "/by/user/:user_uuid",
    async (req: Request<{ user_uuid: string }>, res: FilesResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a user's files",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting files for user ${user_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get files by user request is valid if the requesting user can
        // get all files, get files for any user, or get their own files
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_FILES,
                API_SCOPE.GET_FILES_BY_USER,
                requesting_uuid == user_uuid && API_SCOPE.GET_OWN_FILES,
            )
        ) {
            // If authorized, get the user's file information
            const user_files = await getFilesByResource(
                user_uuid,
                FILE_RESOURCE_TYPE.USER,
            );
            req.log.debug("Returned user's files.");
            res.status(StatusCodes.OK).json(user_files);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a user's files",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Get all images related to a specific area. This is a public route.
 */
router.get(
    "/by/area/:area_uuid",
    async (req: Request<{ area_uuid: string }>, res: FilesResponse) => {
        const area_uuid = req.params.area_uuid;

        req.log.debug({
            msg: `Getting files for area ${area_uuid}`,
        });

        // Get the area's file information
        const area_files = await getFilesByResource(
            area_uuid,
            FILE_RESOURCE_TYPE.AREA,
        );
        req.log.debug("Returned area's files.");
        res.status(StatusCodes.OK).json(area_files);
    },
);

/**
 * Get all images related to a specific machine. This is a public route.
 */
router.get(
    "/by/machine/:machine_uuid",
    async (req: Request<{ machine_uuid: string }>, res: FilesResponse) => {
        const machine_uuid = req.params.machine_uuid;

        req.log.debug({
            msg: `Getting files for machine ${machine_uuid}`,
        });

        // Get the machine's file information
        const machine_files = await getFilesByResource(
            machine_uuid,
            FILE_RESOURCE_TYPE.MACHINE,
        );
        req.log.debug("Returned machine's files.");
        res.status(StatusCodes.OK).json(machine_files);
    },
);

/**
 * Get all images related to a specific workshop. This is a public route.
 */
router.get(
    "/by/workshop/:workshop_uuid",
    async (req: Request<{ workshop_uuid: string }>, res: FilesResponse) => {
        const workshop_uuid = req.params.workshop_uuid;

        req.log.debug({
            msg: `Getting files for workshop ${workshop_uuid}`,
        });

        // Get the workshop's file information
        const workshop_files = await getFilesByResource(
            workshop_uuid,
            FILE_RESOURCE_TYPE.WORKSHOP,
        );
        req.log.debug("Returned workshop's files.");
        res.status(StatusCodes.OK).json(workshop_files);
    },
);

/**
 * Get all files. This is a protected route, and a `requesting_uuid` header
 * is required to call it. The user must have the
 * {@link API_SCOPE.GET_ALL_FILES} scope.
 */
router.get("/", async (req: Request, res: FilesResponse) => {
    const headers = req.headers as VerifyRequestHeader;
    const requesting_uuid = headers.requesting_uuid;

    // If no requesting user uuid is provided, the call is not authorized
    if (!requesting_uuid) {
        req.log.warn("No requesting_uuid was provided while getting all files");
        res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
        return;
    }

    req.log.debug({
        msg: "Getting all files",
        requesting_uuid: requesting_uuid,
    });

    // If the user is authorized, get all file information
    if (await verifyRequest(requesting_uuid, API_SCOPE.GET_ALL_FILES)) {
        const files = await getFiles();
        // If no files are found, log an warning, but still return an empty
        // list of files
        if (!files) {
            req.log.warn("No files found in the database.");
        } else {
            req.log.debug("Returned all files");
        }
        res.status(StatusCodes.OK).json(files);
    } else {
        req.log.warn({
            msg: "Forbidden user attempted to get all files",
            requesting_uuid: requesting_uuid,
        });
        // If the user is not authorized, provide a status error
        res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
    }
});

/**
 * Get a specific file. This is a protected route, and a `requesting_uuid`
 * header is required to call it. The user must have the
 * {@link API_SCOPE.GET_ONE_FILE} or {@link API_SCOPE.GET_ALL_FILES} scope.
 */
router.get(
    "/:UUID",
    async (req: Request<{ UUID: string }>, res: FileResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid = headers.requesting_uuid;
        const file_uuid = req.params.UUID;

        // If no requesting user uuid is provided, the call is not authorized
        if (!requesting_uuid) {
            req.log.warn(
                "No requesting_uuid was provided while getting a file",
            );
            res.status(StatusCodes.UNAUTHORIZED).json(UNAUTHORIZED_ERROR);
            return;
        }

        req.log.debug({
            msg: `Getting a file by uuid ${file_uuid}`,
            requesting_uuid: requesting_uuid,
        });

        // A get file request is valid if the requesting user can get all
        // files or get one file at a time
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.GET_ALL_FILES,
                API_SCOPE.GET_ONE_FILE,
            )
        ) {
            // If the user is authorized, get a file's information
            const file = await getFile(file_uuid);
            if (!file) {
                req.log.warn(`File not found by uuid ${file_uuid}`);
                res.status(StatusCodes.NOT_FOUND).json({
                    error: `No file found with uuid \`${file_uuid}\`.`,
                });
                return;
            }
            req.log.debug("Returned file.");
            res.status(StatusCodes.OK).json(file);
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to get a file",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Creates a new file for a specific user. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_FILE} scope or the {@link API_SCOPE.CREATE_OWN_FILE}
 * scope if the user is creating a file for themselves. Must be a POST request
 * from a form element with the file input named "file" that is a multipart
 * form data request.
 */
router.post(
    "/for/user/:user_uuid",
    upload.single("file"),
    async (req: Request<{ user_uuid: string }>, res: FileResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const user_uuid = req.params.user_uuid;
        const file = req.file;
        console.log("File on server", file);
        // If no file is provided, no upload occurred
        if (!file) {
            res.status(StatusCodes.BAD_REQUEST).json({
                error: "No file was provided in the request.",
            });
            return;
        }
        // Check that the user is authorized to create a file
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.CREATE_FILE,
                requesting_uuid == user_uuid && API_SCOPE.CREATE_OWN_FILE,
            )
        ) {
            // Move the file from temp
            const temp_path = file.path;
            const target_path = `${UPLOAD_PATH}/${file.filename}`;
            moveTempFileOnServer(temp_path, target_path, req, res)
                // If the file was successfully saved, create a new File object
                // in the db
                .then(() => {
                    // Create a new file object
                    const file_obj: TFile = {
                        uuid: crypto.randomUUID(),
                        name: file.originalname,
                        path: target_path,
                        timestamp_upload: Date.now(),
                        size: file.size,
                        resource_uuid: user_uuid,
                        resource_type: FILE_RESOURCE_TYPE.USER,
                    };
                    createFile(file_obj)
                        // Once the file has been created,
                        .then((new_file) => {
                            // If a file with the random uuid already exists,
                            // return a conflict error
                            if (!new_file) {
                                req.log.error({
                                    msg:
                                        `Could not create file for user ` +
                                        `${user_uuid} because the generated` +
                                        `file UUID already exists.`,
                                    file_path: target_path,
                                    file_obj: file_obj,
                                });
                                res.status(StatusCodes.CONFLICT).json({
                                    error:
                                        `Could not create file for user ` +
                                        `${user_uuid} because the generated ` +
                                        `file UUID already exists. ` +
                                        `Please try uploading again.`,
                                });
                                return;
                            }
                            // If the file was successfully created, log and
                            // return the new file object
                            req.log.debug("Returned new file for user.");
                            res.status(StatusCodes.CREATED).json(new_file);
                        })
                        .catch((err: Error) => {
                            // If there was an error saving the file, log it and
                            // return an error to the user
                            req.log.error({
                                msg: `Error creating file for user ${user_uuid}`,
                                err: err,
                            });
                            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: err.message,
                            });
                        });
                })
                // If there was an error saving the file, return an error to the user
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "Error saving file",
                    });
                });
        } else {
            req.log.warn({
                msg:
                    `Forbidden user attempted to create a file for user ` +
                    `${user_uuid}, attempting to unlink uploaded file at ` +
                    `path ${file.path}`,
                requesting_uuid: requesting_uuid,
            });
            await deleteFileOnServer(file.path, req, res, true);
        }
    },
);

/**
 * Create a new file for a specific resource. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.CREATE_FILE} scope or be allowed to update the resource the
 * file is related to. Must be a POST request from a form element with the file
 * input named "file" that is a multipart form data request.
 */
router.post(
    /\/for\/(workshop|area|machine)\/(.+)/,
    upload.single("file"),
    async (req: Request, res: Response) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        // Get the resource type and UUID from the URL
        const resource_type = req.params[0] as FILE_RESOURCE_TYPE;
        const resource_uuid = req.params[1];

        const file = req.file;
        // If no file is provided, no upload occurred
        if (!file) {
            res.status(StatusCodes.BAD_REQUEST).json({
                error: "No file was provided in the request.",
            });
            return;
        }
        // Check that the user is authorized to create a file
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.CREATE_FILE,
                resource_type == FILE_RESOURCE_TYPE.WORKSHOP &&
                    API_SCOPE.UPDATE_WORKSHOP,
                resource_type == FILE_RESOURCE_TYPE.AREA &&
                    API_SCOPE.UPDATE_AREA,
                resource_type == FILE_RESOURCE_TYPE.MACHINE &&
                    API_SCOPE.UPDATE_MACHINE,
            )
        ) {
            // Move the file from temp
            const temp_path = file.path;
            const target_path = `${UPLOAD_PATH}/${file.filename}`;
            moveTempFileOnServer(temp_path, target_path, req, res)
                // If the file was successfully saved, create a new File object
                // in the db
                .then(() => {
                    // Create a new file object
                    const file_obj: TFile = {
                        uuid: crypto.randomUUID(),
                        name: file.originalname,
                        path: target_path,
                        timestamp_upload: Date.now(),
                        size: file.size,
                        resource_uuid: resource_uuid,
                        resource_type: resource_type,
                    };
                    createFile(file_obj)
                        // Once the file has been created,
                        .then((new_file) => {
                            // If a file with the random uuid already exists,
                            // return a conflict error
                            if (!new_file) {
                                req.log.error({
                                    msg:
                                        `Could not create file for ${resource_type} ` +
                                        `${resource_uuid} because the ` +
                                        `generated file UUID already exists.`,
                                    file_path: target_path,
                                    file_obj: file_obj,
                                });
                                res.status(StatusCodes.CONFLICT).json({
                                    error:
                                        `Could not create file for ${resource_type} ` +
                                        `${resource_uuid} because the generated ` +
                                        `file UUID already exists. ` +
                                        `Please try uploading again.`,
                                });
                                return;
                            }
                            // If the file was successfully created, log and
                            // return the new file object
                            req.log.debug(
                                `Returned new file for ${resource_type} ${resource_uuid}.`,
                            );
                            res.status(StatusCodes.CREATED).json(new_file);
                        })
                        .catch((err) => {
                            // If there was an error saving the file, log it and
                            // return an error to the user
                            req.log.error({
                                msg: `Error creating file for ${resource_type} ${resource_uuid}`,
                                err: err,
                            });
                            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: "Error creating file in the database",
                            });
                        });
                })
                // If there was an error saving the file, return an error to the user
                .catch((err) => {
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "Error saving file",
                    });
                });
        } else {
            req.log.warn({
                msg:
                    `Forbidden user attempted to create a file for ${resource_type} ` +
                    `${resource_uuid}, attempting to unlink uploaded file at ` +
                    `path ${file.path}`,
                requesting_uuid: requesting_uuid,
            });
            await deleteFileOnServer(file.path, req, res, true);
        }
    },
);

/**
 * Delete a specified file. This is a protected route, and a
 * `requesting_uuid` header is required to call it. The user must have the
 * {@link API_SCOPE.DELETE_FILE} scope or the {@link API_SCOPE.DELETE_OWN_FILE}
 * scope if the user is deleting a file they uploaded.
 */
router.delete(
    "/by/user/:file_uuid",
    async (req: Request<{ file_uuid: string }>, res: SuccessfulResponse) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        const file_uuid = req.params.file_uuid;

        // Get the file to verify the request
        const file: TFile | null = await getFile(file_uuid);

        if (!file) {
            req.log.warn(`File not found by uuid ${file_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No file found with uuid \`${file_uuid}\`.`,
            });
            return;
        }

        if (file.resource_type !== FILE_RESOURCE_TYPE.USER) {
            req.log.warn({
                msg: `File with uuid ${file_uuid} is not a user file.`,
            });
            res.status(StatusCodes.FORBIDDEN).json({
                error: `File with uuid \`${file_uuid}\` is not a user file.`,
            });
        }

        // Check that the user is authorized to delete the file
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.DELETE_FILE,
                requesting_uuid == file.resource_uuid &&
                    API_SCOPE.DELETE_OWN_FILE,
            )
        ) {
            deleteFileOnServer(file.path, req, res)
                .then(() => {
                    deleteFile(file_uuid)
                        .then((deleted_file) => {
                            if (!deleted_file) {
                                req.log.warn(
                                    `File with uuid ${file_uuid} not found, failed to delete`,
                                );
                                res.status(StatusCodes.NOT_FOUND).json({
                                    error: `File with uuid \`${file_uuid}\` not found.`,
                                });
                                return;
                            }
                            req.log.debug("Deleted file successfully.");
                            res.status(StatusCodes.NO_CONTENT).json({});
                        })
                        .catch((err: Error) => {
                            req.log.error({
                                msg: `Error deleting file with uuid ${file_uuid}`,
                                err: err,
                            });
                            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: err.message,
                            });
                        });
                })
                .catch((err) => {
                    req.log.error({
                        msg: `Error removing file with uuid ${file_uuid} off of server`,
                        err: err,
                    });
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "File could not be deleted off server",
                    });
                });
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a file",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

/**
 * Delete a specified file related to a resource. This is a protected route,
 * and a `requesting_uuid` header is required to call it. The user must have
 * the {@link API_SCOPE.DELETE_FILE} scope or be allowed to update the
 * resource the file is related to.
 */
router.delete(
    /\/by\/(workshop|area|machine)\/(.+)/,
    async (req: Request, res: Response) => {
        const headers = req.headers as VerifyRequestHeader;
        const requesting_uuid: string = headers.requesting_uuid;
        // Get the resource type and UUID from the URL
        const resource_type = req.params[0] as FILE_RESOURCE_TYPE;
        const resource_uuid = req.params[1];

        // Get the file to verify the request
        const file = await getFile(resource_uuid);

        if (!file) {
            req.log.warn(`File not found by uuid ${resource_uuid}`);
            res.status(StatusCodes.NOT_FOUND).json({
                error: `No file found with uuid \`${resource_uuid}\`.`,
            });
            return;
        }

        if (file.resource_type !== resource_type) {
            req.log.warn({
                msg: `File with uuid ${resource_uuid} is not a ${resource_type} file.`,
            });
            res.status(StatusCodes.FORBIDDEN).json({
                error: `File with uuid \`${resource_uuid}\` is not a ${resource_type} file.`,
            });
        }

        // Check that the user is authorized to delete the file
        if (
            await verifyRequest(
                requesting_uuid,
                API_SCOPE.DELETE_FILE,
                resource_type == FILE_RESOURCE_TYPE.WORKSHOP &&
                    API_SCOPE.UPDATE_WORKSHOP,
                resource_type == FILE_RESOURCE_TYPE.AREA &&
                    API_SCOPE.UPDATE_AREA,
                resource_type == FILE_RESOURCE_TYPE.MACHINE &&
                    API_SCOPE.UPDATE_MACHINE,
            )
        ) {
            deleteFileOnServer(file.path, req, res)
                .then(() => {
                    deleteFile(resource_uuid)
                        .then((deleted_file) => {
                            if (!deleted_file) {
                                req.log.warn(
                                    `File with uuid ${resource_uuid} not found, failed to delete`,
                                );
                                res.status(StatusCodes.NOT_FOUND).json({
                                    error: `File with uuid \`${resource_uuid}\` not found.`,
                                });
                                return;
                            }
                            req.log.debug("Deleted file successfully.");
                            res.status(StatusCodes.OK).json(deleted_file);
                        })
                        .catch((err: Error) => {
                            req.log.error({
                                msg: `Error deleting file with uuid ${resource_uuid}`,
                                err: err,
                            });
                            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                                error: err.message,
                            });
                        });
                })
                .catch((err) => {
                    req.log.error({
                        msg: `Error removing file with uuid ${resource_uuid} off of server`,
                        err: err,
                    });
                    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                        error: "File could not be deleted off server",
                    });
                });
        } else {
            req.log.warn({
                msg: "Forbidden user attempted to delete a file for a resource",
                requesting_uuid: requesting_uuid,
            });
            // If the user is not authorized, provide a status error
            res.status(StatusCodes.FORBIDDEN).json(FORBIDDEN_ERROR);
        }
    },
);

export default router;
