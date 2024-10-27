from datetime import datetime,timedelta
import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

checkouts_router = APIRouter(
    prefix="/api/v2/checkouts",
    tags=["checkouts"],
    responses={404: {"description": "Not found"}},
)

@checkouts_router.get("/get_checkouts")
async def route_get_checkouts(request: Request):
    # Get checkouts
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkouts...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "checkouts")
    
    # Validate API key
    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Get all checkouts
    checkouts = await collection.find().to_list(None)

    checkouts = [Checkout(**checkout) for checkout in checkouts]

    # Return the checkouts
    return checkouts

@checkouts_router.get("/get_checkouts_for_user/{user_uuid}")
async def route_get_checkouts_for_user(request: Request, user_uuid: str):
    # Get checkouts
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkouts...")

    db = MongoDB()
    collection = await db.get_collection("checkouts")

    # Get all checkouts by uuid
    checkouts = await collection.find({"checked_out_by": user_uuid}).to_list(None)

    checkouts = [Checkout(**checkout) for checkout in checkouts]

    # Return the checkouts
    return checkouts

@checkouts_router.get("/get_checkout/{checkout_uuid}")
async def route_get_checkout_record(request: Request, checkout_uuid: str):
    # Get a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()
    is_valid = await validate_api_key(db, api_key, "checkouts")

    # Validate API key
    if not is_valid: 
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Get the checkout
    checkout = await collection.find_one({"uuid": checkout_uuid})

    if checkout is None:
        # The checkout does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Checkout does not exist")

    checkout = Checkout(**checkout)

    # Return the checkout
    return checkout

@checkouts_router.post("/create_new_checkout", status_code=201)
async def route_create_new_checkout(request: Request):
    # Create a checkout
    logging.getLogger().setLevel(logging.INFO)
    blah = await request.json()
    logging.info("Creating checkout...")
    logging.info("\n\n\n" + str(blah) + "\n\n\n")
    checkout = Checkout(** blah)

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Ensure that there's more then 0 items
    if len(checkout.items) == 0:
        # No items
        # Return error
        raise HTTPException(status_code=400, detail="No items")
    
    # Insert the checkout
    await collection.insert_one(checkout.dict())

    # Return status code 201
    return

@checkouts_router.post("/update_checkout/{checkout_uuid}")
async def route_update_checkout(request: Request, checkout_uuid: str):
    # Update a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating checkout...")
    checkout = Checkout(** await request.json())

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Update the checkout
    await collection.update_one({"uuid": checkout_uuid}, {"$set": checkout.dict()})

    # Return the checkout
    return

@checkouts_router.post("/check_in_checkout/{checkout_uuid}", status_code=201)
async def route_check_in_checkout(request: Request, checkout_uuid: str):
    # Check in a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Checking in checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Check in the checkout
    await collection.update_one({"uuid": checkout_uuid}, {"$set": {"timestamp_in": datetime.now().timestamp()}})

    # Return success
    return

@checkouts_router.post("/renew_checkout/{checkout_uuid}")
async def route_renew_checkout(request: Request, checkout_uuid: str):
    # Renew a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Renewing checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Get old due date
    checkout = await collection.find_one({"uuid": checkout_uuid})
    if checkout is None:
        # The checkout does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Checkout does not exist")

    # 403 forbidden if no renewals left
    if checkout["renewals_left"]==0:
        raise HTTPException(status_code=403, detail="No renewals left") 

    # Get old date
    old_date = checkout["timestamp_due"]

    # Get new due date
    new_date = old_date + timedelta(days=1)

    # Renew the checkout 
    await collection.update_one({"uuid": checkout_uuid}, {"$set": {"timestamp_due": new_date.timestamp()}})

    # Return success
    return checkout

@checkouts_router.post("/delete_checkout/{checkout_uuid}")
async def route_delete_checkout(request: Request, checkout_uuid: str):
    # Delete a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Delete the checkout
    await collection.delete_one({"uuid": checkout_uuid})

    # Return success
    return {"success": True}
