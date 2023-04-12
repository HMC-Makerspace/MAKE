import sys

from typing import Union
from fastapi import FastAPI
from pydantic import BaseModel

import asyncio
import motor.motor_asyncio
import uvicorn
import logging

# Import the database schema
from db_schema import *

# Import config file
from config import *

class MongoDB():
    def __init__(self):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(
            "mongodb://localhost:27017")
        self.db = self.client[DB_NAME]

    def __del__(self):
        self.client.close()

    async def get_collection(self, name: str) -> Union[motor.motor_asyncio.AsyncIOMotorCollection, None]:
        # Get a collection from the database
        # Returns None if the collection does not exist
        collections = await self.db.list_collection_names()
        if name in collections:
            return self.db[name]
        else:
            return None

# Import routes preventing circular import
from routes.routes_inventory import inventory_router
from routes.routes_users import user_router

# Import all other files
from users.quizzes import scrape_quiz_results
from users.users import create_update_users_from_quizzes


SSL_CERT_PRIVKEY = "/etc/letsencrypt/live/make.hmc.edu/privkey.pem"
SSL_CERT_PERMKEY = "/etc/letsencrypt/live/make.hmc.edu/fullchain.pem"

app = FastAPI()

# Print total routes in each router
print(f"Total routes in inventory router: {len(inventory_router.routes)}")
print(f"Total routes in user router: {len(user_router.routes)}")

app.include_router(inventory_router)
app.include_router(user_router)


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

            await asyncio.sleep(60)


runner = BackgroundRunner()


@app.on_event('startup')
async def app_startup():
    asyncio.create_task(runner.run_main())

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

    # When this python file is run directly, run the uvicorn server
    # in debug mode, and reload the server when the code changes.
    # To determine debug mode, check if the script was run without the --prod flag.
    if "--prod" in sys.argv:
        logging.info("Started MAKE in production mode!")
        # Production mode
        uvicorn.run("main:app", host="0.0.0.0", port=8433, log_level="info", reload=False,
                    workers=16, ssl_keyfile=SSL_CERT_PRIVKEY, ssl_certfile=SSL_CERT_PERMKEY)
    else:
        logging.info("Started MAKE in debug mode!")
        uvicorn.run("main:app", host="127.0.0.1", port=5000,
                    log_level="info", reload=True)
