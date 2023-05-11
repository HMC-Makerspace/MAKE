import datetime
import logging
import utilities
from utilities import validate_api_key
from db_schema import *
from machines.loom import render_loom_file

from fastapi import APIRouter, HTTPException, Request

student_storage_router = APIRouter(
    prefix="/api/v2/student_storage",
    tags=["student_storage"],
    responses={404: {"description": "Not found"}},
)

@student_storage_router.get("/get_student_storage")
async def route_get_student_storage(request: Request):
    # Get student_storage
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting student_storage...")

    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "student_storage")
    
    # Validate API key
    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Get the student_storage collection
    collection = await db.get_collection("student_storage")

    # Get all student_storage
    student_storage = await collection.find().to_list(None)

    student_storage = [StudentStorage(**student_storage) for student_storage in student_storage]

    # Return the student_storage
    return student_storage


@student_storage_router.get("/get_student_storage_for_user/{user_uuid}")
async def route_get_student_storage_for_user(request: Request, user_uuid: str):
    # Get student_storage
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting student_storage...")

    db = MongoDB()
    collection = await db.get_collection("student_storage")

    # Get all student_storage by uuid
    student_storage = await collection.find({"checked_out_by": user_uuid}).to_list(None)

    student_storage = [StudentStorage(**student_storage) for student_storage in student_storage]

    # Return the student_storage
    return student_storage