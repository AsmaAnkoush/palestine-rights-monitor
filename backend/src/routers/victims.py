from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, model_validator, Field, EmailStr
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from dependencies import get_db # Make sure get_db is correctly set up in dependencies.py

router = APIRouter(prefix="/victims", tags=["Victims"])

# ✅ Risk Assessment Model
class RiskAssessment(BaseModel):
    level: str = "Low"
    threats: List[str] = []
    protection_needed: bool = False

# ✅ Demographics Model
class Demographics(BaseModel):
    gender: Optional[str] = None
    age: Optional[int] = None
    ethnicity: Optional[str] = None
    occupation: Optional[str] = None

# ✅ Contact Info Model
class ContactInfo(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    secure_messaging: Optional[str] = None

# ✅ Individual Create Model
class IndividualCreate(BaseModel):
    type: str # 'victim' or 'witness'
    anonymous: bool
    pseudonym: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    demographics: Optional[Demographics] = None
    contact_info: Optional[ContactInfo] = None
    
    # Here, cases_involved will be a list of custom string case IDs
    cases_involved: List[str] = [] 
    risk_assessment: RiskAssessment
    support_services: List[Dict[str, Any]] = []

    @model_validator(mode='after')
    def validate_fields(cls, values):
        """
        Validates fields based on whether the individual is anonymous or not.
        Ensures required fields are present and handles optional fields.
        """
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

# ✅ Model for updating only the risk level
class RiskLevelUpdate(BaseModel):
    risk_assessment: Dict[str, str]

# ✅ Create a new individual
@router.post("/")
async def create_individual(individual: IndividualCreate, db=Depends(get_db)):
    """
    Creates a new individual (victim or witness) record in the database.
    Assigns default values for created_by, created_at, and updated_at.
    """
    doc = individual.model_dump(by_alias=True, exclude_unset=True)
    
    doc["created_by"] = "admin" 
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    
    # cases_involved are stored as strings, no ObjectId conversion here.
    
    result = await db["individuals"].insert_one(doc)
    return {"id": str(result.inserted_id)}

# ✅ List all individuals
@router.get("/")
async def list_individuals(db=Depends(get_db)):
    """
    Retrieves a list of all individuals from the database.
    Converts ObjectId fields to strings for JSON serialization.
    """
    individuals = await db["individuals"].find().to_list(1000)

    for person in individuals:
        person["id"] = str(person["_id"])
        del person["_id"]

        # cases_involved are returned as strings
        if "cases_involved" in person and isinstance(person["cases_involved"], list):
            person["cases_involved"] = [str(c) for c in person["cases_involved"]]
        
        # Convert datetime objects to ISO strings for JSON compatibility
        if "created_at" in person and isinstance(person["created_at"], datetime):
            person["created_at"] = person["created_at"].isoformat()
        if "updated_at" in person and isinstance(person["updated_at"], datetime):
            person["updated_at"] = person["updated_at"].isoformat()

    return individuals

# ✅ Delete individual by ID
@router.delete("/{id}")
async def delete_individual(id: str, db=Depends(get_db)):
    """
    Deletes an individual record by their ID.
    Raises a 404 HTTPException if the individual is not found.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db["individuals"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Individual not found")
    return {"message": "Individual deleted successfully"}

# ✅ Get individual by ID
@router.get("/{victim_id}")
async def get_victim(victim_id: str, db=Depends(get_db)):
    """
    Retrieves a single individual's details by their ID.
    Raises a 404 HTTPException if the individual is not found.
    """
    if not ObjectId.is_valid(victim_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    victim = await db["individuals"].find_one({"_id": ObjectId(victim_id)})

    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")

    victim["id"] = str(victim["_id"])
    del victim["_id"]

    # cases_involved are returned as strings
    if "cases_involved" in victim and isinstance(victim["cases_involved"], list):
        victim["cases_involved"] = [str(c) for c in victim["cases_involved"]]
    
    # Convert datetime objects to ISO strings
    if "created_at" in victim and isinstance(victim["created_at"], datetime):
        victim["created_at"] = victim["created_at"].isoformat()
    if "updated_at" in victim and isinstance(victim["updated_at"], datetime):
        victim["updated_at"] = victim["updated_at"].isoformat()

    return victim

# ✅ PATCH endpoint to update individual's risk level
@router.patch("/{victim_id}")
async def update_individual_risk_level(victim_id: str, risk_update: RiskLevelUpdate, db=Depends(get_db)):
    """
    Updates the risk level of an individual.
    Accepts a partial update with just the risk_assessment.level.
    """
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



### New Endpoint for Listing Victims by Case ID


@router.get("/case/{case_id}")
async def list_victims_by_case_id(case_id: str, db=Depends(get_db)):
    """
    Retrieves a list of individuals (victims/witnesses) linked to a specific case ID.
    The case ID is assumed to be a custom string identifier (e.g., 'HRM-2023-0423').
    """
    # Find individuals where the 'cases_involved' array contains the given case_id string
    individuals = await db["individuals"].find({"cases_involved": case_id}).to_list(1000)

    if not individuals:
        # It's better to return an empty list or a 200 OK with a message
        # rather than a 404 if no individuals are found for a valid case_id.
        return [] 

    for person in individuals:
        person["id"] = str(person["_id"])
        del person["_id"]

        # Ensure cases_involved are returned as strings
        if "cases_involved" in person and isinstance(person["cases_involved"], list):
            person["cases_involved"] = [str(c) for c in person["cases_involved"]]
        
        # Convert datetime objects to ISO strings
        if "created_at" in person and isinstance(person["created_at"], datetime):
            person["created_at"] = person["created_at"].isoformat()
        if "updated_at" in person and isinstance(person["updated_at"], datetime):
            person["updated_at"] = person["updated_at"].isoformat()

    return individuals