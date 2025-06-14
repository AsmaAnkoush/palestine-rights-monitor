from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Body, Depends
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime, date
import os
import shutil
import json
import mimetypes
import re
from pydantic import BaseModel, Field, EmailStr
from fastapi.responses import JSONResponse, FileResponse

from dependencies import get_db

router = APIRouter()

UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

class Demographics(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = Field(None, ge=0)
    ethnicity: Optional[str] = None
    occupation: Optional[str] = None

class IndividualContactInfo(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    secure_messaging: Optional[str] = None

class RiskAssessment(BaseModel):
    level: str = Field("low", description="Risk level: low, medium, or high.")
    threats: Optional[List[str]] = Field(None, description="List of identified threats.")
    protection_needed: Optional[bool] = Field(False, description="Whether protection is needed.")

class VictimCreate(BaseModel):
    type: str = Field(..., description="Type of individual: 'victim' or 'witness'.")
    anonymous: bool = Field(False, description="True if the individual wishes to remain anonymous.")
    demographics: Optional[Demographics] = Field(None, description="Demographic details of the individual.")
    contact_info: Optional[IndividualContactInfo] = Field(None, description="Contact details.")
    cases_involved: Optional[List[str]] = Field([], description="List of case IDs this individual is involved in.")
    risk_assessment: Optional[RiskAssessment] = Field(None, description="Risk assessment details.")
    created_by: str = Field("admin_user", description="User ID or identifier of who created the record.")

class StatusChange(BaseModel):
    old_status: Optional[str] = None
    new_status: str
    change_date: datetime = Field(default_factory=datetime.utcnow)
    changed_by: Optional[str] = "System"

class Attachment(BaseModel):
    filename: str
    filepath: str
    mimetype: str
    size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class Location(BaseModel):
    country: str
    region: str
    city: Optional[str] = None
    address: Optional[str] = None
    coordinates: Optional[dict] = Field(default_factory=lambda: {"type": "Point", "coordinates": [0, 0]})

class CaseCreate(BaseModel):
    title: str
    description: str
    violation_types: List[str]
    status: str
    priority: str
    location: Location
    date_occurred: datetime
    case_type: Optional[str] = Field(None, description="Type of the case, e.g., 'Human Rights', 'Environmental', 'Civil'.")

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    violation_types: Optional[List[str]] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[Location] = None
    date_occurred: Optional[datetime] = None
    attachments: Optional[List[Attachment]] = None
    case_type: Optional[str] = Field(None, description="Type of the case, e.g., 'Human Rights', 'Environmental', 'Civil'.")

def serialize_doc(doc: Any) -> Any:
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    else:
        return doc

@router.get("/cases/titles")
async def get_case_titles(db: Any = Depends(get_db)):
    try:
        titles_cursor = db["cases"].find({}, {"case_id": 1, "title": 1, "case_type": 1, "_id": 0})
        titles_docs = await titles_cursor.to_list(length=None)
        formatted_titles = []
        for doc in titles_docs:
            case_id = doc.get("case_id")
            title = doc.get("title")
            case_type = doc.get("case_type")
            if isinstance(title, dict):
                title = title.get("en") or title.get("ar") or next(iter(title.values()), None)
            if case_id and title:
                formatted_titles.append({
                    "case_id": case_id,
                    "title": title,
                    "case_type": case_type
                })
        formatted_titles.sort(key=lambda x: x["title"] or "")
        return JSONResponse(content=formatted_titles)
    except Exception as e:
        print("❌ Error in GET /cases/titles:", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch case titles: {str(e)}")

@router.get("/cases/violation_types")
async def get_violation_types(db: Any = Depends(get_db), lang: str = "en"):
    try:
        pipeline = [
            {"$unwind": "$violation_types"},
            {"$project": {"violation_type": "$violation_types", "_id": 0}}
        ]
        cursor = db["cases"].aggregate(pipeline)
        docs = await cursor.to_list(length=None)
        types = []
        for doc in docs:
            vt = doc.get("violation_type")
            if isinstance(vt, str):
                types.append(vt)
            elif isinstance(vt, dict):
                types.append(vt.get(lang) or next(iter(vt.values()), None))
        distinct_types = sorted(set(filter(None, types)))
        return JSONResponse(content=distinct_types)
    except Exception as e:
        print("❌ Error in GET /cases/violation_types:", e)
        raise HTTPException(status_code=500, detail=f"Failed to fetch violation types: {e}")

@router.post("/cases/")
async def create_case(
    title: str = Form(...),
    description: str = Form(...),
    violation_types: str = Form(...),
    status: str = Form(...),
    priority: str = Form(...),
    country: str = Form(...),
    region: str = Form(...),
    city: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    date_occurred: str = Form(...),
    case_type: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Any = Depends(get_db)
):
    try:
        violation_types_list = [v.strip() for v in violation_types.split(',') if v.strip()]
        date_occurred_dt = datetime.strptime(date_occurred, "%Y-%m-%d")
        case_status_history = [
            StatusChange(new_status=status, changed_by="Initial Creation").dict()
        ]
        case_dict = {
            "title": title,
            "description": description,
            "violation_types": violation_types_list,
            "status": status,
            "priority": priority,
            "location": {
                "country": country,
                "region": region,
                "city": city,
                "address": address,
                "geolocation": {"type": "Point", "coordinates": [0, 0]}
            },
            "date_occurred": date_occurred_dt,
            "case_id": f"PRM-{str(ObjectId())[:8]}",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "attachments": [],
            "case_status_history": case_status_history,
            "case_type": case_type
        }
        uploaded_attachments = []
        if files:
            for file in files:
                if not file.filename:
                    continue
                file_extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{ObjectId()}{file_extension}"
                file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                attachment_data = Attachment(
                    filename=unique_filename,
                    filepath=file_path,
                    mimetype=file.content_type,
                    size=file.size,
                    uploaded_at=datetime.utcnow()
                )
                uploaded_attachments.append(attachment_data.dict())
        case_dict["attachments"] = uploaded_attachments
        insert_result = await db["cases"].insert_one(case_dict)
        returned_case = await db["cases"].find_one({"_id": insert_result.inserted_id})
        return JSONResponse(content=serialize_doc(returned_case))
    except HTTPException as e:
        raise e
    except Exception as e:
        print("❌ Error in POST /cases/:", e)
        raise HTTPException(status_code=500, detail=f"Failed to create case: {e}")

@router.get("/cases/")
async def get_cases(
    db: Any = Depends(get_db),
    location_country: Optional[str] = Query(None),
    location_region: Optional[str] = Query(None),
    violation_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search_term: Optional[str] = Query(None),
    date_occurred: Optional[str] = Query(None),
    case_type: Optional[str] = Query(None)
):
    try:
        query = {}
        if location_country:
            query["location.country"] = {"$regex": location_country, "$options": "i"}
        if location_region:
            query["location.region"] = {"$regex": location_region, "$options": "i"}
        if violation_type:
            query["violation_types"] = {"$regex": violation_type, "$options": "i"}
        if status:
            query["status"] = {"$regex": status, "$options": "i"}
        if priority:
            query["priority"] = {"$regex": priority, "$options": "i"}
        if search_term:
            query["$or"] = [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"description": {"$regex": search_term, "$options": "i"}}
            ]
        if date_occurred:
            start = datetime.strptime(date_occurred, "%Y-%m-%d")
            end = start.replace(hour=23, minute=59, second=59, microsecond=999999)
            query["date_occurred"] = {"$gte": start, "$lte": end}
        if case_type:
            query["case_type"] = {"$regex": case_type, "$options": "i"}
        cases_cursor = db["cases"].find(query)
        cases = await cases_cursor.to_list(length=None)
        return JSONResponse(content=[serialize_doc(c) for c in cases])
    except HTTPException as e:
        raise e
    except Exception as e:
        print("❌ Error in GET /cases/:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get("/cases/{case_id}")
async def get_case_by_id(case_id: str, db: Any = Depends(get_db)):
    try:
        case = await db["cases"].find_one({"case_id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return JSONResponse(content=serialize_doc(case))
    except Exception as e:
        print("❌ Error in GET /cases/{case_id}:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch case")

@router.put("/cases/{case_id}")
async def update_case(case_id: str, case_data: CaseUpdate, db: Any = Depends(get_db)):
    try:
        existing_case = await db["cases"].find_one({"case_id": case_id})
        if not existing_case:
            raise HTTPException(status_code=404, detail="Case not found")
        update_data = case_data.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update provided")
        if "status" in update_data and update_data["status"] != existing_case.get("status"):
            status_change = StatusChange(
                old_status=existing_case.get("status"),
                new_status=update_data["status"],
                changed_by="API Update"
            ).dict()
            await db["cases"].update_one({"case_id": case_id}, {"$push": {"case_status_history": status_change}})
        update_data["updated_at"] = datetime.utcnow()
        await db["cases"].update_one({"case_id": case_id}, {"$set": update_data})
        updated_case = await db["cases"].find_one({"_id": update_data.get("_id", existing_case["_id"])})
        return JSONResponse(content=serialize_doc(updated_case))
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error in PUT /cases/{case_id}:", e)
        raise HTTPException(status_code=500, detail="Failed to update case")

@router.patch("/cases/{case_id}")
async def partial_update_case(case_id: str, case_data: CaseUpdate, db: Any = Depends(get_db)):
    try:
        existing_case = await db["cases"].find_one({"case_id": case_id})
        if not existing_case:
            raise HTTPException(status_code=404, detail="Case not found")
        update_data = case_data.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update provided")
        if "status" in update_data and update_data["status"] != existing_case.get("status"):
            status_change = StatusChange(
                old_status=existing_case.get("status"),
                new_status=update_data["status"],
                changed_by="API Update"
            ).dict()
            await db["cases"].update_one({"case_id": case_id}, {"$push": {"case_status_history": status_change}})
        update_data["updated_at"] = datetime.utcnow()
        await db["cases"].update_one({"case_id": case_id}, {"$set": update_data})
        updated_case = await db["cases"].find_one({"_id": update_data.get("_id", existing_case["_id"])})
        return JSONResponse(content=serialize_doc(updated_case))
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Error in PATCH /cases/{case_id}:", e)
        raise HTTPException(status_code=500, detail="Failed to partially update case")

@router.delete("/cases/{case_id}")
async def delete_case(case_id: str, db: Any = Depends(get_db)):
    try:
        result = await db["cases"].delete_one({"case_id": case_id})
        if result.deleted_count == 1:
            return JSONResponse(content={"message": "Case deleted successfully"})
        raise HTTPException(status_code=404, detail="Case not found")
    except Exception as e:
        print(f"❌ Error in DELETE /cases/{case_id}:", e)
        raise HTTPException(status_code=500, detail="Failed to delete case")