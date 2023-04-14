from db_schema import *
from config import *

import smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

async def validate_api_key(db, api_key_str, scope):
    # Get the API keys collection
    collection = await db.get_collection("api_keys")

    # Get the API key
    api_key = await collection.find_one({"key": api_key_str})

    if api_key is None:
        return False
    
    if scope not in api_key["scope"] and "admin" not in api_key["scope"]:
        return False
    
    return True

async def format_email_template(template_name: str, text_list: List[str]):
    # Format an email template
    # Get the template
    template = open(f"/email_templates/{template_name}.html", "r").read()

    # Format the template
    formatted_template = template.format(**text_list)

    return formatted_template


async def email_user(user_email: str, cc_email: List[str], subject: str, html_body: str):
    # Email a user
    sender_email = f" MAKE <{GMAIL_EMAIL}>"
    receiver_email = user_email
    password = GMAIL_PASS

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