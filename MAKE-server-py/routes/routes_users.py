import logging
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

user_router = APIRouter(
    prefix="/api/v2/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@user_router.get("/get_users")
async def route_get_users(request: Request):
    # Get users
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting users...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "users")
    # Validate API key
    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the users collection
    collection = await db.get_collection("users")

    # Get all users
    users = await collection.find().to_list(None)

    users = [User(**user) for user in users]

    # Return the users
    return users

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
    user = await collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user = User(**user)

    # Return the user
    return user

@user_router.get("/get_user_by_cx_id/{cx_id}")
async def route_get_user_by_cx_id(cx_id: int):
    # Get a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting user by cx_id...")
    logging.info(cx_id)

    # Get the users collection
    db = MongoDB()
    collection = await db.get_collection("users")

    # Get the user
    user = await collection.find_one({"cx_id": cx_id})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user = User(**user)
    
    # Return the user
    return user

@user_router.post("/update_user")
async def route_update_user(request: Request):
    # Update a user's role
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating user...")

    # Get the API key
    api_key = request.headers["api-key"]

    db = MongoDB()

    # Check if the API key is valid
    is_valid = await validate_api_key(db, api_key, "users")

    if not is_valid:
        # The API key is not valid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key") 
    
    # Get the users collection
    collection = await db.get_collection("users")

    # Get the user UUID and role
    json = await request.json()
    user_uuid = json["uuid"]

    print(json["uuid"])
    print(json["role"])

    # Check if the user already exists
    user = await collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user["role"] = json["role"]
    user["cx_id"] = json["cx_id"]
    user["name"] = json["name"]
    user["email"] = json["email"]

    try :
        user = User(**user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user data") from e
    
    # Update the user
    await collection.replace_one({"uuid": user.uuid}, user.dict())

    # Return success
    return
    