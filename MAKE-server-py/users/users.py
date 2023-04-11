from datetime import datetime
import logging
import uuid
import fuzzywuzzy
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
        email_search = users_collection.find_one(
            {"Email": quiz_result["Email"]})
        cx_id_search = users_collection.find_one(
            {"cx_id": quiz_result["cx_id"]})

        quizzes = []

        uuid = None
        quizzes_to_set = None

        # Check if the user passed the quiz
        if quiz_result["Passed"]:
            quizzes.append(quiz_result["GID"])

        if email_search is None and cx_id_search is None:
            # The user does not exist in the database
            # Create the user

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

        elif email_search is not None and cx_id_search is None:
            # Case 1: The user exists in the database, but the cx_id is incorrect
            # We can almost always trust the email, so we just update quizzes from the quiz result

            quizzes_to_set = list(set(email_search["Quizzes"] + quizzes))

            uuid = email_search["UUID"]

        elif email_search is None and cx_id_search is not None:
            # Case 2: we found the user by cx_id, but the email is incorrect
            # Fuzzy match the emails to see if they are close enough to be the same person

            # Get the email from the quiz result
            email = quiz_result["Email"]

            # Get the email from the cx_id search
            cx_id_email = cx_id_search["Email"]

            # Check if the emails are close enough to be the same person
            # by fuzzy matching the emails using fuzzywuzzy

            # Get the ratio of similarity between the two emails
            ratio = fuzzywuzzy.fuzz.ratio(email, cx_id_email)

            # If the ratio is greater than 90, we can assume that the emails are the same person
            if ratio > 90:
                quizzes_to_set = list(set(cx_id_search["Quizzes"] + quizzes))

                uuid = cx_id_search["UUID"]

        elif email_search is not None and cx_id_search is not None:
            # Case 3: both email and cx_id have returned results

            if email_search["UUID"] == cx_id_search["UUID"]:
                # Case 3.1: most common case, the email and cx_id are the same person
                # just update the quizzes
                quizzes_to_set = list(set(cx_id_search["Quizzes"] + quizzes))

                uuid = cx_id_search["UUID"]

            else:
                # Case 3.2: the email and cx_id are different people....
                # This is annoying, but we can search all quizzes by
                # the cx_id and by email and see if there are any
                # overlap

                # Get all quizzes by email
                email_quizzes = await collection.find(
                    {"Email": email_search["Email"]}).to_list(None)
                
                # Get all quizzes by cx_id
                cx_id_quizzes = await collection.find(
                    {"cx_id": cx_id_search["cx_id"]}).to_list(None)
                
                


        # If the uuid is not None, we need to update the user
        # with the new set of quizzes
        if uuid is not None:
            # Update the user in the database
            await users_collection.update_one({"UUID": uuid}, {"$set": quizzes_to_set})

            # Increment the number of users updated
            num_users_updated += 1
