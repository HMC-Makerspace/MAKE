import logging
from utilities import validate_api_key
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

    # Search the inventory
    search_results = await collection.find(
        {"$text": {"$search": search_query}}).to_list(None)

    # Return the search results
    return search_results


@inventory_router.get("/add_restock_notice")
async def route_add_restock_notice(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Adding restock notice...")
    restock = RestockRequest(** await request.json())

    # Get the restock collection
    db = MongoDB()
    collection = await db.get_collection("restock_requests")

    # Add to the restock collection
    await collection.insert_one(restock.dict())

    return
