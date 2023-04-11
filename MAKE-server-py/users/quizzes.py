import csv
from datetime import datetime
import logging
import aiohttp
from main import MongoDB
from config import *

BASE_QUIZ_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid=";
POST_QUIZ_URL: str = "&single=true&output=csv";

UNDERGRAD_SCHOOL_EMAIL_DOMAINS = {
    1: "mymail.pomona.edu",
    2: "scrippscollege.edu",
    3: "cmc.edu",
    4: "g.hmc.edu",
    5: "students.pitzer.edu",
}

GRAD_SCHOOL_EMAIL_DOMAINS = {
    2: "cgu.edu",
}

async def scrape_quiz_results():
    # Set logging level
    logging.getLogger().setLevel(logging.INFO)

    # Go through QUIZ_IDS and scrape the quiz results for each quiz
    for quiz_name, quiz_id in QUIZ_IDS.items():
        # Log id and name of quiz
        logging.info(f"Scraping {quiz_name} quiz with ID {process_cx_id(quiz_id)}")

        # Get the quiz results
        quiz_results = await get_quiz_results(quiz_id)
        # Update the database
        new_responses = await update_quiz_results(quiz_id, quiz_results)
        # Print log message
        logging.info(
            f"Scraped {new_responses} quiz results for {quiz_name} quiz for {len(quiz_results)} total responses.")


async def get_quiz_results(quiz_id):
    # Get the quiz results from the Google Sheets API
    # Returns a list of dictionaries, where each dictionary is a quiz result
    # and the keys are the column names.
    # The column names are the first row of the spreadsheet.
    # The first column is the timestamp.

    # Get the quiz results from the Google Sheets API
    quiz_responses = []

    quiz_url = BASE_QUIZ_URL + quiz_id + POST_QUIZ_URL
    async with aiohttp.ClientSession() as session:
        async with session.get(quiz_url) as response:
            # Decode the response as a string
            response_text = await response.text()
            # Parse the CSV string into a list of dictionaries
            quiz_results = list(csv.reader(
                response_text.splitlines(), delimiter=','))

            # Drop header row
            quiz_results.pop(0)

            # Set up the quiz response dictionary

            # Convert the timestamp strings into datetime objects
            for quiz_result in quiz_results:
                quiz_response = {
                    "GID": quiz_id,
                }   

                cx_id = process_cx_id(quiz_result[3])
                email = process_email(quiz_result["Email"], cx_id)

                # Use QuizResponse class as a model
                quiz_response["Timestamp"] = datetime.strptime(quiz_result[0], "%m/%d/%Y %H:%M:%S")
                quiz_response["Score"] = quiz_result[1]
                quiz_response["Name"] = quiz_result[2]
                quiz_response["cx_id"] = cx_id
                quiz_response["Email"] = email
                quiz_response["Passed"] = determine_if_passed(quiz_response["Score"])

                # Add the quiz response to the list of quiz responses
                quiz_responses.append(quiz_response.copy())


    # Return the quiz results
    return quiz_responses


def process_cx_id(cx_id):
    '''
    Process the cx_id
    This can be a 8 or 9 digit number
    Sometimes people add a - or a space and then another number
    Sometimes people only put
    Change 'O' and 'o' to '0'
    Remove all non-digit characters
    '''
    original_cx_id = cx_id

    if cx_id is None:
        return 0
    
    cx_id = cx_id.replace('o', '0')
    cx_id = cx_id.replace('O', '0')

    if '-' in cx_id:
        # Use the larger part of split
        cx_id = cx_id.split('-')

        if len(cx_id[0]) > len(cx_id[1]):
            cx_id = cx_id[0]
        else:
            cx_id = cx_id[1]

    # Remove all non-digit characters
    cx_id = ''.join([char for char in cx_id if char.isdigit()])

    # Remove all leading zeros
    cx_id = cx_id.lstrip('0')

    # Convert to an integer
    try :
        cx_id = int(cx_id)
    except Exception as e:
        logging.warn(f"Error converting {original_cx_id} cx_id to integer: {e}")

        # cx_id is not an integer
        return 0
    
    return cx_id

def process_email(email, cx_id):
    '''
    This function will update the user's email address and cx_id if they mistyped it
    Additionally, user emails sometimes drop the ".edu" suffix AND/or any characters after the "@" symbol
    but before the main domain name (e.g. "hmc.edu")
    Thus, we can normalize all user emails by first taking the substring before the "@" symbol
    and then using the cx_id to determine the user's ending domain name
    However, if they use a @gmail.com or other email address, we cannot determine their school
    and thus we cannot determine their domain name
    '''

    if email is None:
        return ""
    
    # Remove all characters after the "@" symbol
    start = email[:email.find("@")]
    ending = email[email.find("@"):]

    if "gmail" in ending or "outlook" in ending or "yahoo" in ending:
        # We cannot determine the user's school
        # Return the original email address
        return email
    
    # Get the user's school
    # If the cx_id is 8 digits, then the user can be looked up in the cx_id_to_school dictionary
    # If the cx_id is 9 digits, then the user is a grad student

    if len(str(cx_id)) == 8:
        # The user is an undergrad
        # Get the user's school from first digit of cx_id
        school = UNDERGRAD_SCHOOL_EMAIL_DOMAINS[str(cx_id)[0]]

    elif len(str(cx_id)) == 9:
        # The user is a grad student
        # Get the user's school from the second digit of cx_id
        school = GRAD_SCHOOL_EMAIL_DOMAINS[str(cx_id)[1]]
    else :
        # The cx_id is not 8 or 9 digits
        # Return the original email address
        return email

    # if not found, return the original email address
    if school is None:
        return email
    
    # Return the normalized email address
    return f"{start}@{school}"

def determine_if_passed(score) :
    '''
    Google formats scores as "x / y"
    This function returns True if the user passed the quiz
    and False if the user failed the quiz
    '''

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
    most_recent_timestamp = await collection.find_one({"GID": quiz_id}, sort=[("Timestamp", -1)])

    if most_recent_timestamp is None:
        # There are no quiz results in the database
        most_recent_timestamp = datetime(1970, 1, 1)
    else :
        # Get the most recent timestamp
        most_recent_timestamp = most_recent_timestamp["Timestamp"]

    # Remove all quiz results in quiz_results that are older than the most recent timestamp
    quiz_results = [quiz_result for quiz_result in quiz_results if quiz_result["Timestamp"] > most_recent_timestamp]

    if len(quiz_results) == 0:
        # There are no quiz results to update
        return 0

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
    db = MongoDB()

    # Get the collection
    collection = db.get_collection("quizzes")

    # Get the quiz results for the user
    quiz_results = await collection.find({"User UUID": user_uuid}).to_list(None)

    # Return the quiz results
    return quiz_results