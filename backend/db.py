import motor.motor_asyncio

# ✅ MongoDB connection
client = motor.motor_asyncio.AsyncIOMotorClient(
    "mongodb+srv://asma:asmaasma@cluster0.kbgepxe.mongodb.net/human_rights_mis?retryWrites=true&w=majority"
)
db_instance = client["human_rights_mis"]

# ✅ Dependency function to provide DB to routes
async def get_db():
    return db_instance


