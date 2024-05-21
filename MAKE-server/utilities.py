import logging
import os
from db_schema import *
from config import *

import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import urllib.parse

last_updated_time = datetime.datetime.now()

async def validate_api_key(db, api_key_str, scope):
    # Get the API keys collection
    collection = await db.get_collection("api_keys")

    # Get the API key
    api_key = await collection.find_one({"key": api_key_str})

    if api_key is None:
        return False
    
    # Always allow admin scope, otherwise check if the scope is in the API key's scope
    if scope not in api_key["scope"] and "admin" not in api_key["scope"]:
        return False
    
    return True

def format_email_template(template_name: str, key_values: dict):
    # Format an email template
    # Get the template
    template = open(f"email_templates/{template_name}.html", "r").read()

    # Format the template
    formatted_template = template.format(**key_values)

    return str(formatted_template)
async def email_user(user_email: str, cc_email: List[str], subject: str, html_body: str):
    # Email a user
    sender_email = f" MAKE <{GMAIL_EMAIL}>"
    receiver_email = user_email

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Cc"] = ", ".join(cc_email)

    logging.info(f"Emailing user {user_email} as {sender_email}...")
    logging.info(f"\tSubject: {subject}")
    logging.info(f"\tCC: {', '.join(cc_email)}")
    logging.info(f"\tBody: {html_body}")

    # Create
    message.attach(MIMEText(html_body, "html"))

    # Create a secure SSL context
    context = ssl.create_default_context()

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(GMAIL_EMAIL, GMAIL_PASS)
        server.sendmail(
            sender_email, [receiver_email] + cc_email, message.as_string()
        )

def url_encode(to_encode: str):
    return urllib.parse.quote(to_encode)

def zip_and_move_log_file():
    # Zip the log file and move it to the logs directory
    if not os.path.exists("logs"):
        os.makedirs("logs")

    # Check if the log file exists
    if not os.path.exists("make.log"):
        return
    
    # Get the current date and time
    current_date = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # Zip the log file
    os.system(f"zip logs/{current_date}_make_log.zip make.log")

def levenshtein_ratio_and_distance(s, t):

    """
    Calculate the Levenshtein similarity ratio between two strings.
    """

    if len(s) < len(t):
        return levenshtein_ratio_and_distance(t, s)

    previous_row = range(len(t) + 1)

    for i, c1 in enumerate(s):
        current_row = [i + 1]

        for j, c2 in enumerate(t):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))

        previous_row = current_row

    levenshtein_distance = previous_row[-1]
    ratio = ((len(s) + len(t)) - levenshtein_distance) / (len(s) + len(t))

    return ratio