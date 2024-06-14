from datetime import datetime
import uuid
import logging
from utilities import levenshtein_ratio_and_distance
from pymongo import UpdateOne
from db_schema import MongoDB, User
from config import *


async def create_update_users_from_quizzes():
    # Create or update users from quizzes
    # Users often mistype their email address and cx_id when taking a quiz
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Creating/Updating users from quizzes...")

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
    num_total_updates = 0

    users_updates = {}
    
    for quiz_result in quiz_results:
        email_search = await users_collection.find_one(
            {"email": quiz_result["email"]}
        )
        cx_id_search = await users_collection.find_one(
            {"cx_id": quiz_result["cx_id"]}
        )

        user_uuid = None
        quizzes_to_set = {}

        # Check if the user passed the quiz
        if quiz_result["passed"]:
            quizzes_to_set[str(quiz_result["timestamp"])] = quiz_result["gid"]

        if email_search is None and cx_id_search is None:
            # The user does not exist in the database
            # Create the user

            user = User(
                uuid=uuid.uuid4().hex,
                email=quiz_result["email"],
                cx_id=quiz_result["cx_id"],
                name=quiz_result["name"],
                role="user",
                passed_quizzes=quizzes_to_set,
            )

            # Insert the user into the database
            await users_collection.insert_one(user.dict())

            # Increment the number of users created
            num_users_created += 1

        elif email_search is not None and cx_id_search is None:
            # Case 1: The user exists in the database, but the cx_id is incorrect
            # We can almost always trust the email, so we just update quizzes from the quiz result

            # Add to dictionary of quizzes
            quizzes_to_set.update(email_search["passed_quizzes"])

            user_uuid = email_search["uuid"]

        elif email_search is None and cx_id_search is not None:
            # Case 2: we found the user by cx_id, but the email is incorrect
            # Fuzzy match the emails to see if they are close enough to be the same person

            # Get the email from the quiz result
            email = quiz_result["email"]

            # Get the email from the cx_id search
            cx_id_email = cx_id_search["email"]

            # Check if the emails are close enough to be the same person
            # by fuzzy matching the emails using fuzzywuzzy

            # Get the ratio of similarity between the two emails
            #ratio = levenshtein_ratio_and_distance(email, cx_id_email)

            ratio = 0
            if email == cx_id_email:
                ratio = 1
            else:
                ratio = 0

            # If the ratio is greater than 90, we can assume that the emails are the same person
            if ratio > .9:
                quizzes_to_set.update(cx_id_search["passed_quizzes"])

                user_uuid = cx_id_search["uuid"]

        elif email_search is not None and cx_id_search is not None:
            # Case 3: both email and cx_id have returned results

            if email_search["uuid"] == cx_id_search["uuid"]:
                # Case 3.1: most common case, the email and cx_id are the same person
                # just update the quizzes
                quizzes_to_set.update(cx_id_search["passed_quizzes"])

                user_uuid = cx_id_search["uuid"]

            else:
                # Case 3.2: the email and cx_id are different people....
                # This is annoying, but we can search all quizzes by
                # the cx_id and by email and see if there are any
                # overlap

                # Get all quizzes by email
                email_quizzes = await collection.find(
                    {"email": email_search["email"]}).to_list(None)
                
                # Get all quizzes by cx_id
                cx_id_quizzes = await collection.find(
                    {"cx_id": cx_id_search["cx_id"]}).to_list(None)
                
                
                # Whichever one has more quizzes, we will use that
                # to update the user
                if len(email_quizzes) > len(cx_id_quizzes):
                    # Update the user with the email
                    quizzes_to_set.update(email_search["passed_quizzes"])

                    user_uuid = email_search["uuid"]
                else:
                    # Update the user with the cx_id
                    quizzes_to_set.update(cx_id_search["passed_quizzes"])

                    user_uuid = cx_id_search["uuid"]
                
                


        # If the uuid is not None, we need to update the user
        # with the new set of quizzes
        if user_uuid is not None:
            if user_uuid not in users_updates:
                users_updates[user_uuid] = quizzes_to_set
            else:
                users_updates[user_uuid].update(quizzes_to_set)

            # Increment the number of users updated
            num_total_updates += 1

    # Now, go through all users and mark outdated quizzes as invalid
    # removing it from the user's passed_quizzes field
    
    # Make timestamp that quizzes are valid after.
    # This resets every year on QUIZ_RESET_DAY
    quizzes_valid_after = 0

    # Get the current date
    current_date = datetime.now()

    # Get the current year
    current_year = current_date.year

    # Get day of year
    day_of_year = current_date.timetuple().tm_yday

    if day_of_year < QUIZ_RESET_DAY:
        # The quiz date is valid if the quiz timestamp is in the previous year
        quizzes_valid_after = datetime(current_year - 1, 8, 1).timestamp()
    else:
        # The quiz date is valid if the quiz timestamp is in the current year
        quizzes_valid_after = datetime(current_year, 8, 1).timestamp()

    total_old_quizzes = 0
    users = await users_collection.find().to_list(None)
    for user in users:
        # Get the user's passed quizzes
        passed_quizzes = user["passed_quizzes"]

        # Get the user's uuid
        user_uuid = user["uuid"]

        passed_quizzes = {}

        # Iterate through all quizzes
        for timestamp, gid in user["passed_quizzes"].items():
            # Check if the quiz is valid
            if float(timestamp) >= quizzes_valid_after:
                # The quiz is valid
                # Add it to the passed quizzes
                passed_quizzes[timestamp] = gid
            else:
                # The quiz is invalid
                # Increment the number of old quizzes
                total_old_quizzes += 1

        # Remove duplicate passed quizzes, keeping the most recent one
        passed_quizzes = {
            timestamp: gid
            for timestamp, gid in sorted(
                passed_quizzes.items(), key=lambda item: item[0], reverse=True
            )
        }

        if passed_quizzes != user["passed_quizzes"]:
            # Update the user's passed quizzes
            users_updates[user_uuid] = passed_quizzes
                
    # Run all the updates at once
    if users_updates:
        users_updates = [
            {"uuid": user_uuid, "quizzes": quizzes} for user_uuid, quizzes in users_updates.items()
        ]

        await users_collection.bulk_write(
            [
                UpdateOne(
                    {"uuid": user["uuid"]},
                    {"$set": {"passed_quizzes": user["quizzes"]}},
                )
                for user in users_updates
            ]
        )


async def cleanup_user_files():
    '''
    This method goes through all the users and deletes their files
    that are older then USER_FILE_TIME_LIMIT 
    Additionally, it checks if the user has exceeded their storage limit,
    and if so, deletes the oldest file until it's under the limit
    '''
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Cleaning up user files...")

    db = MongoDB()

    # Get the users collection
    user_collection = await db.get_collection("users")
    file_collection = await db.get_collection("user_files")

    freed_bytes = 0

    # Iterate through all files that are older than the time limit
    old_files = await file_collection.find({"timestamp": {"$lt": datetime.now().timestamp() - USER_STORAGE_LIMIT_SECONDS}}).to_list(None)

    for file in old_files:
        # Delete the file
        await file_collection.delete_one({"uuid": file["uuid"]})

        # Update the user's files field
        await user_collection.update_one({"uuid": file["user_uuid"]}, {"$pull": {"files": file["uuid"]}})

        # Add the size of the file to the freed_bytes variable
        freed_bytes += file["size"]

    logging.info(f"Freed {freed_bytes} bytes of storage")
