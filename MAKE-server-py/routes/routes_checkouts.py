import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException

checkouts_router = APIRouter(
    prefix="/api/v2/checkouts",
    tags=["checkouts"],
    responses={404: {"description": "Not found"}},
)

@checkouts_router.post("/get_all_checkouts")
async def route_get_checkouts(api_key: str):
    # Get checkouts
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkouts...")

    # Validate API key
    if not validate_api_key(api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Get all checkouts
    checkouts = await collection.find().to_list(None)

    # Return the checkouts
    return checkouts

@checkouts_router.post("/get_checkout/{checkout_uuid}")
async def route_get_checkout_record(checkout_uuid: str, api_key: str):
    # Get a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkout...")

    # Validate API key
    if not validate_api_key(api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Get the checkout
    checkout = await collection.find_one({"uuid": checkout_uuid})

    if checkout is None:
        # The checkout does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Checkout does not exist")

    # Return the checkout
    return checkout

@checkouts_router.post("/create_new_checkout")
async def route_create_new_checkout(checkout: Checkout, api_key: str):
    # Create a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating checkout...")

    # Validate API key
    if not validate_api_key(api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Insert the checkout
    await collection.insert_one(checkout.dict())

    # Return the checkout
    return checkout

@checkouts_router.post("/update_checkout/{checkout_uuid}")
async def route_update_checkout(checkout_uuid: str, checkout: Checkout, api_key: str):
    # Update a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating checkout...")

    # Validate API key
    if not validate_api_key(api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Update the checkout
    await collection.update_one({"uuid": checkout_uuid}, {"$set": checkout.dict()})

    # Return the checkout
    return checkout

@checkouts_router.post("/delete_checkout/{checkout_uuid}")
async def route_delete_checkout(checkout_uuid: str, api_key: str):
    # Delete a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting checkout...")

    # Validate API key
    if not validate_api_key(api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Delete the checkout
    await collection.delete_one({"uuid": checkout_uuid})

    # Return success
    return {"success": True}
