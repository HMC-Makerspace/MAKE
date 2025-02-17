import { TRestockRequestLog } from "common/restock";
import { UserUUID } from "common/user";
import { RestockRequest } from "models/restock.model";
import mongoose from "mongoose";

/**
 * Get all restock requests
 * @returns A promise to an array of all restock requests
 */
export async function getRestockRequests() {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.find();
}

/**
 * Get a specific restock request by UUID
 * @param request_uuid The UUID of the request to search for
 * @returns A promise to a restock request, or null if no request has the given UUID
 */
export async function getRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.findOne({ uuid: request_uuid });
}

/**
 * Get all restock requests made by a specific user
 * @param user_uuid The UUID of the user to search for
 * @returns A promise to an array of all restock requests made by the user
 */
export async function getRestockRequestsByUser(user_uuid: UserUUID) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    return RestockRequests.find({ requesting_user: user_uuid });
}

/**
 * Create a new restock request
 * @param request_obj The complete restock request information
 * @returns The new restock request object
 */
export async function createRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // Check if the request already exists
    const existingRequest = await RestockRequests.exists({
        uuid: request_obj.uuid,
    });
    if (existingRequest) {
        // If so, return null, and don't create a new request
        return null;
    }
    // If the request doesn't exist, create a new request and return it
    const newRequest = new RestockRequests(request_obj);
    return newRequest.save();
}

/**
 * Delete a restock request by UUID
 * @param request_uuid The UUID of the request to delete
 * @returns The deleted restock request object, or null if the request doesn't exist
 */
export async function deleteRestockRequest(request_uuid: string) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // If the request exists, return it and delete it
    return RestockRequests.findOneAndDelete({ uuid: request_uuid });
}

/**
 * Update a restock request
 * @param request_obj The information to update the request with
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateRestockRequest(request_obj: any) {
    const RestockRequests = mongoose.model("RestockRequest", RestockRequest);
    // If the request exists, return it and delete it
    return RestockRequests.findOneAndReplace(
        { uuid: request_obj.uuid },
        request_obj,
        {
            returnDocument: "after",
        },
    );
}

/**
 * Update the status of a restock request
 * @param request_uuid The UUID of the request to update
 * @param new_status The new status to set for the request
 * @returns The updated restock request object, or null if the request doesn't exist
 */
export async function updateRestockRequestStatus(
    request_uuid: string,
    new_status: TRestockRequestLog,
) {
    // Find the request by UUID
    const request = await getRestockRequest(request_uuid);
    // If the request doesn't exist, return null
    if (!request) {
        return null;
    }
    // Update the request's current status and status logs
    request.current_status = new_status.status;
    request.status_logs.push(new_status);
    return request.save();
}
