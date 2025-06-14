import motor.motor_asyncio
from pymongo.database import Database
from fastapi import Depends

client = motor.motor_asyncio.AsyncIOMotorClient(
    "mongodb+srv://asma:asmaasma@cluster0.kbgepxe.mongodb.net/human_rights_mis?retryWrites=true&w=majority"
)
db_instance = client["human_rights_mis"]

async def get_db() -> Database:
    return db_instance
