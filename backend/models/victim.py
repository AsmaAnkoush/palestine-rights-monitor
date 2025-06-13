from pydantic import BaseModel, model_validator
from typing import List, Optional

class IndividualCreate(BaseModel):
    type: str
    anonymous: bool
    pseudonym: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    demographics: Optional[dict] = None
    contact_info: Optional[dict] = None
    cases_involved: List[str] = []
    risk_assessment: RiskAssessment
    support_services: List[dict] = []

    @model_validator(mode='after')
    def validate_fields(cls, values):
        anonymous = values.anonymous
        errors = []

        if anonymous:
            if not values.pseudonym:
                errors.append("pseudonym is required for anonymous individual.")
        else:
            if not values.first_name:
                errors.append("first_name is required for non-anonymous individual.")
            if not values.last_name:
                errors.append("last_name is required for non-anonymous individual.")
            if not values.demographics:
                errors.append("demographics is required for non-anonymous individual.")
            if not values.contact_info:
                errors.append("contact_info is required for non-anonymous individual.")

        if errors:
            raise ValueError(", ".join(errors))

        return values
