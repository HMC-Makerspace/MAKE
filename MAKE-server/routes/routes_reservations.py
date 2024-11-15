from datetime import datetime,timedelta
import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException, Request, status

reservations_router = APIRouter(
    prefix="/api/v2/reservations",
    tags=["reservations"],
    responses={404: {"description": "Not found"}},
)

"""
Function to get all reservations.
It returns a list of all Reservation objects in the database to the
response json.
"""
@reservations_router.get("/get_reservations")
async def route_get_reservations(request: Request):
    # Get reservations
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting reservations...")

    # Get the API key
    # Checkouts API key is used to get reservations
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "checkouts")
    
    # Validate API key
    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    # Get the reservations collection
    collection = await db.get_collection("reservations")

    # Get all reservations
    reservations = await collection.find().to_list(None)

    reservations = [Reservation(**reservation) for reservation in reservations]

    # Return the reservations
    return reservations


"""
Function to sort through all reservations and return only the ones that belong
to a user with a specific user_uuid passed through the url
"""
@reservations_router.get("/get_reservations_for_user/{user_uuid}")
async def route_get_reservations_for_user(request: Request, user_uuid: str):
    # Get reservations
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting reservations...")

    db = MongoDB()
    collection = await db.get_collection("reservations")

    # Get all reservations by uuid
    reservations = await collection.find({"reserved_by": user_uuid}).to_list(None)

    reservations = [Reservation(**reservation) for reservation in reservations]

    # Return the reservations
    return reservations


"""
Function to make reservations that takes in reservation information through
the body of the request and returns a status if successful
"""
@reservations_router.post("/create_new_reservation", status_code=201)
async def route_create_new_reservation(request: Request):
    # Create a reservation
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating reservation...")
    reservation = Reservation(** await request.json())

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    # Checkouts API key is used to create reservations
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    
    # Ensure that there's more then 0 items being reserved
    if len(reservation.items) == 0:
        # No items
        # Return error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items")

    # Get the reservations collection
    collection = await db.get_collection("reservations")
    
    # Insert the reservation
    await collection.insert_one(reservation.model_dump())

    # Return status code 201
    return

"""
Function to delete a reservation that takes in a reservation_uuid from the url
and obliterates it from the database
"""
@reservations_router.post("/delete_reservation/{reservation_uuid}", status_code=200)
async def route_delete_reservation(request: Request, reservation_uuid: str):
    # Delete a reservation
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting reservation...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    # Validate API key
    # Checkouts API key is used to delete reservations
    if not await validate_api_key(db, api_key, "checkouts"):
        # Invalid API key
        # Return error
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    # Get the reservations collection
    collection = await db.get_collection("reservations")

    # Delete the reservation
    await collection.delete_one({"uuid": reservation_uuid})

    # Return status code 200
    return