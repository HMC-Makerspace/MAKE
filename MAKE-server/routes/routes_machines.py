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