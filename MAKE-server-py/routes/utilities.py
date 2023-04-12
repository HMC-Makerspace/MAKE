async def validate_api_key(db, api_key_str, scope):
    # Get the API keys collection
    collection = await db.get_collection("api_keys")

    # Get the API key
    api_key = await collection.find_one({"Key": api_key_str})

    if api_key is None:
        return False
    
    if api_key["Scope"] != scope and api_key["Scope"] != "admin":
        return False
    
    return True