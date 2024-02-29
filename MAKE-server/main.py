import datetime
import os
import uuid
from fastapi import FastAPI
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import HTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send


import asyncio
import uvicorn
import logging
import sys
import utilities

# Import the database schema
from db_schema import *

# Import config file
try: 
    from config import *
except ImportError:
    print("Config file not found. Please copy template_config.py file and rename to config.py.")
    sys.exit()

# Import discord bot
from discord.make_bot import run_discord_bot

# Import routes preventing circular import
from routes.routes_inventory import inventory_router
from routes.routes_users import user_router
from routes.routes_checkouts import checkouts_router
from routes.routes_shifts import shifts_router
from routes.routes_misc import misc_router
from routes.routes_student_storage import student_storage_router
from routes.routes_machines import machines_router
from routes.routes_workshops import workshops_router

# Import all other files
from users.quizzes import scrape_quiz_results
from users.users import cleanup_user_files, create_update_users_from_quizzes
from users.workshops import send_workshop_reminders
from inventory.checkouts import send_overdue_emails
from inventory.inventory import update_inventory_from_checkouts

# SSL certificate paths, on a Debian system
SSL_CERT_PRIVKEY = "/etc/letsencrypt/live/make.hmc.edu/privkey.pem"
SSL_CERT_PERMKEY = "/etc/letsencrypt/live/make.hmc.edu/fullchain.pem"


app = FastAPI(
    title="MAKE API V2",
    description="""
    The API for the MAKE system. 
    V2 is a complete rewrite of the API in FastAPI (Python), 
    and is not backwards compatible with V1, 
    which was written in Rust.

    The API can be accessed at https://make.hmc.edu/api/v2,
    or 127.0.0.1:5000/api/v2 if running locally.

    The backend database is MongoDB, and the database 
    schema is defined in db_schema.py.
    """,
    version="2.0.0",
    docs_url="/api/v2/docs",
    redoc_url="/api/v2/redoc",
    terms_of_service="https://make.hmc.edu/terms",
    contact={
        "name": "HMC Makerspace Management",
        "email": "makerspace-management-l@g.hmc.edu",
        "url": "https://make.hmc.edu",
    },
    license_info={
        "name": "GNU General Public License v3.0",
        "url": "https://www.gnu.org/licenses/gpl-3.0.en.html",
    },

)

app.add_middleware(GZipMiddleware)

app.include_router(inventory_router)
app.include_router(user_router)
app.include_router(checkouts_router)
app.include_router(shifts_router)
app.include_router(student_storage_router)
app.include_router(machines_router)
app.include_router(workshops_router)
app.include_router(misc_router)

# Add /discord to redirect to grandfathered, permanament discord invite
# of https://discord.gg/XMJspQp8b4
# NEVER DELETE THIS FROM THE DISCORD SERVER
# THE ONLY WAY TO GET ANOTHER ONE IS TO TURN ON
# COMMUNITY MODE
app.add_api_route("/discord", lambda: RedirectResponse(url="https://discord.gg/XMJspQp8b4"))

class RedirectMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):

        if scope["type"] == "http":
            request = Request(scope)
            response = await self.redirect(request)
            if response is not None:
                await response(scope, receive, send)
                return
            
        await self.app(scope, receive, send)
    
    async def redirect(self, request: Request):
        # Get the path
        path = request.url.path

        # Remove the / from the beginning of the path
        if path[0] == "/":
            path = path[1:]

        # Get the database
        db = MongoDB()

        # Get the redirects collection
        collection = await db.get_collection("redirects")

        redirect = await collection.find_one({"path": path})

        if redirect is not None:
            ip_log = {
                "uuid": str(uuid.uuid4()),
                "timestamp": datetime.datetime.now().timestamp(),
                "ip": request.client.host,
            }
            
            # Add to the logs attribute of the redirect
            await collection.update_one({"path": path}, {"$push": {"logs": ip_log}})

            # Redirect to the redirect path
            return RedirectResponse(url=redirect["redirect"])
        else:
            return None

app.add_middleware(RedirectMiddleware)
# Add a function to handle most other paths and redirect using the
# redirects collection in the database



# Mount the static files in html mode
app.mount("/", StaticFiles(directory="../MAKE-website", html=True), name="static")

async def validate_database_schema(db):
    # Validate the database schema
    # This function will raise an exception if the database schema is not valid.
    # This function should be called before the server starts.

    # Check that the database has the correct collections
    collections = await db.list_collection_names()
    for name in schema:
        if name not in collections:
            # Create the collection if it does not exist
            await db.create_collection(name)
            # Print log message
            logging.info(f"Created collection {name} in database {db.name}")

    # Check that there's a single document in the status collection
    # with the name "status"
    status = await db["status"].find_one({"name": "status"})
    if status is None:
        # Create the status document
        await db["status"].insert_one({"name": "status"})

        # Insert the STATUS_TEMPLATE into the status document
        await db["status"].update_one({"name": "status"}, {"$set": STATUS_TEMPLATE})
        
        # Print log message
        logging.info(f"Created status document in database {db.name}")


class BackgroundRunner:
    def __init__(self):
        return

    async def run_main(self):
        # Wait 1 second before starting the background tasks
        await asyncio.sleep(1)
        
        while True:
            try:
                # Update available inventory from checkouts
                await update_inventory_from_checkouts()

                # Send emails for checkouts that are overdue
                await send_overdue_emails()

                # Scrape quiz results
                await scrape_quiz_results()

                # Create/update users from quizzes
                await create_update_users_from_quizzes()

                # Send email reminders for workshops
                await send_workshop_reminders()

                # Free up files in user storage
                await cleanup_user_files()

                utilities.last_updated_time = datetime.datetime.now()

                await asyncio.sleep(60)
            except Exception as e:
                logging.error(f"An error occurred in the background runner: {e}")

                # Wait 1 minute before trying again
                await asyncio.sleep(60)

        


runner = BackgroundRunner()

@app.on_event('startup')
async def app_startup():
    asyncio.create_task(runner.run_main())
    asyncio.create_task(run_discord_bot(DISCORD_BOT_TOKEN))

if __name__ == "__main__":
    # Setup logging to display everything to the console
    logging.getLogger().setLevel(logging.INFO)

    if "--prod" in sys.argv:
        # Log to file if in production mode
        # Zip and move old log file
        utilities.zip_and_move_log_file()
        
        logging.basicConfig(filename='make.log', level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
    else:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')

    if not os.path.exists("server_files"):
        os.makedirs("server_files")

    if not os.path.exists("user_files"):
        os.makedirs("user_files")
        
    logging.info("Starting MAKE server...")

    logging.info("Connecting to database...")
    # Connect to mongoDB database
    db = MongoDB()

    logging.info("Connected to database!")

    logging.info("Validating database schema...")
    # Validate the database schema using future
    asyncio.run(validate_database_schema(db.db))

    logging.info("Database schema is valid!")

    # Set timezone to Pacific time, following daylight savings
    os.environ["TZ"] = "US/Pacific"

    # When this python file is run directly, run the uvicorn server
    # in debug mode, and reload the server when the code changes.
    # To determine debug mode, check if the script was run without the --prod flag.
    if "--prod" in sys.argv:
        logging.info("Started MAKE in production mode!")
        # Production mode
        uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info", reload=False)
    else:
        logging.info("Started MAKE in debug mode!")
        uvicorn.run("main:app", host="127.0.0.1", port=8080,
                    log_level="info", reload=False)
