import datetime
import logging
import uuid
from utilities import validate_api_key
from inventory.inventory import email_user_restock_request_complete
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

inventory_router = APIRouter(
    prefix="/api/v2/inventory",
    tags=["inventory"],
    responses={404: {"description": "Not found"}},
)

@inventory_router.get("/get_inventory")
async def route_get_inventory():
    # Get the inventory
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting inventory...")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Get all inventory items
    inventory_items = await collection.find().to_list(None)

    inventory_items = [InventoryItem(**item) for item in inventory_items]

    # Return the inventory items
    return inventory_items


@inventory_router.get("/get_inventory_item/{item_uuid}")
async def route_get_inventory_item(item_uuid: str):
    # Get an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting inventory item...")

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")

    # Get the inventory item
    inventory_item = await collection.find_one({"uuid": item_uuid})

    if inventory_item is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Inventory item does not exist")

    # Return the inventory item
    return inventory_item


@inventory_router.post("/create_inventory_item")
async def route_create_inventory_item(request: Request):
    # Create an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating inventory item...")
    item = InventoryItem(**await request.json())

    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item.uuid})

    if check is not None:
        # The inventory item already exists
        # Return error
        raise HTTPException(
            status_code=409, detail="Inventory item already exists")

    # Create the inventory item
    await collection.insert_one(item.dict())

    return

@inventory_router.post("/update_inventory_item", status_code=200)
async def route_update_inventory_item(request: Request):
    # Update an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating inventory item...")

    item = None

    try:
         item = InventoryItem(**await request.json())
    except Exception as e:
         # The request body is invalid
         # Return error
         raise HTTPException(
             status_code=400, detail="Invalid request body: " + str(e))

    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item.uuid})


    data = await request.json()

    if check is None:
        # The inventory item does not exist
        # Insert the inventory item after validating it
        await collection.insert_one(item.dict())
    else:
        # If this item changed from not being low to low - first confirm it was done through form submission
        original_quantity = check["quantity_total"]
        new_quantity = item.quantity_total
        
        if original_quantity != new_quantity:
            if new_quantity < 0 and not data.get("automated_restock", False):
                raise HTTPException(
                    status_code=400,
                    detail="Manual setting of negative quantity values is not allowed. Please use the restock popup."
                )

        # If all checks passed, then proceed to change the quantity 
        await collection.replace_one({"uuid": item.uuid}, item.dict())

        # and handle restock logic
        if original_quantity != new_quantity:
            if new_quantity == -1:
                restock_quantity = data.get("restock_quantity")
                restock_note = data.get("restock_note")
                await create_automated_restock_request(db, item, quantity=restock_quantity, note=restock_note)
            elif new_quantity != -1:
                await complete_automated_restock_request(db, item.uuid)

    return


@inventory_router.delete("/delete_inventory_item/{item_uuid}")
async def route_delete_inventory_item(item_uuid: str, request: Request):
    # Delete an inventory item
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Deleting inventory item...")

    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the inventory collection
    collection = await db.get_collection("inventory")

    # Check if the inventory item already exists
    check = await collection.find_one({"uuid": item_uuid})

    if check is None:
        # The inventory item does not exist
        # Return error
        raise HTTPException(
            status_code=404, detail="Inventory item does not exist")

    # Delete the inventory item
    await collection.delete_one({"uuid": item_uuid})

    # Return the inventory item
    return


# AMBA : new function created to 
async def create_automated_restock_request(db: MongoDB, item: InventoryItem, quantity: Optional[int] = None, note: Optional[str] = None) -> None:
    """
    Creates an automated restock request for the given inventory item.
    """
    logging.info(f"TEXTTTTTTT for Restock Request: {item}")
    # Create a restock request using the item's UUID
    restock = RestockRequest(
        item_uuid=item.uuid,
        uuid=str(uuid.uuid1()),
        timestamp_sent=datetime.datetime.now().timestamp(),
        reason=note or "",                     #  use note from popup
        item=item.name,                       #  use item name, not full object
        quantity=quantity if quantity else "?",  #  use quantity from popup
        authorized_request=True,
        user_uuid="automatedrestock",  # indicates an automated restock request 
        reorder_url = item.reorder_url      
    )
        
    restock_collection = await db.get_collection("restock_requests")
    await restock_collection.insert_one(restock.dict())


@inventory_router.get("/get_restock_requests")
async def route_get_restock_requests(request: Request):
    # Get the restock requests
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting restock requests...")

    # Get the restock collection
    db = MongoDB()
    api_key = request.headers["api-key"]
    is_valid = await validate_api_key(db, api_key, "inventory")

    if not is_valid:
        # The API key is invalid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    collection = await db.get_collection("restock_requests")

    # Get all restock requests
    restock_requests = await collection.find().to_list(None)

    restock_requests = [RestockRequest(**request) for request in restock_requests]
    
    # Return the restock requests
    return restock_requests

@inventory_router.post("/add_restock_request", status_code=201)
async def route_add_restock_notice(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Adding restock notice...")
    # Get the restock collection
    db = MongoDB()
    collection = await db.get_collection("restock_requests")

    authorized_request = False

    if "api-key" in request.headers:
        # The request is authorized

        # Get the API key
        api_key = request.headers["api-key"]

        # Validate the API key
        authorized_request = await validate_api_key(db, api_key, "inventory")

    body = await request.json()

    restock = {}
    restock["uuid"] = str(uuid.uuid4())
    restock["item"] = body["item"]
    restock["quantity"] = body["quantity"]
    restock["reason"] = body.get("reason", "")
    restock["timestamp_sent"] = datetime.datetime.now().timestamp()
    restock["timestamp_completed"] = None
    restock["completion_note"] = None
    restock["is_approved"] = None
    restock["authorized_request"] = authorized_request


    if not authorized_request:
        # The request is not authorized
        # Check if the request is from a user
        if "user_uuid" in body:
            # The request is from a user
            # Get the users collection
            users = await db.get_collection("users")

            # Get the user
            user = await users.find_one({"uuid": body["user_uuid"]})

            if user is None:
                # The user does not exist
                # Return error
                raise HTTPException(
                    status_code=404, detail="User does not exist")


            # Add the user to the restock request
            restock["user_uuid"] = user["uuid"]
    else:
        restock["user_uuid"] = None

    restock = RestockRequest(**restock)

    # Add to the restock collection
    await collection.insert_one(restock.dict())

    return



async def complete_automated_restock_request(db: MongoDB, item_uuid: str) -> None:
    logging.info(f"Completing automated restock request for item: {item_uuid}")
    restock_collection = await db.get_collection("restock_requests")
    
    # Locate the pending automated restock request associated with this inventory item.
    pending_request = await restock_collection.find_one({
         "item_uuid": item_uuid,
         "user_uuid": "automatedrestock",
         "timestamp_completed": None
    })
    
    if pending_request is None:
        logging.info(f"No pending automated restock request found for item: {item_uuid}")
        return


    # Mark the request as completed.
    pending_request["timestamp_completed"] = datetime.datetime.now().timestamp()
        # Append kiosk note to existing one (if any)
    combined_note = (pending_request.get("completion_note") or "") + "\nCompleted from kiosk."
    pending_request["completion_note"] = combined_note
    pending_request["is_approved"] = True
    await restock_collection.replace_one({"uuid": pending_request["uuid"]}, pending_request)
    logging.info(f"Restock request {pending_request['uuid']} Completed from kiosk.")


@inventory_router.post("/complete_restock_request", status_code=201)
async def route_complete_restock_request(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Completing restock notice...")
    
    db = MongoDB()
    collection = await db.get_collection("restock_requests")
    
    if "api-key" in request.headers:
        api_key = request.headers["api-key"]
        if await validate_api_key(db, api_key, "inventory") is False:
            raise HTTPException(status_code=401, detail="Invalid API key")
    
    body = await request.json()
    request_uuid = body.get("uuid")
    
    # Retrieve the restock request by its uuid
    restock = await collection.find_one({"uuid": request_uuid})
    if restock is None:
        raise HTTPException(
            status_code=404, detail="Restock request does not exist")
    
    # Check if the request has already been processed
    if restock["timestamp_completed"] is not None:
        raise HTTPException(
            status_code=400, detail="Restock request has already been completed")
    
    # Get the action from the payload (e.g. "deny" or "ordered")
    action = body.get("action")
   
    # Get an optional note (if any)
    note = body.get("completion_note", "")
    restock["completion_note"] = ("\n" + note)
    
    if action == "deny":
        # If denied, mark as completed with a note "denied"
        restock["timestamp_completed"] = datetime.datetime.now().timestamp()
        restock["is_approved"] = False
    elif action == "order":
        # If ordered, mark as ordered
        restock["timestamp_ordered"] = datetime.datetime.now().timestamp()
        restock["is_approved"] = True
    elif action == "complete":
        restock["timestamp_completed"] = datetime.datetime.now().timestamp()

    await collection.replace_one({"uuid": restock["uuid"]}, restock)

   # do not attempt to email for automated restocks
    if restock["user_uuid"] == 'automatedrestock':
        return 

    elif restock["user_uuid"] is not None:
        # The restock request is from a user
        # Get the users collection
        users = await db.get_collection("users")

        # Get the user
        user = await users.find_one({"uuid": restock["user_uuid"]})

        if user is None:
            # The user does not exist
            # Return error
            raise HTTPException(
                status_code=404, detail="User does not exist")

        # Email the user
        success_email = await email_user_restock_request_complete(restock, user)

        if not success_email:
            # The email failed to send
            # Return error
            raise HTTPException(
                status_code=500, detail="Failed to send email")

    return
    


