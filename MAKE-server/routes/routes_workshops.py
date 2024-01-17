from datetime import datetime,timedelta, timezone
import logging
from utilities import email_user, format_email_template, validate_api_key
from db_schema import *
import requests

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

    collection = await db.get_collection("users")

    user = await collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # This is actually fine as we want to serve anonymous users
        # Set user role to user
        user = {
            "role": "user"
        }
    

    # Remove the rsvp_list from each workshop and replace it with the length of the list
    for workshop in workshops:

        # Remove the rsvp_list if a user
        if user["role"] == "user":
            del workshop["rsvp_list"]
        
        if user["role"] in ["admin", "head_steward", "steward"]:
            workshop["signups"] = len(workshop["rsvp_list"])
            workshop["position"] = workshop["rsvp_list"].index(user_uuid) if user_uuid in workshop["rsvp_list"] else -1

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

@workshops_router.post("/delete_workshop")
async def route_delete_workshop(request: Request):
    # Delete a workshop
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting workshop...")

    # Get the request body
    body = await request.json()

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "workshops")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Get the workshop
    workshop = await collection.find_one({"uuid": body["uuid"]})

    if workshop is None:
        # The workshop does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Workshop does not exist")

    # Delete the workshop
    await collection.delete_one({"uuid": body["uuid"]})

    return


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
    if float(workshop["timestamp_end"]) < datetime.now().timestamp():
        # The workshop has passed
        # Return error
        raise HTTPException(status_code=400, detail="Workshop has already passed")

    users_collection = await db.get_collection("users")
    user = await users_collection.find_one({"uuid": body["user_uuid"]})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=404, detail="User does not exist")

    # Check if you're already signed up for the workshop
    if body["user_uuid"] in workshop["rsvp_list"]:
        # You're already signed up for the workshop
        # Return error
        raise HTTPException(status_code=400, detail="You're already signed up for this workshop")
    
    date_start = datetime.fromtimestamp(float(workshop["timestamp_start"]))
    date_end = datetime.fromtimestamp(float(workshop["timestamp_end"]))

    email_body = format_email_template("workshop_confirmation", {
        "workshop": workshop["title"], 
        "date": date_start.strftime("%A, %B %d, %Y"),
        "time": f"{date_start.strftime('%I:%M %p')} - {date_end.strftime('%I:%M %p')}",
    })

    await email_user(user["email"], [], f"RSVP Confirmation: {workshop['title']}", email_body)

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


@workshops_router.post("/send_custom_workshop_email", status_code=201)
async def route_send_custom_workshop_email(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting workshop...")

    # Get the request body
    body = await request.json()

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "workshops")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the workshops collection
    collection = await db.get_collection("workshops")

    # Get the workshop
    workshop = await collection.find_one({"uuid": body["uuid"]})

    if workshop is None:
        # The workshop does not exist
        # Return error
        raise HTTPException(status_code=404, detail="Workshop does not exist")
    
    # Send email to users
    subject = body["subject"]
    body = body["body"]

    # Replace \n with <br>
    body = body.replace("\n", "<br>")

    for user_uuid in workshop["rsvp_list"]:
        users_collection = await db.get_collection("users")
        user = await users_collection.find_one({"uuid": user_uuid})

        if user is None:
            # The user does not exist
            # Return error
            raise HTTPException(status_code=404, detail="User does not exist")

        try:
            await email_user(user["email"], [], subject, body)
        except:
            pass

    return


@workshops_router.post("/subscribe", status_code=201)
async def route_subscribe(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Subscribing to mailing list...")

    # Get the request body
    body = await request.json()
    email = body["email"]

    '''
    <div id="mc_embed_shell">
    <div id="mc_embed_signup">
        <form action="https://hmc.us21.list-manage.com/subscribe/post?u=68887a68081c3fca3f7e8bc07&amp;id=e616cca7f1&amp;f_id=004de0e6f0" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_self" novalidate="">
            <div id="mc_embed_signup_scroll"><h2>Subscribe</h2>
                <div class="indicates-required"><span class="asterisk">*</span> indicates required</div>
                <div class="mc-field-group"><label for="mce-EMAIL">Email Address <span class="asterisk">*</span></label><input type="email" name="EMAIL" class="required email" id="mce-EMAIL" required="" value=""></div>
    <div hidden=""><input type="hidden" name="tags" value="2962934"></div>
            <div id="mce-responses" class="clear">
                <div class="response" id="mce-error-response" style="display: none;"></div>
                <div class="response" id="mce-success-response" style="display: none;"></div>
            </div><div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_68887a68081c3fca3f7e8bc07_e616cca7f1" tabindex="-1" value=""></div><div class="clear"><input type="submit" name="subscribe" id="mc-embedded-subscribe" class="button" value="Subscribe"></div>
        </div>
    </form>
    </div>
    </div>
    '''

    # Send post request to mailchimp mimicking the form
    form_data = {
        "EMAIL": email,
        "b_68887a68081c3fca3f7e8bc07_e616cca7f1": "",
        "subscribe": "Subscribe"
    }

    response = requests.post("https://hmc.us21.list-manage.com/subscribe/post?u=68887a68081c3fca3f7e8bc07&amp;id=e616cca7f1&amp;f_id=004de0e6f0", data=form_data)

    # Check if the request was successful
    if response.status_code != 200:
        # There was an error
        # Return error
        raise HTTPException(status_code=500, detail="Error subscribing to Mailchimp")

    return