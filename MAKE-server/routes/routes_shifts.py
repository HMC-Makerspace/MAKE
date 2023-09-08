import datetime
import logging
import uuid
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

@shifts_router.post("/drop_shift", status_code=201)
async def route_drop_shift(request: Request):
    # This takes a user uuid and a shift uuid
    # It creates and saves a shift change object
    # This doesn't require a api key because it's a user action
    '''
    class ShiftChange(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    date: str
    timestamp_start: str
    timestamp_end: str
    is_drop: bool
    is_pickup: bool
    steward: str
    '''

    # Get the user uuid
    item = ShiftChange(**await request.json())

    db = MongoDB()

    # Check the steward uuid exists and that they are a steward
    users = await db.get_collection("users")
    user = await users.find_one({"uuid": item.steward})

    if user is None:
        # The user does not exist
        # Return error
        raise HTTPException(status_code=400, detail="User does not exist")
    
    if "steward" not in user["role"]:
        # The user is not a steward
        # Return error
        raise HTTPException(status_code=400, detail="User is not a steward")
    
    # Check the shift uuid exists
    shifts = await db.get_collection("shifts")

    if shifts is None:
        # No shifts exist
        # Return error
        raise HTTPException(status_code=400, detail="Shift does not exist")
    
    '''
    class Shift(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    timestamp_start: str
    timestamp_end: str
    day: str
    stewards: List[str]
    '''

    day_name = datetime.datetime.strptime(item.date, "%Y-%m-%d").strftime("%A")

    shift = await shifts.find_one({"day": day_name, "timestamp_start": item.timestamp_start, "timestamp_end": item.timestamp_end})

    if shift is None:
        # The shift does not exist
        # Return error
        raise HTTPException(status_code=400, detail="Shift does not exist")
    
    # Check that the steward is in the shift
    if item.steward not in shift["stewards"]:
        # The steward is not in the shift
        # Return error
        raise HTTPException(status_code=400, detail="Steward is not in the shift")
    

    # Check that the steward is not already in the shift change collection with the same day, start, and end
    shift_changes = await db.get_collection("shift_changes")
    shift_change = await shift_changes.find_one({"date": item.date, "timestamp_start": item.timestamp_start, "timestamp_end": item.timestamp_end, "steward": item.steward})

    if shift_change is not None:
        # The shift change already exists
        # Return error
        raise HTTPException(status_code=400, detail="Shift change already exists")
    
    # Insert the shift change object into the database
    await shift_changes.insert_one(item.dict())

    return
