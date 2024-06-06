import datetime
import json
import uuid
import aiohttp
import jwt
import logging
from config import BAMBULABS_EMAIL, BAMBULABS_PASS
from db_schema import MongoDB, PrinterLog

import traceback
import paho.mqtt.client as mqtt
import asyncio

BASE_API = "https://api.bambulab.com"
MQTT_API = "us.mqtt.bambulab.com"
MQTT_PORT = 8883

POST_FULL_LOGIN_PATH = "https://bambulab.com/api/sign-in/form"
POST_REFRESH_PATH = "v1/user-service/user/refreshtoken"
GET_USER_DEVICES = "v1/iot-service/api/user/bind"

PUSHING_PUSHALL_REQUEST = {
    "pushing": {
        "sequence_id": "0",
        "command": "pushall",
        "version": 1,
        "push_target": 1
    }
}
current_token = None
current_refresh_token = None
current_logs = []

async def get_bambu_tokens():
    async with aiohttp.ClientSession() as session:
        async with session.post(POST_FULL_LOGIN_PATH, json={"account": BAMBULABS_EMAIL, "password": BAMBULABS_PASS}) as response:
            headers = response.headers
            # Get all headers of "Set-Cookie"
            cookies = headers.getall('Set-Cookie')

            # Get the access token and refresh token
            token = None
            refresh_token = None

            for cookie in cookies:
                if "token=" in cookie:
                    token = cookie.split(";")[0]
                    token = token.split("=")[1]

                elif "refreshToken=" in cookie:
                    refresh_token = cookie.split(";")[0]
                    refresh_token = refresh_token.split("=")[1]

            return token, refresh_token
        
async def refresh_bambu_tokens(refresh_token):
        json_content = await bambu_api(refresh_token, POST_REFRESH_PATH, method="POST", json_body={
             "refreshToken": refresh_token
        })

        return json_content["accessToken"], json_content["refreshToken"]

async def bambu_api(token, path, method = "GET", json_body = None):
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {token}"}

        async with session.request(method, f"{BASE_API}/{path}", headers=headers, json=json_body) as response:
            if response.content_type == 'application/json':
                return await response.json()

            return await response.text()
        

# Function to handle incoming MQTT messages

def on_message(client, userdata, msg):
    global current_logs
    payload = json.loads(msg.payload.decode())
    device_id = msg.topic.split('/')[1]
    logging.info(f"Received message from device {device_id}")
  
    log = {
        "device_id": device_id,
        "timestamp": datetime.datetime.now(),
        "payload": payload
    }

    current_logs.append(log)


# Function to gather data for each device
async def gather_device_data(client, device_id):
    topic = f"device/{device_id}/request"
    client.publish(topic, json.dumps(PUSHING_PUSHALL_REQUEST))
    logging.info(f"Requested full data for device {device_id}")

async def bambu_update(on_refresh = False):
    global current_token, current_refresh_token, current_logs
    
    if BAMBULABS_PASS == "PASSWORD":
        return

    # First try again once, but refresh the token
    try:
        if current_token is None and on_refresh is False:
            current_token, current_refresh_token = await get_bambu_tokens()
            logging.info("Got bambu tokens")
        else:
            current_token, current_refresh_token = await refresh_bambu_tokens(current_refresh_token)

        # Get user devices
        devices = await bambu_api(current_token, GET_USER_DEVICES)

        # Clear out the logs
        current_logs = []

        # Parse the JWT, and get the preferred username from the payload data
        user_id = jwt.decode(current_token, options={"verify_signature": False, "verify_aud": False})

        user_id = user_id["preferred_username"]

        # Connect to MQTT
        client = mqtt.Client()
        client.username_pw_set(f"u_{user_id}", current_token)
        client.tls_set()  # Enable TLS

        client.on_message = on_message

        client.connect(MQTT_API, MQTT_PORT)
        client.loop_start()

        # Loop through devices and gather data
        for device in devices["devices"]:
            device_id = device["dev_id"]
            client.subscribe(f"device/{device_id}/report")  # Subscribe to report topic
            await gather_device_data(client, device_id)  # Request data

        # Keep the loop alive for a while to receive responses
        await asyncio.sleep(10)
        client.loop_stop()

        client.disconnect()

        # Now we have a list of logs
        # For each device, use the most recent log that had a "print" key
        # And save it to the database
        db = MongoDB()
        printer_collection = await db.get_collection("printer_logs")

        for device in devices["devices"]:
            device_id = device["dev_id"]
            logs = [log for log in current_logs if log["device_id"] == device_id]
            logs = sorted(logs, key=lambda x: x["timestamp"], reverse=True)

            printer_log = {
                "uuid": str(uuid.uuid4()),
                "timestamp": datetime.datetime.now().timestamp(),
                "printer_name": device["name"],
                "printer_online": device["online"],
                "printer_json": None
            }

            for log in logs:
                if "print" in log["payload"] and log["payload"]["print"]["msg"] == 0:
                    data = log["payload"]["print"]

                    # Remove upgrade state because it has the 
                    # serial number of the printer
                    # Remove net because it has the IP address
                    if "upgrade_state" in data:
                        del data["upgrade_state"]

                    if "net" in data:
                        del data["net"]

                    printer_log["printer_json"] = data
                    break
                
            
            printer_log = PrinterLog(**printer_log)

            await printer_collection.insert_one(printer_log.model_dump())

        # If more than 10,000 logs, delete the oldest 1000
        if await printer_collection.count_documents({}) > 10000:
            oldest_logs = printer_collection.find().sort("timestamp", 1).limit(1000)
            async for log in oldest_logs:
                await printer_collection.delete_one({"uuid": log["uuid"]})


    except Exception as e:
        # print traceback
        logging.error(traceback.format_exc())
        if on_refresh:
            logging.error("Failed to refresh bambu token: " + str(e))
            return
        
        # Wrap this in a try except block to prevent the server from crashings
        # in case the problem is with the API, not the token
        try:
            current_token, current_refresh_token = await get_bambu_tokens()
        except Exception as e_1:
            logging.error(traceback.format_exc())
            logging.error("Failed to get bambu tokens: " + str(e_1))
            return
        
        await bambu_update(on_refresh = True)