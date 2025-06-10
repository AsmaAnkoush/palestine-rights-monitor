# backend/dependencies.py
import motor.motor_asyncio
from pymongo.database import Database
from fastapi import Depends # هذا ليس ضرورياً جداً هنا، ولكنه لا يضر

# 🛢️ MongoDB connection - تهيئة الاتصال بقاعدة البيانات هنا فقط
# هذا يضمن أن اتصال قاعدة البيانات يتم تهيئته مرة واحدة فقط
client = motor.motor_asyncio.AsyncIOMotorClient(
    "mongodb+srv://asma:asmaasma@cluster0.kbgepxe.mongodb.net/human_rights_mis?retryWrites=true&w=majority"
)
db_instance = client["human_rights_mis"] # هذا هو كائن قاعدة البيانات الذي سيتم تمريره

# ✅ Dependency to get the database client
async def get_db() -> Database:
    """
    دالة اعتمادية لتوفير كائن قاعدة البيانات لمسارات الـ API.
    """
    return db_instance

# يمكنك إضافة أي اعتماديات أخرى مشتركة هنا لاحقاً (مثل المصادقة، التراخيص)
