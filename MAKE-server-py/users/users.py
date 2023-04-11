from datetime import datetime
import logging
import uuid
from main import MongoDB
from config import *

async def create_update_users_from_quizzes():
    # Create or update users from quizzes
    # Users often mistype their email address and cx_id when taking a quiz

    # Get the quizzes collection
    db = MongoDB()

    # Get the collection
    collection = await db.get_collection("quizzes")

    # Get all quiz results
    quiz_results = await collection.find().to_list(None)

    # Get the users collection
    users_collection = await db.get_collection("users")

    # Now we have our data. Let's iterate through all quiz results
    # and create/update users as necessary

    # Keep track of the number of users that were created/updated
    num_users_created = 0
    num_users_updated = 0

    for quiz_result in quiz_results:
        email_search = users_collection.find_one({"Email": quiz_result["Email"]})
        cx_id_search = users_collection.find_one({"cx_id": quiz_result["cx_id"]})

        if email_search is None and cx_id_search is None:
            # The user does not exist in the database
            # Create the user

            quizzes = []

            # Check if the user passed the quiz
            if quiz_result["Passed"]:
                quizzes.append(quiz_result["GID"])

            user = {
                # Generate v4 UUID
                "UUID": uuid.uuid4().hex,
                "Email": quiz_result["Email"],
                "cx_id": quiz_result["cx_id"],
                "Name": quiz_result["Name"],
                "Role": "User",
                "Shifts": [],
                "Quizzes": quizzes,
            }

            # Insert the user into the database
            await users_collection.insert_one(user)

            # Increment the number of users created
            num_users_created += 1

        elif email_search is not None and cx_id_search is not None:
            