import datetime
import logging
import utilities
from utilities import validate_api_key
from db_schema import *
from machines.loom import render_loom_file

from fastapi import APIRouter, HTTPException, Request

shifts_router = APIRouter(
    prefix="/api/v2/shifts",
    tags=["shifts"],
    responses={404: {"description": "Not found"}},
)

@shifts_router.get("/get_shift_schedule")
async def route_get_shift_schedule(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Getting checkout...")

    db = MongoDB()
    shifts = await db.get_collection("shifts")
    users = await db.get_collection("users")

    shifts = await shifts.find().to_list(None)
    shifts = [Shift(**shift) for shift in shifts]

    censored_shifts = []
    # Go over each shift, and get the stewards from the UUID list in stewards field
    # Replace the UUID list with the user names
    for shift in shifts:
        shift = shift.dict()

        shift_stewards = [await users.find_one({"uuid": steward}) for steward in shift["stewards"]]
        shift["proficiencies"] = []

        names = []
        head_steward = False
        # Censor last names and add in proficiencies
        for steward in shift_stewards:
            try:
                shift["proficiencies"] += steward["proficiencies"]
            except:
                pass

            if " " in steward["name"]:
                # Censor the last name
                names.append(steward["name"].split(" ")[0])
            else:
                names.append(steward["name"])

            if steward["role"] == "head_steward":
                head_steward = True
            
        
        # Remove duplicates
        shift["proficiencies"] = list(set(shift["proficiencies"]))
        shift["stewards"] = names
        shift["head_steward"] = head_steward

        censored_shifts.append(shift)


    return censored_shifts

@shifts_router.get("/get_full_shift_schedule")
async def route_get_full_shift_schedule(request: Request):
    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "admin")

    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    shifts = await db.get_collection("shifts")

    if shifts is None:
        return []

    shifts = await shifts.find().to_list(None)

    shifts = [Shift(**shift) for shift in shifts]

    return shifts

@shifts_router.post("/update_shift_schedule", status_code=201)
async def route_update_shift_schedule(request: Request):
    # Get the API key
    api_key = request.headers["api-key"]
    db = MongoDB()

    is_valid = await validate_api_key(db, api_key, "admin")

    if not is_valid:
        # Invalid API key
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    shifts = await db.get_collection("shifts")

    new_shifts = await request.json()

    # Validate each shift object
    try :
        for shift in new_shifts:
            shift = Shift(**shift)
    except:
        # Invalid shift object
        # Return error
        raise HTTPException(status_code=400, detail="Invalid shift object")

    # Overwrite the shifts collection with the new shifts
    if shifts is None:
        # It's the first time we're adding shifts
        shifts = await db.create_collection("shifts")
    else:
        # It's not the first time
        # Drop the shifts collection
        await shifts.drop()
        await shifts.insert_many(new_shifts)

    return

@shifts_router.get("/get_shifts_for_steward/{steward_uuid}")
async def route_get_shifts_for_steward(request: Request, steward_uuid: str):
    db = MongoDB()

    shifts = await db.get_collection("shifts")

    if shifts is None:
        return []
    
    # Find and return all shifts where the "stewards" field contains the steward's UUID
    # The stewards field is a list of UUIDs, so we can use the $in operator
    shifts = await shifts.find({"stewards": {"$in": [steward_uuid]}}).to_list(None)

    shifts = [Shift(**shift) for shift in shifts]

    return shifts

@shifts_router.get("/get_shift_changes")
async def route_get_shift_changes(request: Request):
    db = MongoDB()

    shift_changes = await db.get_collection("shift_changes")

    if shift_changes is None:
        return []
    
    shift_changes = await shift_changes.find().to_list(None)

    shift_changes = [ShiftChange(**shift_change) for shift_change in shift_changes]

    return shift_changes

@shifts_router.post("/drop_shift")
async def route_drop_shift(request: Request):
    db = MongoDB()

    