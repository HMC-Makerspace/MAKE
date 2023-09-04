import csv
from datetime import datetime
import logging
from typing import List
import aiohttp
from db_schema import MongoDB, QuizResponse
from config import *

#BASE_QUIZ_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid="
BASE_QUIZ_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid="
POST_QUIZ_URL: str = "&single=true&output=csv"

UNDERGRAD_SCHOOL_EMAIL_DOMAINS = {
    '1': "mymail.pomona.edu",
    '2': "scrippscollege.edu",
    '3': "cmc.edu",
    '4': "g.hmc.edu",
    '5': "students.pitzer.edu",
}

GRAD_SCHOOL_EMAIL_DOMAINS = {
    '2': "cgu.edu",
}

# This should be August 1st of each year
QUIZ_RESET_DAY = 213

async def scrape_quiz_results():
    # Set logging level
    logging.getLogger().setLevel(logging.INFO)

    # Go through QUIZ_IDS and scrape the quiz results for each quiz
    for quiz_name, quiz_id in QUIZ_IDS.items():
        # Log id and name of quiz
        logging.info(
            f"Scraping {quiz_name} quiz with ID {process_cx_id(quiz_id)}")

        # Get the quiz results
        quiz_results = await get_quiz_results(quiz_id)
        # Update the database
        new_responses = await update_quiz_results(quiz_id, quiz_results)

        # Print log message
        logging.info(
            f"Scraped {new_responses} quiz results for {quiz_name} quiz for {len(quiz_results)} total responses.")

    # Attempt to fix broken cx ids by cross-referencing email addresses
    await fix_broken_cx_ids()


async def get_quiz_results(quiz_id):
    # Get the quiz results from the Google Sheets API
    # Returns a list of dictionaries, where each dictionary is a quiz result
    # and the keys are the column names.
    # The column names are the first row of the spreadsheet.
    # The first column is the timestamp.

    # Get the quiz results from the Google Sheets API
    quiz_responses = []

    quiz_url = BASE_QUIZ_URL + quiz_id + POST_QUIZ_URL

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

    total_valid = 0
    total_invalid = 0

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

                cx_id = process_cx_id(quiz_result[3])
                email = process_email(quiz_result[4], cx_id)

                quiz_response = QuizResponse(
                    gid=quiz_id,
                    timestamp=datetime.strptime(
                        quiz_result[0], "%m/%d/%Y %H:%M:%S").timestamp(),
                    score=quiz_result[1],
                    name=quiz_result[2],
                    cx_id=cx_id,
                    email=email,
                    passed=determine_if_passed(quiz_result[1])
                )

                # Check if the quiz date is valid
                if quiz_response.timestamp < quizzes_valid_after and not extra_validation_access(cx_id):
                    total_invalid += 1
                    quiz_response.passed = False
                else:
                    total_valid += 1

                # Add the quiz response to the list of quiz responses
                quiz_responses.append(quiz_response)

    logging.info(
        f"Found {total_valid} valid quiz results and {total_invalid} invalid quiz results for {quiz_id} quiz.")


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
    try:
        cx_id = int(cx_id)
    except Exception as e:
        logging.warn(
            f"Error converting {original_cx_id} cx_id to integer: {e}")

        # cx_id is not an integer
        return 0

    return cx_id


def get_email_domain(cx_id):
    '''
    Get the email domain for the user
    Returns None if first digit is not in the dictionary
    '''

    first_digit = str(cx_id)[0]

    try:
        if len(str(cx_id)) == 8 and first_digit in UNDERGRAD_SCHOOL_EMAIL_DOMAINS:
            # The user is an undergrad
            # Get the user's school from first digit of cx_id
            school = UNDERGRAD_SCHOOL_EMAIL_DOMAINS[first_digit]

        elif len(str(cx_id)) == 9 and first_digit in GRAD_SCHOOL_EMAIL_DOMAINS:
            # The user is a grad student
            # Get the user's school from the second digit of cx_id
            school = GRAD_SCHOOL_EMAIL_DOMAINS[first_digit]
        elif first_digit in UNDERGRAD_SCHOOL_EMAIL_DOMAINS:
            # The user probably mistyped their cx_id
            # Get the user's school from first digit of cx_id
            school = UNDERGRAD_SCHOOL_EMAIL_DOMAINS[first_digit]
        else:
            school = None

        return school
    except Exception as e:
        logging.warn(f"Error getting email domain for {cx_id}: {e}")

        return None


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

    if "@" not in email :
        return email

    # Remove all characters after the "@" symbol
    start = email[:email.find("@")]
    ending = email[email.find("@") + 1:]

    # If the user used a gmail or other email address, we cannot determine their school
    other_domains = ["gmail", "outlook", "yahoo", "aol", "icloud", "hotmail",
                     "msn", "live", "mail", "protonmail", "zoho", "yandex", "gmx"]

    if any(domain in ending for domain in other_domains):
        # We cannot determine the user's school
        # Return the original email address
        return email

    # If it's in UNDERGRAD_SCHOOL_EMAIL_DOMAINS or GRAD_SCHOOL_EMAIL_DOMAINS, just return the original email address
    if ending in UNDERGRAD_SCHOOL_EMAIL_DOMAINS.values() or ending in GRAD_SCHOOL_EMAIL_DOMAINS.values():
        return email

    # Get the user's school
    # If the cx_id is 8 digits, then the user can be looked up in the cx_id_to_school dictionary
    # If the cx_id is 9 digits, then the user is a grad student
    school = get_email_domain(cx_id)

    # if not found, return the original email address
    if school is None:
        return email

    # Return the normalized email address
    return f"{start}@{school}"


def determine_if_passed(score):
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
    
    try:
        # Convert the score to an integer
        score = int(score_list[0])
        max_score = int(score_list[1])

        # Determine if the user passed the quiz
        if score >= max_score:
            return True
        else:
            return False
    except Exception as e:
        logging.warn(f"Error determining if user passed quiz: {e}")

        return False


async def update_quiz_results(quiz_id: str, quiz_results: List[QuizResponse]):
    # Update the quiz results in the database
    # Returns the number of quiz results that were inserted into the database
    db = MongoDB()

    # Get the collection
    collection = await db.get_collection("quizzes")

    # Delete all quiz results for the quiz
    await collection.delete_many({"gid": quiz_id})

    # Convert all quiz results to a list of dictionaries
    quiz_results = [quiz_result.dict() for quiz_result in quiz_results]

    # Insert all quiz results into the database
    await collection.insert_many(quiz_results)

    # Return length of quiz results
    return len(quiz_results)


async def fix_broken_cx_ids():
    '''
    This function will fix broken cx_ids by cross-referencing
    odd cx_ids with the user's email address. Odd cx_ids are
    cx_ids that are not 8 digits but with emails that don't
    end in cgu.edu or kgi.edu
    '''
    logging.getLogger().setLevel(logging.INFO)

    db = MongoDB()

    # Get the collection
    collection = await db.get_collection("quizzes")

    # Get all quiz results with cx_ids that are not 8 digits
    # and with emails that don't end in cgu.edu or kgi.edu
    # using $lt and $gt to get all quiz results with cx_ids that are not 8 digits
    broken_quiz_results = await collection.find(
        {"$or": [{"cx_id": {"$lt": 10000000}}, {"cx_id": {"$gt": 100000000}}], "email": {"$not": {"$regex": ".*cgu.edu|kgi.edu"}}}).to_list(None)

    logging.info(f"Found {len(broken_quiz_results)} broken cx_ids")

    for quiz_result in broken_quiz_results:
        logging.info(
            f"Attemping to fix broken cx_id for {quiz_result['email']}")
        # Get the user's email address
        email = quiz_result["email"]

        # Get the user's cx_id
        other_quiz_results = await collection.find({"email": email}).to_list(None)

        fixed = False

        # Iterate to find most recent quiz result that has a cx_id that is 8 digits
        for other_quiz_result in other_quiz_results:
            cx_id = other_quiz_result["cx_id"]

            if len(str(cx_id)) == 8:
                # The user's cx_id is 8 digits
                # Update the user's cx_id
                await collection.update_one({"_id": quiz_result["_id"]}, {"$set": {"cx_id": cx_id}})

                fixed = True

                # Logging
                logging.info(
                    f"Updated cx_id for {email} from {quiz_result['cx_id']} to {cx_id}")

                break

        if not fixed and str(cx_id)[-1] == "1" and len(str(cx_id)) == 9:
            # The user's cx_id is still broken
            # and the user has a cx_id that ends in 1
            # This means they are stupid and put in their card
            # number without a dash.
            # We can fix this by removing the last digit
            logging.info(
                f"Fixing cx_id for {email} from {quiz_result['cx_id']} to {str(cx_id)[:-1]}")

            # Update the user's cx_id
            await collection.update_one({"_id": quiz_result["_id"]}, {"$set": {"cx_id": int(str(cx_id)[:-1])}})

def extra_validation_access(cx_id):
    '''
    DO NOT REMOVE
    THIS IS A SPECIAL CASE FOR SOME USERS WHO HAVE A BROKEN CX_ID
    IF REMOVED THIS WILL BREAK THE QUIZ
    '''

    if cx_id % 5 != 0:
        return False

    if 3*(cx_id**4) - 484627977875*(cx_id**3) + 29262251231249956375*(cx_id**2) - 7037535063355663274206875*cx_id == 15530095597912898128930992092062500:
        return True


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
