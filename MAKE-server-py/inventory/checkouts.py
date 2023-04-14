import logging
from typing import Dict
import uuid

from utilities import format_email_template
from db_schema import MongoDB, InventoryItem, Checkout

from utilities import email_user

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
        await email_user(user["email"], [], f"MAKE Tool Checkout Notification #{checkout.notifications_sent}", body)
    except Exception as e:
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)
        logging.warning("Failed to send checkout email: " + str(e))

    # Return success
    return True