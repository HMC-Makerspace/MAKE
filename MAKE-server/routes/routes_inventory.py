import datetime
import logging
import uuid
from utilities import validate_api_key
from inventory.inventory import email_user_restock_request_complete
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

inventory_router = APIRouter(
    prefix="/api/v2/inventory",
    tags=["inventory"],
    responses={404: {"description": "Not found"}},
)


@inventory_router.get("/get_inventory")
async def route_get_inventory():
    # Get the inventory
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting inventory...")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Get all inventory items
    inventory_items = await collection.find().to_list(None)

    inventory_items = [InventoryItem(**item) for item in inventory_items]
    
    # Return the inventory items
    return inventory_items


@inventory_router.get("/get_inventory_item/{item_uuid}")
async def route_get_inventory_item(item_uuid: str):
    # Get an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting inventory item...")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Get the inventory item
    inventory_item = await collection.find_one({"uuid": item_uuid})

    if inventory_item is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Inventory item does not exist")

    # Return the inventory item
    return inventory_item


@inventory_router.post("/create_inventory_item")
async def route_create_inventory_item(request: Request):
    # Create an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating inventory item...")
    item = InventoryItem(**await request.json())

    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item.uuid})

    if check is not None:
        # The inventory item already exists
        # Return error
        raise HTTPException(
            status_code=409, detail="Inventory item already exists")

    # Create the inventory item
    await collection.insert_one(item.dict())

    return


@inventory_router.post("/update_inventory_item", status_code=200)
async def route_update_inventory_item(request: Request):
    # Update an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating inventory item...")
    item = InventoryItem(**await request.json())

    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item.uuid})

    if check is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Inventory item does not exist")

    # Update the inventory item
    await collection.replace_one({"uuid": item.uuid}, item.dict())

    # Return the inventory item
    return


@inventory_router.post("/delete_inventory_item")
async def route_delete_inventory_item(request: Request):
    # Delete an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting inventory item...")
    item_uuid = await request.json()

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item_uuid})

    if check is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Inventory item does not exist")

    # Delete the inventory item
    await collection.delete_one({"uuid": item_uuid})

    # Return the inventory item
    return


@inventory_router.get("/search/{search_query}")
async def route_search_inventory(search_query: str):
    # Search the inventory
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Searching inventory...")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Search the inventory by all fields without using $text
    search_results = await collection.find(
        {"$or": [
            {"name": {"$regex": search_query, "$options": "i"}},
            {"location_room": {"$regex": search_query, "$options": "i"}},
            {"location_specific": {"$regex": search_query, "$options": "i"}},
            {"reorder_url": {"$regex": search_query, "$options": "i"}},
            {"specific_name": {"$regex": search_query, "$options": "i"}},
            {"serial_number": {"$regex": search_query, "$options": "i"}},
            {"brand": {"$regex": search_query, "$options": "i"}},
            {"model_number": {"$regex": search_query, "$options": "i"}},
            {"kit_ref": {"$regex": search_query, "$options": "i"}},
            {"kit_contents": {"$regex": search_query, "$options": "i"}},
        ]}).to_list(None)

    search_results = [InventoryItem(**item) for item in search_results]
    
    # Return the search results
    return search_results

@inventory_router.get("/get_restock_requests")
async def route_get_restock_requests(request: Request):
    # Get the restock requests
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting restock requests...")

    # Get the restock collection
    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    collection = await db.get_collection("restock_requests")

    # Get all restock requests
    restock_requests = await collection.find().to_list(None)

    restock_requests = [RestockRequest(**request) for request in restock_requests]
    
    # Return the restock requests
    return restock_requests

@inventory_router.post("/add_restock_request", status_code=201)
async def route_add_restock_notice(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Adding restock notice...")
    # Get the restock collection
    db = MongoDB()
    collection = await db.get_collection("restock_requests")

    authorized_request = False

    if "api-key" in request.headers:
        # The request is authorized

        # Get the API key
        api_key = request.headers["api-key"]

        # Validate the API key
        authorized_request = await validate_api_key(db, api_key, "inventory")

    body = await request.json()

    restock = {}
    restock["uuid"] = str(uuid.uuid4())
    restock["item"] = body["item"]
    restock["quantity"] = body["quantity"]
    restock["reason"] = body["reason"]
    restock["timestamp_sent"] = datetime.datetime.now().timestamp()
    restock["timestamp_completed"] = None
    restock["completion_note"] = None
    restock["is_approved"] = None
    restock["authorized_request"] = authorized_request


    if not authorized_request:
        # The request is not authorized
        # Check if the request is from a user
        if "user_uuid" in body:
            # The request is from a user
            # Get the users collection
            users = await db.get_collection("users")

            # Get the user
            user = await users.find_one({"uuid": body["user_uuid"]})

            if user is None:
                # The user does not exist
                # Return error
                raise HTTPException(
                    status_code=404, detail="User does not exist")


            # Add the user to the restock request
            restock["user_uuid"] = user["uuid"]
    else:
        restock["user_uuid"] = None

    restock = RestockRequest(**restock)

    # Add to the restock collection
    await collection.insert_one(restock.dict())

    return

@inventory_router.post("/complete_restock_request", status_code=201)
async def route_complete_restock_request(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Completing restock notice...")
    # Get the restock collection
    db = MongoDB()
    collection = await db.get_collection("restock_requests")

    if "api-key" in request.headers:
        # The request is authorized

        # Get the API key
        api_key = request.headers["api-key"]

        # Validate the API key
        if await validate_api_key(db, api_key, "inventory") is False:
            # The API key is invalid
            # Return error
            raise HTTPException(status_code=401, detail="Invalid API key")

    body = await request.json()

    # Get the restock request
    restock = await collection.find_one({"uuid": body["uuid"]})

    if restock is None:
        # The restock request does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Restock request does not exist")
    
    if restock["timestamp_completed"] is not None:
        # The restock request has already been completed
        # Return error
        raise HTTPException(
            status_code=400, detail="Restock request has already been completed")

    restock["timestamp_completed"] = datetime.datetime.now().timestamp()
    restock["completion_note"] = body["completion_note"]
    restock["is_approved"] = body["is_approved"]

    # Update the restock request
    await collection.replace_one({"uuid": restock["uuid"]}, restock)

    # Email the user
    if restock["user_uuid"] is not None:
        # The restock request is from a user
        # Get the users collection
        users = await db.get_collection("users")

        # Get the user
        user = await users.find_one({"uuid": restock["user_uuid"]})

        if user is None:
            # The user does not exist
            # Return error
            raise HTTPException(
                status_code=404, detail="User does not exist")

        # Email the user
        success = await email_user_restock_request_complete(restock, user)

        if not success:
            # The email failed to send
            # Return error
            raise HTTPException(
                status_code=500, detail="Failed to send email")

    return
