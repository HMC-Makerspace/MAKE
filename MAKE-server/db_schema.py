from typing import Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field
import motor.motor_asyncio
from typing import Union

from config import DB_NAME

class MongoDB():
    def __init__(self):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(
            "mongodb://localhost:27017")
        self.db = self.client[DB_NAME]

    def __del__(self):
        self.client.close()

    async def get_collection(self, name: str) -> Union[motor.motor_asyncio.AsyncIOMotorCollection, None]:
        # Get a collection from the database
        # Returns None if the collection does not exist
        collections = await self.db.list_collection_names()
        if name in collections:
            return self.db[name]
        else:
            return None
        
schema = [
    'quiz_updates',
    'inventory',
    'restock_requests',
    'users',
    'quizzes',
    'checkouts',
    'student_storage',
    'shifts',
    'shift_changes',
    'workshops',
    'printer_logs',
    'filament_logs',
    'api_keys'
]

# Convert ObjectIds to strings before storing them as the _id.


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


'''
Define the schema for the database.
 The database should hold these classes:
    last_scrape_update: datetime,
    inventory: List[InventoryItem],
    restock_requests: List[RestockRequest],
    users: List[User],
    quizzes: List[QuizResponse],
    checkouts: List[Checkout],
    student_storage: List[StudentStorage],
    shifts: List[Shift],
    workshops: List[Workshop],
    printer_logs: List[PrinterLog],
    api_keys: List[APIKey],
'''

'''
The inventory class is used to store information about the items in the inventory.
The following fields are stored:
- uuid: The uuid of the item
- Name: The name of the item
- Tool / Material / Kit: Whether the item is a tool, material, or kit
- Quantity (#, Low, Medium, High): The quantity of the item
- Location (room): The room where the item is located
- Location (specific): The specific location of the item
- URL (optional): A link to a page about the item
- Specific Name (optional): A specific name for the item
- Serial Number (optional): The serial number of the item
- Brand (optional): The brand of the item
- Model Number (optional): The model number of the item
- QR Code: The QR code of the item
- Kit Ref.: The kit that the item belongs to

If the item is a kit, the following fields are stored:
- Kit Contents: A list of the items in the kit

'''


class InventoryItem(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    name: str
    role: Union[str, None]
    # Quantity can be a number or a string
    quantity: Union[str, None]
    in_overstock: Union[bool, None]
    overstock_quantity: Union[str, None]
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

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "name": "Soldering Iron",
                "role": "Tool",
                "quantity": "Medium",
                "location_room": "Cage",
                "location_specific": "Shelf 1",
                "reorder_url": "https://www.amazon.com/HiLetgo-Adjustable-Temperature-Soldering-Station/dp/B07B4J2YQY/ref=sr_1_3?dchild=1&keywords=soldering+iron&qid=1610000000&sr=8-3",
                "specific_name": "HiLetGo Adjustable Soldering Iron",
                "serial_number": "123456789",
                "brand": "HiLetGo",
                "model_number": "123456789",
                "qr_code": "AUTHENTIC/121313",
                "kit_ref": "None",
                "kit_contents": []
            }
        }


'''
The users class is used to store information about the users of the system.
The following fields are stored:
- uuid: The uuid of the user
- Name: The name of the user
- Email: The email of the user
- CX ID: The CX ID of the user
- Role: The role of the user. Either user, steward, head_steward, or admin
- Quizzes: A list of the quizzes that the user has taken & passed

If the user is a Steward or Head Steward, the following fields are stored:
- Proficiencies: A list of the proficiencies that the user has
'''


class User(BaseModel):
    __id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    name: str
    email: str
    cx_id: int
    role: str
    passed_quizzes: Dict[str, str]
    proficiencies: Union[List[str], None]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "name": "John Doe",
                "email": "john@g.hmc.edu",
                "cx_id": "123456789",
                "role": "user",
                "passed_quizzes": {
                    "431278492": "1231234124",
                },
                "proficiencies": ["3D Printing", "Laser Cutting"]
            }
        }


'''
The restock_requests class is used to store information about the restock requests.
The following fields are stored:
- uuid: The uuid of the restock request
- Items Requested: A list of the items requested
- Requested By: The name of the user who requested the restock
- Requested By Email: The email of the user who requested the restock
- Sent: Whether the request has been sent to management

'''


class RestockRequest(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    items_requested: str
    requested_by: str
    requested_by_email: str
    timestamp_sent: int
    timestamp_completed: Union[int, None]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "items_requested": ["Soldering Iron"],
                "requested_by": "John Doe",
                "requested_by_email": "john@g.hmc.edu",
                "timestamp_sent": 1610000000,
                "timestamp_completed": None
            }
        }


'''
The quizzes class is used to store information about the quizzes.
The following fields are stored:
- GID: The google sheet ID of the quiz
- Email: The email of the user who took the quiz
- Name: The name of the user who took the quiz
- Timestamp: The timestamp of when the quiz was taken
- CX ID: The CX ID of the user who took the quiz
- Score: The score of the quiz
- Passed: Whether the user passed the quiz
'''


class QuizResponse(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    gid: str
    email: str
    name: str
    timestamp: int
    cx_id: int
    score: str
    passed: bool

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "gid": "2100779718",
                "email": "john@g.hmc.edu",
                "name": "John Doe",
                "timestamp": "2021-01-01 00:00:00",
                "cx_id": "123456789",
                "score": "7/7",
                "passed": True
            }
        }


'''
The shifts class is used to store information about the shifts.
The following fields are stored:
- Timestart: The start time of the shift
- Timeend: The end time of the shift
- Day: The day of the shift
- Stewards: A list of uuids of the stewards working the shift
'''


class Shift(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    timestamp_start: str
    timestamp_end: str
    day: str
    stewards: List[str]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "timestamp_start": "10:00 AM",
                "timestamp_end": "12:00 PM",
                "day": "Monday",
                "stewards": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"]
            }
        }


class ShiftChange(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    date: str
    timestamp_start: str
    timestamp_end: str
    is_drop: bool
    is_pickup: bool
    steward: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "date": "2023-01-01",
                "timestamp_start": "10:00 AM",
                "timestamp_end": "12:00 PM",
                "is_drop": True,
                "is_pickup": False,
                "steward": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"
            }
        }
'''
The checkouts class is used to store information about the checkouts.
The following fields are stored:
- uuid: The uuid of the checkout
- Items: A list of uuids of the items checked out. Each item is a dictionary with the following fields:
    - uuid: The uuid of the item
    - Quantity: The quantity of the item
- Checked Out By: The uuid of the user who checked out the items
- Timestamp Out: The timestamp of when the items were checked out
- Timestamp Due: The timestamp of when the items are due
- Timestamp In: The timestamp of when the items were checked in
'''


class Checkout(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    items: Dict[str, int]
    checked_out_by: str
    timestamp_out: str
    timestamp_due: str
    timestamp_in: Union[str, None]
    notifications_sent: int
    renewals_left: Optional[int]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "items": [
                    {
                        "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l": 1
                    }
                ],
                "checked_out_by": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "timestamp_out": "165231121",
                "timestamp_due": "165231121",
                "timestamp_in": None,
                "notifications_sent": 2,
                "renewals_left": 3,
            }
        }


'''
StudentStorage class is used to store information about the student storage reservations
The following fields are stored:
- uuid: The uuid of the reservation
- Space: The space that the reservation is for
- Student: The uuid of the student who made the reservation
- Timestamp: The timestamp of when the reservation was made
- Timestamp Due: The timestamp of when the reservation is due
- Timestamp In: The timestamp of when the reservation was checked in
- Renewals Left: The number of times the reservation can be renewed
'''


class StudentStorage(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    space: str
    checked_out_by: str
    timestamp: str
    timestamp_due: str
    timestamp_in: Union[str, None]
    renewals_left: int

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "space": "A1",
                "checked_out_by": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "timestamp": "2021-01-01 00:00:00",
                "timestamp_due": "2021-01-01 00:00:00",
                "timestamp_in": "2021-01-01 00:00:00",
                "renewals_left": 1
            }
        }


'''
Workshop class is used to store information about the workshops.
The following fields are stored:
- uuid: The uuid of the workshop
- Name: The name of the workshop
- Description: The description of the workshop
- Stewards: A list of uuids of the stewards who are leading the workshop
- Timestamp: The timestamp of when the workshop is scheduled
- Length: The length of the workshop in minutes
- Capacity: The capacity of the workshop
'''


class Workshop(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    name: str
    description: str
    stewards: List[str]
    timestamp: str
    length: int
    capacity: int

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "name": "Soldering Workshop",
                "description": "Learn how to solder!",
                "stewards": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"],
                "timestamp": "2021-01-01 00:00:00",
                "length": 60,
                "capacity": 10
            }
        }


'''
Printer log class is used to store information about the printer logs.
This will serve both 3d printer and large format printer logs.
The following fields are stored:
- uuid: The uuid of the printer log
- Printer: The uuid of the printer that the log is for
- User: The uuid of the user who printed the file
- File name: The name of the file that was printed
- Timestamp: The timestamp of when the file was printed
- Printer data: The data that the printer sent to the server, in JSON format
'''


class PrinterLog(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    printer: str
    user: str
    file_name: str
    timestamp: str
    printer_data: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "printer": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "file_name": "test.gcode",
                "timestamp": "2021-01-01 00:00:00",
                "printer_Data": "{'test': 'test'}"
            }
        }


'''
API Keys class is used to store information about the API keys.
The following fields are stored:
- uuid: The uuid of the API key
- Name: The name of the API key
- Key: The API key
- Scope: The scope of the API key. Scopes can be:
    - admin: Can access all endpoints
    - users: Can access user endpoints
    - checkout: Can access checkout endpoints
    - studentstorage: Can access student storage endpoints
    - steward: Can access steward-level
    - printer: Can access printer endpoints
'''

class APIKey(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    name: str
    key: str
    scope: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "name": "API Key",
                "key": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "scope": "admin"
            }
        }
