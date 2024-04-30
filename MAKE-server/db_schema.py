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
    'status',
    'machines',
    'quiz_updates',
    'inventory',
    'restock_requests',
    'users',
    'user_files',
    'server_files',
    'quizzes',
    'checkouts',
    'student_storage',
    'shifts',
    'shift_changes',
    'workshops',
    'printer_logs',
    'filament_logs',
    'api_keys',
    'ip_logs',
    'reservations',
    'redirects',
]


STATUS_TEMPLATE = {
    "motd": "Welcome to make.hmc.edu",
    "is_open": False,
}

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

class Location(BaseModel):
    room: str
    container: Union[str, None]
    specific: Union[str, None]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "room": "Studio",
                "specific": "Cabinet A",
                "container": "Drawer 1"
            }
        }


class InventoryItem(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    """
    Main attributes
    """
    uuid: str
    # Short name of item
    name: str
    # Contains brand, exact type, etc.
    long_name: Union[str, None]
    # Tool, Material, Kit (T/M/K)
    role: str
    # 0: cannot check out, in the space
    # 1: can check out for use in the space
    # 2: can check out and take home
    # 3: can take home without checking out
    # 4: needs approval to check out (welders, loom computer, cameras, etc.)
    # 5: staff only use
    access_type: int

    """
    Physical Attributes
    """
    # Quantity above 0, or -1 for low, -2 for medium, -3 for high
    quantity_total: int
    # Updated when checked out, checked in, or restocked
    # If it's negative, just assign it to the quantity_total
    quantity_available: int
    # Location of the item
    locations: List[Location]

    """
    Data Attributes
    """
    # URL to reorder the item
    reorder_url: Union[str, None]
    # Serial Number
    serial_number: Union[str, None]
    # Kit Contents, list of uuids of other items in the kit
    # if the item is a kit (K)
    kit_contents: Union[List[str], None]
    # Keywords
    keywords: Union[List[str], None]


    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j8k8l",
                "name": "Soldering Iron",
                "long_name": "Weller WES51",
                "role": "T",
                "access_type": 0,
                "quantity_total": 10,
                "quantity_available": 7,
                "locations": [
                    {
                        "room": "Electronic Benches",
                        "specific": "Cabinet A",
                        "container": "Drawer 1"
                    }
                ],
                "reorder_url": "https://www.digikey.com/en/products/detail/weller-tools-inc/WES51/128618",
                "serial_number": "1234567890",
                "kit_contents": None
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
    files: Union[List[object], None]
    availability: Union[List[List[bool]], None]

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


class UserFile(BaseModel):
    __id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    name: str
    timestamp: str
    size: int
    user_uuid: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
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
    item: str
    quantity: str
    reason: str
    user_uuid: Union[str, None]
    authorized_request: bool
    timestamp_sent: str
    timestamp_completed: Union[str, None]
    is_approved: Union[bool, None]
    completion_note: Union[str, None]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "item": "Soldering Iron",
                "quantity": "1 more iron",
                "reason": "Low/Out of Stock",
                "user_uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "authorized_request": False,
                "timestamp_sent": 1610000000,
                "timestamp_completed": None,
                "is_approved": None,
                "completion_note": None
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
    title: str
    description: str
    instructors: str
    timestamp_start: str
    timestamp_end: str
    capacity: int
    required_quizzes: List[str]
    rsvp_list: List[str]
    sign_in_list: Union[List[str], None]
    is_live: bool
    is_live_timestamp: Union[str, None]
    users_notified: Union[List[str], None]
    photos: Union[List[str], None]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "title": "Soldering Workshop",
                "description": "Learn how to solder!",
                "instructors": "John Doe and Jane Doe",
                "timestamp_start": "12511032",
                "timestamp_end": "12511032",
                "capacity": 10,
                "required_quizzes": ["123456789"],
                "rsvp_list": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"],
                "is_live": True,
                "users_notified": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l", "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"]
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


'''
IP Logs class is used to store information about the IP logs.
The following fields are stored:
- uuid: The uuid of the IP log
- ip: The IP address of the user
- user: The uuid of the user requested
'''

class IPLog(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    ip: str
    timestamp: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                    
                    "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j8k8l",
                    "ip": "192.168.0.1",
                    "timestamp": "3942102340"
            }    
        }


class Redirect(BaseModel):
    _id: Optional[PyObjectId] = Field(alias="_id")
    uuid: str
    path: str
    redirect: str
    logs: List[IPLog]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "path": "apply",
                "redirect": "https://www.hmc.edu/admission/apply/",
                "logs": [
                    {
                        "uuid": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j8k8l",
                        "ip": "192.168.0.1",
                        "timestamp": "3942102340"
                    }
                ]
            }
        }
