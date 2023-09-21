import datetime
import logging
from typing import Dict
import uuid

from utilities import format_email_template
from db_schema import MongoDB, InventoryItem, Checkout

from utilities import email_user

async def send_checkout_email(checkout_uuid: str):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Sending checkout email...")
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
    
    logging.info("Sending checkout email to " + user["email"] + "...")

    # Get the items
    inventory_collection = await db.get_collection("inventory")

    items = await inventory_collection.find({"uuid": {"$in": list(checkout["items"].keys())}}).to_list(None)
    if len(items) != len(checkout["items"]):
        # Some items do not exist
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)
        logging.warning("Some items do not exist")

    # Send the email
    body = await format_email_template("expired_checkout", [item["name"] for item in items])

    try :
        await email_user(user["email"], [], f"MAKE Tool Checkout Notification #{checkout['notifications_sent'] + 1}", body)
    except Exception as e:
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)   
        logging.warning("Failed to send checkout email: " + str(e))
        return False

    # Return success
    return True


async def send_overdue_emails():
    # Go through all checkouts and send emails, updating the notifications_sent field
    # If the number of days overdue is greater than the number of notifications sent, send an email
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Sending overdue emails...")

    # Get the checkouts
    db = MongoDB()

    checkout_collection = await db.get_collection("checkouts")

    # Find checkouts that timestamp_in is not None and timestamp_out is not None
    checkouts = await checkout_collection.find({"timestamp_in": {"$eq": None}, "timestamp_out": {"$ne": None}}).to_list(None)

    checkouts = [Checkout(**checkout) for checkout in checkouts]

    for checkout in checkouts:
        # Calculate the number of days overdue
        timestamp_now = float(datetime.datetime.now().timestamp())

        days_overdue = (timestamp_now - float(checkout.timestamp_due)) / (60 * 60 * 24)

        if days_overdue > checkout.notifications_sent:
            # Send an email
            email_success = await send_checkout_email(checkout.uuid)

            if email_success:
                # Update the notifications_sent field
                logging.info("Successfully sent email")
                await checkout_collection.update_one({"uuid": checkout.uuid}, {"$set": {"notifications_sent": checkout.notifications_sent + 1}})
            else:
                # Show warning
                logging.getLogger().setLevel(logging.WARNING)
                logging.warning("Failed to send email")