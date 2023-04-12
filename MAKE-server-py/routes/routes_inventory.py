import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException

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
    inventory_item = await collection.find_one({"UUID": item_uuid})

    if inventory_item is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Inventory item does not exist")

    # Return the inventory item
    return inventory_item


@inventory_router.post("/create_inventory_item")
async def route_create_inventory_item(item: InventoryItem, api_key: str):
    # Create an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating inventory item...")

    is_valid = await validate_api_key(api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"UUID": item.UUID})

    if check is not None:
        # The inventory item already exists
        # Return error
        raise HTTPException(status_code=409, detail="Inventory item already exists")

    # Create the inventory item
    await collection.insert_one(item.dict())

    return


@inventory_router.post("/update_inventory_item")
async def route_update_inventory_item(item: InventoryItem, api_key: str):
    # Update an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating inventory item...")

    is_valid = await validate_api_key(api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"UUID": item.UUID})

    if check is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Inventory item does not exist")

    # Update the inventory item
    await collection.replace_one({"UUID": item.UUID}, item.dict())

    # Return the inventory item
    return


@inventory_router.post("/delete_inventory_item")
async def route_delete_inventory_item(item_uuid: str, api_key: str):
    # Delete an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting inventory item...")

    is_valid = await validate_api_key(api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"UUID": item_uuid})

    if check is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Inventory item does not exist")
    
    # Delete the inventory item
    await collection.delete_one({"UUID": item_uuid})

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
