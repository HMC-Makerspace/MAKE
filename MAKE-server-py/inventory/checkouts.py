import logging
from typing import Dict
import uuid

from utilities import format_email_template
from db_schema import MongoDB, InventoryItem, Checkout

async def checkout_items(user_uuid: str, item_uuids: Dict[str, int], checkout_start: int, checkout_end: int):
    # Checkout items
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Checking out items...")

    db = MongoDB()

    # Check the user exists
    user_collection = await db.get_collection("users")

    user = await user_collection.find_one({"uuid": user_uuid})

    if user is None:
        # The user does not exist
        # Return error
        return False
    
    # Check the items exist
    inventory_collection = await db.get_collection("inventory")

    # Get the items
    items = await inventory_collection.find({"uuid": {"$in": item_uuids.keys()}}).to_list(None)

    # Check if the items exist
    if len(items) != len(item_uuids):
        # Some items do not exist
        # Return error
        return False
    
    # Check the start time is before the end time
    if checkout_start >= checkout_end:
        # The start time is after the end time
        # Return error
        return False

    # Check out the items by adding to the checkout log
    checkout_collection = await db.get_collection("checkouts")

    checkout_item = Checkout(
        uuid=uuid.uuid4().hex,
        items=item_uuids,
        checked_out_by=user_uuid,
        timestamp_out=checkout_start,
        timestamp_due=checkout_end,
        timestamp_in=None,
    )

    await checkout_collection.insert_one(checkout_item.dict())

    # Return success
    return True

async def edit_checkout(checkout_uuid: str, checkout_start: int, checkout_due: int):
    # Edit a checkout
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Editing checkout...")

    db = MongoDB()

    # Check the checkout exists
    checkout_collection = await db.get_collection("checkouts")

    checkout = await checkout_collection.find_one({"uuid": checkout_uuid})

    if checkout is None:
        # The checkout does not exist
        # Return error
        return False
    
    # Check the start time is before the end time
    if checkout_start >= checkout_due:
        # The start time is after the end time
        # Return error
        return False
    
    # Edit the checkout
    await checkout_collection.update_one(
        {"uuid": checkout_uuid},
        {"$set": {"timestamp_out": checkout_start, "timestamp_due": checkout_due}},
    )

    # Return success
    return True

async def return_items(checkout_uuid: str, return_time: int):
    # Return items
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Returning items...")

    db = MongoDB()

    # Check the checkout exists
    checkout_collection = await db.get_collection("checkouts")

    checkout = await checkout_collection.find_one({"uuid": checkout_uuid})

    if checkout is None:
        # The checkout does not exist
        # Return error
        return False
    
    # Check the items are not already returned
    if checkout["timestamp_in"] is not None:
        # The items are already returned
        # Return error
        return False
    
    # Return the items
    await checkout_collection.update_one(
        {"uuid": checkout_uuid},
        {"$set": {"timestamp_in": return_time}},
    )

    # Return success
    return True

async def send_checkout_email(checkout_uuid: str):
    # Get the checkout
    db = MongoDB()

    checkout_collection = await db.get_collection("checkouts")

    checkout = await checkout_collection.find_one({"uuid": checkout_uuid})

    if checkout is None:
        # The checkout does not exist
        # Return error
        return False
    
    # Get the user
    user_collection = await db.get_collection("users")
    
    user = await user_collection.find_one({"uuid": checkout["checked_out_by"]})
    
    if user is None:
        # The user does not exist
        # Return error
        return False
    
    # Get the items
    inventory_collection = await db.get_collection("inventory")

    items = await inventory_collection.find({"uuid": {"$in": checkout["items"].keys()}}).to_list(None)

    if len(items) != len(checkout["items"]):
        # Some items do not exist
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)
        logging.warning("Some items do not exist")

    # Send the email
    body = format_email_template("expired_checkout", checkout.items())

    try :
        await send_checkout_email(user["email"], body)
    except Exception as e:
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)
        logging.warning("Failed to send checkout email: " + str(e))
        
    # Return success
    return True