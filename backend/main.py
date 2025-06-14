from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

from dependencies import get_db
from routers import victims, cases, reports
from routers import analytics

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI(
    title="Human Rights Monitor API",
    description="API for managing human rights incidents, cases, and individuals.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import motor.motor_asyncio
client = motor.motor_asyncio.AsyncIOMotorClient(
    "mongodb+srv://asma:asmaasma@cluster0.kbgepxe.mongodb.net/human_rights_mis?retryWrites=true&w=majority"
)
users_collection = client["human_rights_mis"]["users"]

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "message": f"Welcome {user['role'].capitalize()}"
    }

app.include_router(cases.router)
app.include_router(reports.router)
app.include_router(victims.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Human Rights Monitor API!"}
