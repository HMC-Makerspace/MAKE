import csv
from datetime import datetime
import logging
from typing import List
from utilities import format_email_template, email_user
import aiohttp
from db_schema import MongoDB, QuizResponse, RestockRequest
from config import *
from uuid import uuid4

async def update_inventory_from_checkouts():
    # Update the inventory from the checkouts
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating inventory from checkouts...")

    # Get the checkouts collection
    db = MongoDB()
    collection = await db.get_collection("checkouts")
    # Only get the checkouts that have not been returned
    all_checkouts = await collection.find({"timestamp_in": None}).to_list(None)

    # Get the inventory collection
    inventory_collection = await db.get_collection("inventory")
    all_inventory = await inventory_collection.find().to_list(None)

    # Go through the checkouts and update the inventory
    # Each item has quantity_total and quantity_available
    # First, just count uuids and subtract from quantity_total to set quantity_available
    uuid_dict = {}
    for checkout in all_checkouts:
        for item in checkout["items"]:
            if item in uuid_dict:
                uuid_dict[item] += 1
            else:
                uuid_dict[item] = 1

    # Go through the inventory and update the quantity_available
    for item in all_inventory:
        if item["uuid"] in uuid_dict:
            item["quantity_checked_out"] = uuid_dict[item["uuid"]]    
        else:
            item["quantity_checked_out"] = 0

        # Update the item
        await inventory_collection.update_one(
            {"uuid": item["uuid"]},
            {"$set": {"quantity_checked_out": item["quantity_checked_out"]}},
        )

    logging.info("Updated inventory from checkouts")


async def update_from_gsheet():
    # Update the mongodb database from the google sheet
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Updating database from google sheet...")

    # Scrape the google sheet
    async with aiohttp.ClientSession() as session:
        async with session.get(SHEET_URL) as resp:
            text = await resp.text()

    # Parse the csv
    csv_reader = csv.reader(text.splitlines(), delimiter=",")
    rows = list(csv_reader)

    # Drop the first row
    rows = rows[1:]

    # Get the inventory collection
    db = MongoDB()
    collection = await db.get_collection("inventory")
    all_inventory = await collection.find().to_list(None)

    """
    class InventoryItem(BaseModel):
        _id: Optional[PyObjectId] = Field(alias="_id")
        uuid: str
        name: str
        role: Union[str, None]
        # Quantity can be a number or a string
        quantity: Union[str, None]
        in_overstock: bool
        is_numbered: bool
        location_room: Union[str, None]
        location_specific: Union[str, None]
        reorder_url: Union[str, None]
        specific_name: Union[str, None]
        serial_number: Union[str, None]
        brand: Union[str, None]
        model_number: Union[str, None]
        qr_code: Union[str, None]
        kit_ref: Union[str, None]
        kit_contents: Union[List[str], None]
    """

    # Go through the collection and match to a row in the csv by name
    # If the item is not found, create it
    # If the item is found, update it
    # If no item matches, log a warning
    num_items_created = 0
    num_items_updated = 0

    for row in rows:

        if row[0].strip() == "":
            # Skip blank rows
            continue

        # Find the item in the csv
        found = False
        for item in all_inventory:
            if row[0] == item["name"]:
                found = True

                new_item = await item_from_row(row, uuid=item["uuid"])

                # Update the item
                await collection.update_one({"uuid": item["uuid"]}, {"$set": new_item})

                # Increment the number of items updated
                num_items_updated += 1

                # Break out of the loop
                break

        if not found:
            # Create a new item
            new_item = await item_from_row(row)

            # Insert the new item
            await collection.insert_one(new_item)

            # Increment the number of items created
            num_items_created += 1

    logging.info(f"Updated {num_items_updated} items")
    logging.info(f"Created {num_items_created} items")


async def item_from_row(row: List[str], uuid=None) -> dict:
    # Update the item with all fields that are in the object
    """
    Example first 2 lines:
    Name	Tool / Material (T/M)	Kit Ref.	Quanity (#, Low / Med / High)	Location (room)	Location (specific)	Overstock closet?	Is Numbered?	URL (optional)	Specific Name (optional)	Serial Number (optional)	Brand (optional)	Model Number (optional)	UUID
    Case, O-Connor Matte Box Kit	T		1	Studio	Studio 5, Shelf 2	FALSE
    Case, Shape Matte Box Kit	T	Matte Box Kit, Shape	1	Studio	Studio 5, Shelf 1	FALSE
    """

    if uuid is None:
        uuid = uuid4().hex

    quantity = row[3].lower()

    if quantity == "low":
        quantity = -1
    elif quantity == "medium":
        quantity = -2
    elif quantity == "high":
        quantity = -3
    else:
        try:
            quantity = int(quantity)
        except ValueError:
            quantity = 0

    in_overstock = row[6].lower() == "true"
    is_numbered = row[7].lower() == "true"

    # Create a new item with the updated fields
    new_item = {
        "uuid": uuid,
        "name": row[0],
        "role": row[1],
        "quantity": quantity,
        "in_overstock": in_overstock,
        "is_numbered": is_numbered,
        "location_room": row[4],
        "location_specific": row[5],
        "reorder_url": row[8],
        "specific_name": row[9],
        "serial_number": row[10],
        "brand": row[11],
        "model_number": row[12],
        "qr_code": row[13],
        "kit_ref": row[2],
        "kit_contents": row[14].split(", "),
    }

    return new_item


async def email_user_restock_request_complete(restock: dict, user: dict):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Sending checkout email...")
    # Get the checkout
    db = MongoDB()

    logging.info("Sending restock request complete email to " + user["email"] + "...")

    # Use the restock_completion template
    approved_or_denied = "approved" if restock["is_approved"] else "denied"
    approved_or_denied += ". "

    if restock["completion_note"]:
        approved_or_denied += (
            "Note from manager: <i>" + restock["completion_note"] + "</i>"
        )

    if restock["is_approved"]:
        approved_or_denied += (
            "<br><br>The item has been ordered and will be restocked soon."
        )

    date = datetime.fromtimestamp(float(restock["timestamp_sent"])).strftime("%m/%d/%Y")

    body = format_email_template(
        "restock_completion",
        {
            "name": user["name"],
            "date": date,
            "item": restock["item"],
            "approved_or_denied": approved_or_denied,
        },
    )

    try:
        await email_user(user["email"], [], f"Completed Restock Request ({date})", body)
    except Exception as e:
        # Show warning
        logging.getLogger().setLevel(logging.WARNING)
        logging.warning("Failed to send checkout email: " + str(e))
        return False

    # Return success
    return True
