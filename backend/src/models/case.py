# backend/models/case.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Location(BaseModel):
    country: str
    region: Optional[str]
    coordinates: Optional[dict]

class Evidence(BaseModel):
    type: str
    url: str
    description: Optional[str]
    date_captured: Optional[datetime]

class CaseCreate(BaseModel):
    title: str
    description: str
    violation_types: List[str]
    status: str = "new"
    priority: str = "medium"
    location: Location
    date_occurred: datetime
    victims: Optional[List[str]] = []
    perpetrators: Optional[List[dict]] = []
    evidence: Optional[List[Evidence]] = []

class Case(CaseCreate):
    case_id: str
    created_at: datetime
    updated_at: datetime
