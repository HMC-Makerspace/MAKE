from datetime import datetime, timedelta
import uuid
import logging
from utilities import email_user, format_email_template
from fuzzywuzzy import fuzz
from pymongo import UpdateOne
from db_schema import MongoDB, User
from config import *


async def send_workshop_reminders():
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Sending workshop reminders...")

    # Send workshop reminders
    # Get the workshops collection
    db = MongoDB()

    # Get the collection
    collection = await db.get_collection("workshops")

    # Get all workshops
    workshops = await collection.find().to_list(None)

    # Get the users collection
    users_collection = await db.get_collection("users")

    for workshop in workshops:
        # Check if the workshop has started
        workshop_start = float(workshop["timestamp_start"])

        if workshop_start < datetime.now().timestamp():
            # The workshop has started
            # Skip
            continue

        # Check if less then an hour away
        if workshop_start - datetime.now().timestamp() > 3600:
            # The workshop is more than an hour away
            # Skip
            continue


        # Get the users that have RSVPed to the workshop
        rsvp_list = workshop["rsvp_list"]
        users_notified = workshop["users_notified"] if "users_notified" in workshop else []

        # Get the users in rsvp_list that have not been notified, up to the capacity of the workshop
        users_to_notify = [user for user in rsvp_list[:workshop["capacity"]] if user not in users_notified]
        logging.info(f"Users to notify: {len(users_to_notify)}")

        # We should now have a list of users to notify, up to the capacity of the workshop.
        # After the first round of notifications, this should be an empty list, or one/two users
        # on the waitlist
        users_to_notify = await users_collection.find({"uuid": {"$in": users_to_notify}}).to_list(None)

        # Get the minutes until the workshop starts
        time_until = f"{int((workshop_start - datetime.now().timestamp()) / 60)} minutes"
        body = format_email_template("workshop_reminder", {"workshop": workshop, "time_until":  time_until})

        for user in users_to_notify:
            success = email_user(user["email"], [], f"Reminder: {workshop['name']}", body)

            if success:
                users_notified.append(user["uuid"])


        # Update the workshop
        workshop["users_notified"] = users_notified

        # Update the workshop
        await collection.replace_one({"uuid": workshop["uuid"]}, workshop)
        
