import datetime
import logging
import os
import uuid

from fastapi.responses import FileResponse

from config import USER_STORAGE_LIMIT_BYTES
from utilities import validate_api_key
from db_schema import *

from fastapi import APIRouter, HTTPException, Request

cert_router = APIRouter(
    prefix="/api/v2/certifications",
    tags=["users", "certifications"],
    responses={404: {"description": "Not found"}},
)

@cert_router.get("/")
async def get_all_certifications(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Get all certifications...")

    db = MongoDB()

    # Get the certification collection
    collection = await db.get_collection("certifications")
    certs = await collection.find().to_list(None)

    certs = [Certification(**cert) for cert in certs]

    return certs

@cert_router.post("/certification", status_code=201)
async def add_certification(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Add certification...")

    # Get the API key
    api_key = request.headers["api-key"]

    db = MongoDB()

    # Check if the API key is valid
    is_valid = await validate_api_key(db, api_key, "checkout")

    if not is_valid:
        # The API key is not valid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key") 
    
    # Get the certification collection
    certifications = await db.get_collection("certifications")

    json = await request.json()

    try :
        cert = Certification(**json)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid certification data") from e


    # Check if the certification already exists
    certification = await certifications.find_one({"uuid": cert.uuid})

    if certification:
        # Replace the existing certification
        await certifications.replace_one({"uuid": cert.uuid}, cert.model_dump())
    else:
        # Add the certification
        await certifications.insert_one(cert.model_dump())


@cert_router.delete("/certification", status_code=204)
async def delete_certification(request: Request):
    logging.getLogger().setLevel(logging.INFO)
    logging.info("Delete certification...")

    # Get the API key
    api_key = request.headers["api-key"]

    db = MongoDB()

    # Check if the API key is valid
    is_valid = await validate_api_key(db, api_key, "admin")

    if not is_valid:
        # The API key is not valid
        # Return error
        raise HTTPException(status_code=401, detail="Invalid API key") 
    
    # Get the certification collection
    certifications = await db.get_collection("certifications")

    json = await request.json()

    cert_uuid = json["uuid"]
    
    # Check if the certification exists
    certification = await certifications.find_one({"uuid": cert_uuid})

    if certification:
        # Delete the certification
        await certifications.delete_one({"uuid": cert_uuid})
    else:
        # Return error
        raise HTTPException(status_code=404, detail="Certification not found")
