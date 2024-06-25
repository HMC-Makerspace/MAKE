import datetime
import logging

from config import QUIZ_IDS, VERSION, API_KEY_SCOPES
import utilities
from utilities import validate_api_key
from db_schema import *
from machines.loom import render_loom_file

from fastapi import APIRouter, HTTPException, Request

misc_router = APIRouter(
    prefix="/api/v2/misc",
    tags=["misc"],
    responses={404: {"description": "Not found"}},
)


@misc_router.get("/status")
async def route_get_status():
    # Get the status
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting status...")

    db = MongoDB()

    checkouts = await db.get_collection("checkouts")
    users = await db.get_collection("users")
    inventory = await db.get_collection("inventory")

    status = await db.get_collection("status")
    status = await status.find().to_list(None)
    status = status[0]

    return {
        "status": "alive",
        "last_update": utilities.last_updated_time.timestamp(),
        "time": datetime.datetime.now().timestamp(),
        "total_checkouts": await checkouts.count_documents({}), 
        "total_users": await users.count_documents({}),
        "total_items": await inventory.count_documents({}),
        "version": VERSION,
        "motd": status["motd"],
        "is_open": status["is_open"],
        "stewards_on_duty": status["stewards_on_duty"],
    }

@misc_router.post("/update_status", status_code=201)
async def route_update_status(request: Request):
    # Update the status
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating status...")

    db = MongoDB()

    # Get the request body
    body = await request.json()

    # Validate the API key
    api_key = request.headers["api-key"]
    if not await validate_api_key(db, api_key, "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Get status from collection
    status_collection = await db.get_collection("status")
    status = await status_collection.find().to_list(None)

    status = status[0]

    # Go through each key in the body and update the status
    for key in body:
        if key in status:
            status[key] = body[key]

    # Replace the status, it doesn't have a uuid or key
    await status_collection.replace_one({}, status)

@misc_router.post("/render_loom_file")
async def route_render_loom_file(request: Request):
    # Get the request body
    body = await request.json()
    
    # Render a loom file
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Rendering loom file...")

    try :
        result = render_loom_file(body["file"], body["extension"], body["output_format"], body["loom_width"], body["desired_height"], body["invert"], body["tabby_width"])
    except Exception as e:
        # The loom file could not be rendered
        # Return error
        logging.getLogger()
        logging.error(f"An error occurred while rendering the loom file: {e}")

        raise HTTPException(status_code=500, detail="An error occurred while rendering the loom file")
    
    if result is None:
        # The loom file could not be rendered
        # Return error
        raise HTTPException(status_code=400, detail="Loom file could not be rendered with the given parameters")
    
    # Return the rendered loom file
    return result

@misc_router.post("/get_api_key_scopes")
async def route_get_api_key_scopes(request: Request):
    # Get the request body
    body = await request.json()
    
    # Validate the API key
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Checking API key scopes...")

    db = MongoDB()

    api_keys = await db.get_collection("api_keys")
        
    # Get the API key
    api_key = await api_keys.find_one({"key": body["api_key"]})

    if api_key is None:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    else:
        # The API key is valid
        # Return the API key's scopes
        return {"scopes": api_key["scopes"]}
    
@misc_router.get("/get_api_keys")
async def route_get_api_keys(request: Request): 
    # Get the API keys
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting API keys...")

    db = MongoDB()

    # Verify that the current user has the proper scopes to access all API keys
    if not await validate_api_key(db, request.headers["api-key"], "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Get the API keys
    api_keys = await db.get_collection("api_keys")
    all_api_keys = await api_keys.find().to_list(None)

    all_api_keys_formatted = [APIKey(**info) for info in all_api_keys]

    return all_api_keys_formatted

@misc_router.get("/get_all_api_key_scopes")
async def route_get_all_api_key_scopes(request: Request):    
    # Get the API keys
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting API key scopes...")

    db = MongoDB()

    # Verify that the current user has the proper scopes to access all API key scopes
    if not await validate_api_key(db, request.headers["api-key"], "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return API_KEY_SCOPES

@misc_router.post("/update_api_key")
async def route_add_api_key(request: Request):
    # Get the request body
    body = await request.json()
    
    # Add an API key
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Adding API key...")

    db = MongoDB()

    # Verify that the current user has the proper scopes to add an API key
    if not await validate_api_key(db, request.headers["api-key"], "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Add the API key
    api_keys = await db.get_collection("api_keys")

    # Find it
    api_key = await api_keys.find_one({"uuid": body["uuid"]})

    if api_key is None:
        # The API key does not exist
        # insert it
        await api_keys.insert_one(body)
    else:
        # The API key exists
        # Update it
        await api_keys.update_one({"uuid": body["uuid"]}, {"$set": body})


@misc_router.delete("/delete_api_key")
async def route_delete_api_key(request: Request):
    # Get the request body
    body = await request.json()
    
    # Delete an API key
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting API key...")

    db = MongoDB()

    # Verify that the current user has the proper scopes to delete an API key
    if not await validate_api_key(db, request.headers["api-key"], "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Delete the API key
    api_keys = await db.get_collection("api_keys")

    # Delete it
    await api_keys.delete_one({"uuid": body["uuid"]})



@misc_router.get("/get_quizzes")
async def route_get_quizzes():
    # Get the quizzes
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting quizzes...")

    return 
    

@misc_router.get("/get_redirects")
async def route_get_redirects(request: Request):
    # Get the request body
    # Get the redirects
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting redirects...")

    db = MongoDB()
    api_key = request.headers["api-key"]


    # Validate the API key
    if not await validate_api_key(db, api_key, "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Get the redirects
    redirects = await db.get_collection("redirects")

    all_redirects = await redirects.find().to_list(None)

    all_redirects = [Redirect(**item) for item in all_redirects]
    
    return all_redirects

@misc_router.post("/update_redirect", status_code=201)
async def route_update_redirect(request: Request):
    # Update a redirect
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating redirect...")

    db = MongoDB()
    api_key = request.headers["api-key"]

    # Validate the API key
    if not await validate_api_key(db, api_key, "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    redirect = None

    try:
        redirect = Redirect(**await request.json())
    except Exception as e:
        # The redirect is invalid
        # Return error
        raise HTTPException(status_code=400, detail="Invalid redirect: " + str(e))

    # Update the redirect
    redirects = await db.get_collection("redirects")

    # Find it
    check = await redirects.find_one({"uuid": redirect.uuid})

    if check is None:
        # The redirect does not exist
        # insert it
        await redirects.insert_one(redirect.dict())
    else:
        # The redirect exists
        # Update it, keeping the logs from the server
        redirect.logs = check["logs"]
        await redirects.update_one({"uuid": redirect.uuid}, {"$set": redirect.dict()})

@misc_router.delete("/delete_redirect", status_code=204)
async def route_delete_redirect(request: Request):
    # Get the request body
    body = await request.json()
    
    # Delete a redirect
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting redirect...")

    db = MongoDB()

    api_key = request.headers["api-key"]

    # Validate the API key
    if not await validate_api_key(db, api_key, "admin"):
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Delete the redirect
    redirects = await db.get_collection("redirects")

    # Delete it
    await redirects.delete_one({"uuid": body["uuid"]})  


@misc_router.get("/get_quizzes")
async def route_get_quizzes():
    # Get the quizzes
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting quizzes...")

    return QUIZ_IDS