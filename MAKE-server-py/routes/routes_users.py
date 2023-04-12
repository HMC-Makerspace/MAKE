import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException

user_router = APIRouter(
    prefix="/api/v2/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@user_router.get("/get_user/{user_uuid}")
async def route_get_user(user_uuid: str):
    # Get a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting user...")
    logging.info(user_uuid)

    # Get the users collection
    db = MongoDB()
    collection = await db.get_collection("users")

    # Get the user
    user = await collection.find_one({"UUID": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    # Return the user
    return user

@user_router.post("/update_user_role")
async def route_update_user(user_uuid: str, api_key: str, role: str):
    # Update a user's role
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating user role...")
    logging.info(role)
    db = MongoDB()

    # Check if the API key is valid
    is_valid = await validate_api_key(db, api_key)

    if not is_valid:
        # The API key is not valid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key") 
    
    # Get the users collection
    collection = await db.get_collection("users")

    # Check if the user already exists
    user = await collection.find_one({"UUID": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user.Role = role

    # Update the user
    await collection.replace_one({"UUID": user.UUID}, user.dict())

    # Return success
    return
    