from datetime import datetime,timedelta
import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

workshops_router = APIRouter(
    prefix="/api/v2/workshops",
    tags=["workshops"],
    responses={404: {"description": "Not found"}},
)

@workshops_router.get("/get_workshops_for_user/{user_uuid}")
async def route_get_workshops(request: Request, user_uuid: str):
    # Get workshops
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting workshops...")

    db = MongoDB()

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Get all workshops
    workshops = await collection.find().to_list(None)

    # Convert to dicts
    workshops = [Workshop(**workshop) for workshop in workshops]

    workshops = [workshop.dict() for workshop in workshops if workshop.is_live == True]

    # Remove the rsvp_list from each workshop and replace it with the length of the list
    for workshop in workshops:
        workshop["signups"] = len(workshop["rsvp_list"])
        workshop["position"] = workshop["rsvp_list"].index(user_uuid) if user_uuid in workshop["rsvp_list"] else -1

        # Remove the rsvp_list
        del workshop["rsvp_list"]

    # Return the checkouts
    return workshops

@workshops_router.get("/get_workshops")
async def route_get_full_workshops(request: Request):
    # Get workshops
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting workshops...")

    db = MongoDB()

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "workshops")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the checkouts collection
    collection = await db.get_collection("workshops")

    # Get all checkouts
    workshops = await collection.find().to_list(None)

    workshops = [Workshop(**workshop) for workshop in workshops]

    return workshops

@workshops_router.post("/create_workshop", status_code=201)
async def route_create_workshop(request: Request):
    # Create a workshop
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating workshop...")
    workshop = Workshop(**await request.json())

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "workshops")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Check if the workshop already exists
    if await collection.find_one({"uuid": workshop.uuid}) is not None:
        # The workshop already exists
        # Return error
        raise HTTPException(status_code=400, detail="Workshop already exists")

    # Add the workshop to the database
    await collection.insert_one(workshop.dict())

    # Return the workshop
    return workshop

@workshops_router.post("/update_workshop", status_code=201)
async def route_update_workshop(request: Request):
    # Update a workshop
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating workshop...")
    workshop = Workshop(**await request.json())

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "workshops")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    existing_workshop = await collection.find_one({"uuid": workshop.uuid})

    # Check if the workshop already exists
    if existing_workshop is None:
        # The workshop does not exist
        # Return error
        raise HTTPException(status_code=400, detail="Workshop does not exist")
    
    # Save signups
    workshop.rsvp_list = existing_workshop["rsvp_list"]

    # Update the workshop
    await collection.replace_one({"uuid": workshop.uuid}, workshop.dict())

    # Return the workshop
    return workshop

@workshops_router.post("/rsvp_to_workshop", status_code=201)
async def route_rsvp_to_workshop(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("RSVPing to workshop...")

    # Get the request body
    body = await request.json()

    db = MongoDB()

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Get the workshop
    workshop = await collection.find_one({"uuid": body["workshop_uuid"]})

    if workshop is None:
        # The workshop does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Workshop does not exist")
    
    # Check if the workshop has passed
    if int(workshop["timestamp_end"]) < datetime.now().timestamp():
        # The workshop has passed
        # Return error
        raise HTTPException(status_code=400, detail="Workshop has already passed")
    
    # Check if you're already signed up for the workshop
    if body["user_uuid"] in workshop["rsvp_list"]:
        # You're already signed up for the workshop
        # Return error
        raise HTTPException(status_code=400, detail="You're already signed up for this workshop")
    
    # Add the user to the workshop's rsvp_list
    workshop["rsvp_list"].append(body["user_uuid"])

    # Update the workshop
    await collection.replace_one({"uuid": body["workshop_uuid"]}, workshop)

    return 

@workshops_router.post("/cancel_rsvp_to_workshop", status_code=201)
async def route_cancel_rsvp_to_workshop(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("RSVPing to workshop...")

    # Get the request body
    body = await request.json()

    db = MongoDB()

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Get the workshop
    workshop = await collection.find_one({"uuid": body["workshop_uuid"]})

    if workshop is None:
        # The workshop does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Workshop does not exist")
    

    # Check if the workshop has passed
    if int(workshop["timestamp_end"]) < datetime.now().timestamp():
        # The workshop has passed
        # Return error
        raise HTTPException(status_code=400, detail="Workshop has already passed")
    
    # Check if you're already signed up for the workshop
    if body["user_uuid"] not in workshop["rsvp_list"]:
        # You're already signed up for the workshop
        # Return error
        raise HTTPException(status_code=400, detail="You're not signed up for this workshop")
    
    # Remove the user from the workshop's rsvp_list
    workshop["rsvp_list"].remove(body["user_uuid"])

    # Update the workshop
    await collection.replace_one({"uuid": body["workshop_uuid"]}, workshop)

    return