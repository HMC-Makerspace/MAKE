import datetime
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

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

# Import all other files
from users.quizzes import scrape_quiz_results
from users.users import create_update_users_from_quizzes

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

app.include_router(inventory_router)
app.include_router(user_router)
app.include_router(checkouts_router)
app.include_router(shifts_router)
app.include_router(student_storage_router)
app.include_router(machines_router)
app.include_router(misc_router)

# Add /discord to redirect to https://discord.gg/uveewgBmME
app.add_api_route("/discord", lambda: RedirectResponse(url="https://discord.gg/uveewgBmME"))

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


class BackgroundRunner:
    def __init__(self):
        return

    async def run_main(self):
        # Wait 10 seconds before starting the background tasks
        await asyncio.sleep(1)
        
        while True:
            # Scrape quiz results
            await scrape_quiz_results()

            # Create/update users from quizzes
            await create_update_users_from_quizzes()

            utilities.last_updated_time = datetime.datetime.now()

            await asyncio.sleep(60)
        


runner = BackgroundRunner()

@app.on_event('startup')
async def app_startup():
    asyncio.create_task(runner.run_main())
    asyncio.create_task(run_discord_bot(DISCORD_BOT_TOKEN))

if __name__ == "__main__":
    # Setup logging to display everything to the console
    logging.getLogger().setLevel(logging.INFO)

    logging.info("Starting MAKE server...")

    logging.info("Connecting to database...")
    # Connect to mongoDB database
    db = MongoDB()

    logging.info("Connected to database!")

    logging.info("Validating database schema...")
    # Validate the database schema using future
    asyncio.run(validate_database_schema(db.db))

    logging.info("Database schema is valid!")

    # Start the discord bot
    logging.info("Starting discord bot...")
    
    logging.info("Discord bot started!")

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
