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