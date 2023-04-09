import csv
from main import *

BASE_QUIZ_URL: str = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyOdR5ZzocTVLi02rPVQPVwoGyuPrGmULHznFB66pDnqsWrCWVTi5JM5KCbBn8oMVLa-vwIS3RvK6z/pub?gid=";
POST_QUIZ_URL: str = "&single=true&output=csv";

async def scrape_quiz_results():
    # Go through QUIZ_IDS and scrape the quiz results for each quiz
    for quiz_name, quiz_id in QUIZ_IDS.items():
        # Get the quiz results
        quiz_results = await get_quiz_results(quiz_id)
        # Update the database
        await update_quiz_results(quiz_id, quiz_results)
        # Print log message
        logging.info(f"Scraped quiz results for {quiz_name} quiz!")

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
            # Convert the timestamp strings into datetime objects
            for quiz_result in quiz_results:
                quiz_result["Timestamp"] = datetime.strptime(quiz_result["Timestamp"], "%m/%d/%Y %H:%M:%S")


    # Return the quiz results
    return quiz_results
