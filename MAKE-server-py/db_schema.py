from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel, Field

schema = [
    'quiz_updates',
    'inventory',
    'restock_requests',
    'users',
    'quizzes',
    'checkouts',
    'student_storage',
    'shifts',
    'workshops',
    'printer_logs',
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
- UUID: The UUID of the item
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
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Name: str
    Type: str
    # Quantity can be a number or a string
    Quantity: str
    Location_room: str
    Location_specific: str
    Reorder_URL: str
    Specific_Name: str
    Serial_Number: str
    Brand: str
    Model_Number: str
    QR_Code: str
    Kit_Ref: str
    Kit_Contents: List[str]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Name": "Soldering Iron",
                "Type": "Tool",
                "Quantity": "Medium",
                "Location_room": "Cage",
                "Location_specific": "Shelf 1",
                "Reorder_URL": "https://www.amazon.com/HiLetgo-Adjustable-Temperature-Soldering-Station/dp/B07B4J2YQY/ref=sr_1_3?dchild=1&keywords=soldering+iron&qid=1610000000&sr=8-3",
                "Specific_Name": "HiLetGo Adjustable Soldering Iron",
                "Serial_Number": "123456789",
                "Brand": "HiLetGo",
                "Model_Number": "123456789",
                "QR_Code": "AUTHENTIC/121313",
                "Kit_Ref": "None",
                "Kit_Contents": []
            }
        }


'''
The users class is used to store information about the users of the system.
The following fields are stored:
- UUID: The UUID of the user
- Name: The name of the user
- Email: The email of the user
- CX ID: The CX ID of the user
- Role: The role of the user. Either User, Steward, Head Steward, or Admin
- Quizzes: A list of the quizzes that the user has taken & passed

If the user is a Steward or Head Steward, the following fields are stored:
- Shifts: A list of the shifts that the user is working

'''
class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Name: str
    Email: str
    cx_id: int
    Role: str
    Shifts: List[str]
    Quizzes: List[str]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Name": "John Doe",
                "Email": "john@g.hmc.edu",
                "cx_id": "123456789",
                "Role": "User",
                "Shifts": []
            }
        }

'''
The restock_requests class is used to store information about the restock requests.
The following fields are stored:
- UUID: The UUID of the restock request
- Items Requested: A list of the items requested
- Requested By: The name of the user who requested the restock
- Requested By Email: The email of the user who requested the restock
- Sent: Whether the request has been sent to management

'''
class RestockRequest(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Items_Requested: List[str]
    Requested_By: str
    Requested_By_Email: str
    Sent: bool

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Items_Requested": ["Soldering Iron"],
                "Requested_By": "John Doe",
                "Requested_By_Email": "john@g.hmc.edu",
                "Sent": False
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
    id: Optional[PyObjectId] = Field(alias="_id")
    GID: str
    Email: str
    Name: str
    Timestamp: str
    cx_id: str
    Score: str
    Passed: bool

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "GID": "2100779718",
                "Email": "john@g.hmc.edu",
                "Name": "John Doe",
                "Timestamp": "2021-01-01 00:00:00",
                "cx_id": "123456789",
                "Score": "7/7",
                "Passed": True
            }
        }

'''
The shifts class is used to store information about the shifts.
The following fields are stored:
- Timestart: The start time of the shift
- Timeend: The end time of the shift
- Day: The day of the shift
- Stewards: A list of UUIDs of the stewards working the shift
'''
class Shift(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    Timestart: str
    Timeend: str
    Day: str
    Stewards: List[str]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "Timestart": "10:00",
                "Timeend": "12:00",
                "Day": "Monday",
                "Stewards": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"]
            }
        }


'''
The checkouts class is used to store information about the checkouts.
The following fields are stored:
- UUID: The UUID of the checkout
- Items: A list of UUIDs of the items checked out. Each item is a dictionary with the following fields:
    - UUID: The UUID of the item
    - Quantity: The quantity of the item
- Checked Out By: The UUID of the user who checked out the items
- Timestamp Out: The timestamp of when the items were checked out
- Timestamp Due: The timestamp of when the items are due
- Timestamp In: The timestamp of when the items were checked in
'''
class Checkout(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Items: List[dict]
    Checked_Out_By: str
    Timestamp_Out: str
    Timestamp_Due: str
    Timestamp_In: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Items": [
                    {
                        "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                        "Quantity": 1
                    }
                ],
                "Checked_Out_By": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"
            }
        }
    

'''
StudentStorage class is used to store information about the student storage reservations
The following fields are stored:
- UUID: The UUID of the reservation
- Space: The space that the reservation is for
- Student: The UUID of the student who made the reservation
- Timestamp: The timestamp of when the reservation was made
- Timestamp Due: The timestamp of when the reservation is due
- Timestamp In: The timestamp of when the reservation was checked in
- Renewals Left: The number of times the reservation can be renewed
'''
class StudentStorage(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Space: str
    Student: str
    Timestamp: str
    Timestamp_Due: str
    Timestamp_In: str
    Renewals_Left: int

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Space": "A1",
                "Student": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Timestamp": "2021-01-01 00:00:00",
                "Timestamp_Due": "2021-01-01 00:00:00",
                "Timestamp_In": "2021-01-01 00:00:00",
                "Renewals_Left": 1
            }
        }

'''
Workshop class is used to store information about the workshops.
The following fields are stored:
- UUID: The UUID of the workshop
- Name: The name of the workshop
- Description: The description of the workshop
- Stewards: A list of UUIDs of the stewards who are leading the workshop
- Timestamp: The timestamp of when the workshop is scheduled
- Length: The length of the workshop in minutes
- Capacity: The capacity of the workshop
'''
class Workshop(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Name: str
    Description: str
    Stewards: List[str]
    Timestamp: str
    Length: int
    Capacity: int

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Name": "Soldering Workshop",
                "Description": "Learn how to solder!",
                "Stewards": ["d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l"],
                "Timestamp": "2021-01-01 00:00:00",
                "Length": 60,
                "Capacity": 10
            }
        }

'''
Printer log class is used to store information about the printer logs.
This will serve both 3d printer and large format printer logs.
The following fields are stored:
- UUID: The UUID of the printer log
- Printer: The UUID of the printer that the log is for
- User: The UUID of the user who printed the file
- File name: The name of the file that was printed
- Timestamp: The timestamp of when the file was printed
- Printer data: The data that the printer sent to the server, in JSON format
'''
class PrinterLog(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Printer: str
    User: str
    File_Name: str
    Timestamp: str
    Printer_Data: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Printer": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "File_Name": "test.gcode",
                "Timestamp": "2021-01-01 00:00:00",
                "Printer_Data": "{'test': 'test'}"
            }
        }


'''
API Keys class is used to store information about the API keys.
The following fields are stored:
- UUID: The UUID of the API key
- Name: The name of the API key
- Key: The API key
- Scope: The scope of the API key. Scopes can be:
    - admin: Can access all endpoints
    - checkout: Can access checkout endpoints
    - studentstorage: Can access student storage endpoints
    - steward: Can access steward-level
    - printer: Can access printer endpoints
'''
class APIKeys(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    UUID: str
    Name: str
    Key: str
    Scope: str

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
        schema_extra = {
            "example": {
                "UUID": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Name": "API Key",
                "Key": "d3f4e5c6-7b8a-9c0d-1e2f-3g4h5i6j7k8l",
                "Scope": "admin"
            }
        }