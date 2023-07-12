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
    is_valid = validate_api_key(db, api_key, "checkouts")

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
    logging.info("Creating checkout...")
    checkout = Checkout(** await request.json())

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Set base renewals left to 3
    # checkout.dict()["renewals_left"]=3

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
    if not validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Update the checkout
    await collection.update_one({"uuid": checkout_uuid}, {"$set": checkout.dict()})

    # Return the checkout
    return checkout

@checkouts_router.post("/check_in_checkout/{checkout_uuid}", status_code=201)
async def route_check_in_checkout(request: Request, checkout_uuid: str):
    # Check in a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Checking in checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Check in the checkout
    await collection.update_one({"uuid": checkout_uuid}, {"$set": {"timestamp_in": datetime.datetime.now().timestamp()}})

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
    if not validate_api_key(db, api_key, "checkouts"):
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

    #Check if there are renewals left
    #if checkout["renewals_left"]==0:
     #   raise HTTPException(status_code=418, detail="No renewals left") # Placeholder status code

    # Get old date
    old_date = checkout["timestamp_due"]

    # Get new due date
    new_date = old_date + timedelta(days=1)

    # Renew the checkout 
    await collection.update_one({"uuid": checkout_uuid}, {"$set": {"timestamp_due": new_date.timestamp()})

    # Return success
    return

@checkouts_router.post("/delete_checkout/{checkout_uuid}")
async def route_delete_checkout(request: Request, checkout_uuid: str):
    # Delete a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting checkout...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    if not validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=404, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("checkouts")

    # Delete the checkout
    await collection.delete_one({"uuid": checkout_uuid})

    # Return success
    return {"success": True}

