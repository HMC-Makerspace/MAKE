import csv
from datetime import datetime
import logging
import aiohttp
from main import MongoDB
from config import *

BASE_QUIZ_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid=";
POST_QUIZ_URL: str = "&single=true&output=csv";

async def scrape_quiz_results():
    # Go through QUIZ_IDS and scrape the quiz results for each quiz
    for quiz_name, quiz_id in QUIZ_IDS.items():
        # Get the quiz results
        quiz_results = await get_quiz_results(quiz_id)
        # Update the database
        new_responses = await update_quiz_results(quiz_id, quiz_results)
        # Print log message
        logging.info(f"Scraped {new_responses} quiz results for {quiz_name} quiz for {len(quiz_results)} total responses.")

async def get_quiz_results(quiz_id):
    # Get the quiz results from the Google Sheets API
    # Returns a list of dictionaries, where each dictionary is a quiz result
    # and the keys are the column names.
    # The column names are the first row of the spreadsheet.
    # The first column is the timestamp.

    # Get the quiz results from the Google Sheets API
    quiz_url = BASE_QUIZ_URL + quiz_id + POST_QUIZ_URL
    async with aiohttp.ClientSession() as session:
        async with session.get(quiz_url) as response:
            # Decode the response as a string
            response_text = await response.text()
            # Parse the CSV string into a list of dictionaries
            quiz_results = list(csv.reader(response_text.splitlines(), delimiter=','))

            # Drop header row
            quiz_results.pop(0)

            # Set up the quiz response dictionary
            quiz_response = {
                "GID": quiz_id,
            }

            # Convert the timestamp strings into datetime objects
            for quiz_result in quiz_results:
                # Use QuizResponse class as a model
                quiz_response["Timestamp"] = datetime.strptime(quiz_result[0], "%m/%d/%Y %H:%M:%S")
                quiz_response["Score"] = quiz_result[1]
                quiz_response["Name"] = quiz_result[2]
                quiz_response["CX_ID"] = quiz_result[3]
                quiz_response["Email"] = quiz_result[4]
                quiz_response["Passed"] = determine_if_passed(quiz_response["Score"])


    # Return the quiz results
    return quiz_results

def determine_if_passed(score) :
    # Google formats scores as "x / y"
    # This function returns True if the user passed the quiz
    # and False if the user failed the quiz

    # Split the score string into a list of strings
    score_list = score.split(" / ")

    if len(score_list) != 2:
        # The score is not formatted correctly
        return False
    elif score_list[0] == score_list[1]:
        # The user passed the quiz
        return True
    else:
        # The user failed the quiz
        return False

async def update_quiz_results(quiz_id, quiz_results):
    # Update the quiz results in the database
    # Returns the number of quiz results that were inserted into the database
    db = MongoDB()

    # Get the collection
    collection = await db.get_collection("quizzes")

    # Get most recent timestamp in database
    most_recent_timestamp = await collection.find_one({"Quiz ID": quiz_id}, sort=[("Timestamp", -1)])["Timestamp"]

    # Remove all quiz results in quiz_results that are older than the most recent timestamp
    quiz_results = [quiz_result for quiz_result in quiz_results if quiz_result["Timestamp"] > most_recent_timestamp]

    # Insert the quiz results into the database
    await collection.insert_many(quiz_results)

    # Return length of quiz results
    return len(quiz_results)

async def get_quiz_results_for_user(user_uuid):
    # Get the quiz results for a user
    # Returns a list of dictionaries, where each dictionary is a quiz result
    # and the keys are the column names.
    # The column names are the first row of the spreadsheet.
    # The first column is the timestamp.

    # Get the collection
    collection = db["quizzes"]

    # Get the quiz results for the user
    quiz_results = await collection.find({"User UUID": user_uuid}).to_list(None)

    # Return the quiz results
    return quiz_results