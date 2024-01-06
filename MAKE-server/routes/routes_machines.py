import logging
from utilities import validate_api_key
from db_schema import *
import datetime

from fastapi import APIRouter, HTTPException, Request

machines_router = APIRouter(
    prefix="/api/v2/machines",
    tags=["machines"],
    responses={404: {"description": "Not found"}},
)

@machines_router.get("/add_filament_log/{kgs}")
async def route_add_filament_log(request: Request, kgs: float):
    # Add a filament log
    # This is a GET request to make it easier to
    # use with arduino
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Adding filament log...")

    # Get the filament logs collection
    db = MongoDB()
    collection = await db.get_collection("filament_logs")

    to_insert = {
        "kgs": kgs,
        "time": datetime.datetime.now().timestamp()
    }

    # Add the filament log
    await collection.insert_one(to_insert)

    return


@machines_router.get("/status")
async def route_get_status(request: Request):
    # Get the status of all the machines
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting machine status...")

    # Get the machines collection
    db = MongoDB()
    collection = await db.get_collection("machines")

    # Get the status of all the machines
    machines = await collection.find().to_list(length=None)

    # Return the status of all the machines
    return machines
