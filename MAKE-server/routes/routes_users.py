import datetime
import logging
import os
import uuid

from fastapi.responses import FileResponse

from config import USER_STORAGE_LIMIT_BYTES
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
async def route_get_user(request: Request, user_uuid: str):
    # Get a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting user...")
    logging.info(user_uuid)

    db = MongoDB()
    # Get the users collection
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
async def route_get_user_by_cx_id(request: Request, cx_id: int):
    # Get a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting user by cx_id...")
    logging.info(cx_id)

    # Get the users collection
    db = MongoDB()
    collection = await db.get_collection("users")
    user = await collection.find_one({"cx_id": cx_id})
    
    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    

    # If api-key is present, check if the user is an admin
    if "api-key" in request.headers:
        api_key = request.headers["api-key"]
        is_valid = await validate_api_key(db, api_key, "users")
    else:
        is_valid = False
    
    # Get IP address
    ip = request.client.host
    logging.info(f"IP address {ip} requested user matching {cx_id}")
    collection = await db.get_collection("ip_logs")

    # See how many requests the user has made in the last 5 minutes
    # If they've requested more then 4 different users, return an error
    uuids = await collection.distinct("user", {"ip": ip, "timestamp": {"$gt": datetime.datetime.now().timestamp() - 300}})

    # Log the IP address
    await collection.insert_one({"ip": ip, "timestamp": datetime.datetime.now().timestamp(), "user": user["uuid"]})   

    # If there's a valid API key, don't check the IP address
    if not is_valid:
        if len(uuids) > 6 and user["uuid"] not in uuids:
            # The user has made too many requests
            # Return error
            raise HTTPException(status_code=429, detail="Too many requests")
    
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

    if "proficiencies" in json:
        user["proficiencies"] = json["proficiencies"]
    if "availability" in json:
        user["availability"] = json["availability"]
    if "new_steward" in json:
        user["new_steward"] = json["new_steward"]
    if "certifications" in json:
        user["certifications"] = json["certifications"]

    try :
        user = User(**user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user data") from e
    
    # Update the user
    await collection.replace_one({"uuid": user.uuid}, user.dict())

    # Return success
    return
    
@user_router.post("/update_user_by_uuid", status_code=201)
async def route_update_user_by_uuid(request: Request):
    # Update a user's role
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating user by uuid...")

    db = MongoDB()

    # Get the users collection
    collection = await db.get_collection("users")

    # Get the user UUID and role
    json = await request.json()
    user_uuid = json["uuid"]

    # Check if the user already exists
    user = await collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    if "proficiencies" in json:
        user["proficiencies"] = json["proficiencies"]
    if "availability" in json:
        user["availability"] = json["availability"]
    if "new_steward" in json:
        user["new_steward"] = json["new_steward"]

    try :
        user = User(**user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user data") from e
    
    # Update the user
    await collection.replace_one({"uuid": user.uuid}, user.dict())

    # Return success
    return

@user_router.post("/clear_all_availability", status_code=201)
async def route_clear_all_availability(request: Request):
    # Update a user's role
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Clearing availability for all users...")

    db = MongoDB()

    # Get the users collection
    collection = await db.get_collection("users")

    # Get all users
    users = await collection.find().to_list(None)

    for user in users:
        if "availability" not in user:
            continue

        # Delete the availability
        del user["availability"]

        try :
            user = User(**user)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid user data") from e
        
        # Update the user
        await collection.replace_one({"uuid": user.uuid}, user.dict())

    # Return success
    return

@user_router.post("/get_file_list", status_code=201)
async def route_get_file_list(request: Request):
    # Get a user's file list
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting user's file list...")

    db = MongoDB()

    # Get the users collection
    collection = await db.get_collection("users")

    # Get the user UUID and role
    json = await request.json()
    user_uuid = json["user_uuid"]

    # Check if the user already exists
    user = await collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_files_collection = await db.get_collection("user_files")

    if user_files_collection is None:
        return []
    
    if "files" not in user:
        return []

    if type(user["files"]) != list:
        return [] 
    
    # Get the user's files, but exclude the file data
    user_files = await user_files_collection.find({"uuid": {"$in": user["files"]}}).to_list(None)

    user_files = [UserFile(**file) for file in user_files]

    # Return the user's files
    return user_files

@user_router.post("/upload_file")
async def route_upload_file_for_user(request: Request):
    # Upload a file for a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Uploading file for user...")

    db = MongoDB()

    # Get the users collection
    user_collection = await db.get_collection("users")

    # Get the user UUID and role
    form = await request.form()

    user_uuid = form["user_uuid"]

    # Check if the user already exists
    user = await user_collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    user_files_collection = await db.get_collection("user_files")

    if "files" not in user:
        user["files"] = []

    if type(user["files"]) != list:
        user["files"] = []

    file_data = form["file"].file.read()

    # Calculate file size
    file_size_bytes = len(file_data)
    stored_file_uuids = user["files"]
    
    if user_files_collection is not None:
        stored_files = await user_files_collection.find({"uuid": {"$in": stored_file_uuids}}).to_list(None)
    else :
        stored_files = []

    total_bytes = file_size_bytes + sum([file["size"] for file in stored_files])

    if total_bytes > USER_STORAGE_LIMIT_BYTES:
        # The user has exceeded their storage limit
        # Return error
        raise HTTPException(status_code=400, detail="User has exceeded their storage limit")
    
    # Add the file to the user's stored files
    file_uuid = uuid.uuid4().hex

    user["files"].append(file_uuid)

    # Update the user
    await user_collection.replace_one({"uuid": user_uuid}, user)

    # Add the file to the user_files collection
    await user_files_collection.insert_one({
        "uuid": file_uuid,
        "name": form["file"].filename,
        "timestamp": datetime.datetime.now().timestamp(),
        "size": file_size_bytes,
        "user_uuid": user_uuid
    })

    # Store actual data as a separate file under the uuid,
    # in the "user_files" directory
    if not os.path.exists("user_files"):
        os.mkdir("user_files")
        
    with open(f"user_files/{file_uuid}", "wb") as f:
        f.write(file_data)
    
    # Return
    return


@user_router.post("/delete_file")
async def route_delete_file_for_user(request: Request):
    # Delete a file for a user
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting file for user...")

    db = MongoDB()

    # Get the users collection
    user_collection = await db.get_collection("users")

    # Get the user UUID and role
    json = await request.json()
    file_uuid = json["file_uuid"]
    
    user_files_collection = await db.get_collection("user_files")

    # Check if the file exists
    file = await user_files_collection.find_one({"uuid": file_uuid})

    if file is None:
        # The file does not exist
        # Return error
        raise HTTPException(status_code=404, detail="File does not exist")
    
    # Get the user
    user_uuid = file["user_uuid"]
    user = await user_collection.find_one({"uuid": user_uuid})
    
    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")
    
    # Delete the file from the user's stored files
    user["files"].remove(file_uuid)

    # Update the user
    await user_collection.replace_one({"uuid": user_uuid}, user)

    # Delete the file
    await user_files_collection.delete_one({"uuid": file_uuid})

    # Delete the file from the user_files directory
    if os.path.exists(f"user_files/{file_uuid}"):
        os.remove(f"user_files/{file_uuid}")

    # Return
    return


@user_router.get("/download_file/{file_uuid}")
async def route_download_file(request: Request, file_uuid: str):
    # Download a file
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Downloading file...")

    db = MongoDB()

    # Get the users collection
    user_files_collection = await db.get_collection("user_files")

    # Check if the file exists
    file = await user_files_collection.find_one({"uuid": file_uuid})

    if file is None:
        # The file does not exist
        # Return error
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get the file data from the user_files directory
    if os.path.exists(f"user_files/{file_uuid}"):
        return FileResponse(f"user_files/{file_uuid}", media_type="application/octet-stream", filename=file["name"])    
    
    else :
        # The file does not exist
        # Return error
        raise HTTPException(status_code=404, detail="File does not exist")
    
