from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, model_validator, Field, EmailStr
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from dependencies import get_db

router = APIRouter(prefix="/victims", tags=["Victims"])

class RiskAssessment(BaseModel):
    level: str = "Low"
    threats: List[str] = []
    protection_needed: bool = False

class Demographics(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None
    ethnicity: Optional[str] = None
    occupation: Optional[str] = None

class ContactInfo(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    secure_messaging: Optional[str] = None

class IndividualCreate(BaseModel):
    type: str
    anonymous: bool
    pseudonym: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    demographics: Optional[Demographics] = None
    contact_info: Optional[ContactInfo] = None
    
    cases_involved: List[str] = []
    risk_assessment: RiskAssessment
    support_services: List[Dict[str, Any]] = []

    @model_validator(mode='after')
    def validate_fields(cls, values):
        anonymous = values.anonymous
        errors = []

        if anonymous:
            if not values.pseudonym:
                errors.append("pseudonym is required for anonymous individual.")
            values.first_name = None
            values.last_name = None
            values.demographics = None
            values.contact_info = None
        else:
            if not values.first_name:
                errors.append("first_name is required for non-anonymous individual.")
            if not values.last_name:
                errors.append("last_name is required for non-anonymous individual.")
            values.pseudonym = None

        if errors:
            raise ValueError(", ".join(errors))

        return values

class RiskLevelUpdate(BaseModel):
    risk_assessment: Dict[str, str]

@router.post("/")
async def create_individual(individual: IndividualCreate, db=Depends(get_db)):
    doc = individual.model_dump(by_alias=True, exclude_unset=True)
    
    doc["created_by"] = "admin" 
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    result = await db["individuals"].insert_one(doc)
    return {"id": str(result.inserted_id)}

@router.get("/")
async def list_individuals(db=Depends(get_db)):
    individuals = await db["individuals"].find().to_list(1000)

    for person in individuals:
        person["id"] = str(person["_id"])
        del person["_id"]

        if "cases_involved" in person and isinstance(person["cases_involved"], list):
            person["cases_involved"] = [str(c) for c in person["cases_involved"]]
        
        if "created_at" in person and isinstance(person["created_at"], datetime):
            person["created_at"] = person["created_at"].isoformat()
        if "updated_at" in person and isinstance(person["updated_at"], datetime):
            person["updated_at"] = person["updated_at"].isoformat()

    return individuals

@router.delete("/{id}")
async def delete_individual(id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db["individuals"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Individual not found")
    return {"message": "Individual deleted successfully"}

@router.get("/{victim_id}")
async def get_victim(victim_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(victim_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    victim = await db["individuals"].find_one({"_id": ObjectId(victim_id)})

    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")

    victim["id"] = str(victim["_id"])
    del victim["_id"]

    if "cases_involved" in victim and isinstance(victim["cases_involved"], list):
        victim["cases_involved"] = [str(c) for c in victim["cases_involved"]]
    
    if "created_at" in victim and isinstance(victim["created_at"], datetime):
        victim["created_at"] = victim["created_at"].isoformat()
    if "updated_at" in victim and isinstance(victim["updated_at"], datetime):
        victim["updated_at"] = victim["updated_at"].isoformat()

    return victim

@router.patch("/{victim_id}")
async def update_individual_risk_level(victim_id: str, risk_update: RiskLevelUpdate, db=Depends(get_db)):
    if not ObjectId.is_valid(victim_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not risk_update.risk_assessment or "level" not in risk_update.risk_assessment:
        raise HTTPException(status_code=400, detail="Missing 'level' in risk_assessment update payload")

    update_data = {
        "$set": {
            "risk_assessment.level": risk_update.risk_assessment["level"],
            "updated_at": datetime.utcnow()
        }
    }

    result = await db["individuals"].update_one(
        {"_id": ObjectId(victim_id)},
        update_data
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Individual not found")
    
    if result.modified_count == 0:
        return {"message": "Individual risk level already set to the provided value, no changes made."}

    updated_individual = await db["individuals"].find_one({"_id": ObjectId(victim_id)})
    if updated_individual:
        updated_individual["id"] = str(updated_individual["_id"])
        del updated_individual["_id"]
        if "cases_involved" in updated_individual and isinstance(updated_individual["cases_involved"], list):
            updated_individual["cases_involved"] = [str(c) for c in updated_individual["cases_involved"]]
        if "created_at" in updated_individual and isinstance(updated_individual["created_at"], datetime):
            updated_individual["created_at"] = updated_individual["created_at"].isoformat()
        if "updated_at" in updated_individual and isinstance(updated_individual["updated_at"], datetime):
            updated_individual["updated_at"] = updated_individual["updated_at"].isoformat()
        return updated_individual
    
    return {"message": "Individual risk level updated successfully"}


@router.get("/case/{case_id}")
async def list_victims_by_case_id(case_id: str, db=Depends(get_db)):
    individuals = await db["individuals"].find({"cases_involved": case_id}).to_list(1000)

    if not individuals:
        return [] 

    for person in individuals:
        person["id"] = str(person["_id"])
        del person["_id"]

        if "cases_involved" in person and isinstance(person["cases_involved"], list):
            person["cases_involved"] = [str(c) for c in person["cases_involved"]]
        
        if "created_at" in person and isinstance(person["created_at"], datetime):
            person["created_at"] = person["created_at"].isoformat()
        if "updated_at" in person and isinstance(person["updated_at"], datetime):
            person["updated_at"] = person["updated_at"].isoformat()

    return individuals
