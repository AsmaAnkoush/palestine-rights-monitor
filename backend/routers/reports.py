import os
import shutil
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json
import traceback
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

from dependencies import get_db
from pymongo.database import Database

router = APIRouter()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

UPLOAD_DIRECTORY = "uploads/reports"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

class Attachment(BaseModel):
    filename: str
    filepath: str
    mimetype: str
    size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class StatusChange(BaseModel):
    old_status: Optional[str] = None
    new_status: str
    change_date: datetime = Field(default_factory=datetime.utcnow)
    changed_by: Optional[str] = "System"

class IncidentLocation(BaseModel):
    country: str
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = Field(default_factory=lambda: {"type": "Point", "coordinates": [0, 0]})

class ContactInfo(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    preferred_contact: Optional[str] = "email"

class IncidentDetails(BaseModel):
    date: datetime
    description: str
    violation_types: List[str]
    location: IncidentLocation

class ReportCreate(BaseModel):
    title: str
    reporter_type: str
    priority: str
    status: str = Field("pending_review")
    related_case_id: Optional[str] = None
    anonymous: bool
    pseudonym: Optional[str] = None
    contact_info: Optional[ContactInfo] = None

    incident_details: IncidentDetails

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    reporter_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    related_case_id: Optional[str] = None
    incident_details: Optional[Dict[str, Any]] = None
    evidence: Optional[List[Attachment]] = None
    anonymous: Optional[bool] = None
    pseudonym: Optional[str] = None
    contact_info: Optional[ContactInfo] = None


def serialize_doc(doc: Any) -> Any:
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    elif isinstance(doc, Attachment):
        doc_dict = doc.dict()
        if 'filepath' in doc_dict and isinstance(doc_dict['filepath'], str):
            doc_dict['filepath'] = doc_dict['filepath'].replace('\\', '/')
        return doc_dict
    else:
        return doc

@router.get("/reports/analytics")
async def get_reports_analytics(db: Database = Depends(get_db)):
    try:
        if await db["reports"].count_documents({}) == 0:
            return JSONResponse(content={"analytics": []})

        pipeline = [
            {"$match": {"incident_details.violation_types": {"$exists": True, "$ne": [], "$type": "array"}}},
            {"$unwind": "$incident_details.violation_types"},
            {"$group": {
                "_id": "$incident_details.violation_types",
                "count": {"$sum": 1}
            }},
            {"$project": {
                "violation_type": "$_id",
                "count": 1,
                "_id": 0
            }},
            {"$sort": {"count": -1}}
        ]

        analytics_cursor = db["reports"].aggregate(pipeline)
        analytics_data = await analytics_cursor.to_list(length=None)
        return JSONResponse(content={"analytics": analytics_data})
    except Exception as e:
        logging.error(f"Failed to fetch analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {e}")

@router.post("/reports/")
async def create_report(
    title: str = Form(...),
    description: str = Form(...),
    violation_type: str = Form(...),
    incident_date: str = Form(...),
    incident_location_country: str = Form(...),
    incident_location_region: Optional[str] = Form(None),
    incident_location_city: Optional[str] = Form(None),
    incident_location_address: Optional[str] = Form(None),
    incident_location_coordinates: str = Form(..., description="GeoJSON Point as JSON string, e.g., {\"type\": \"Point\", \"coordinates\": [lng, lat]}"),
    reporter_type: str = Form(...),
    priority: str = Form(...),
    status: str = Form("pending_review"),
    related_case_id: Optional[str] = Form(None),
    anonymous: bool = Form(...),
    pseudonym: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    files: List[UploadFile] = File(None, alias="evidence"),
    db: Database = Depends(get_db)
):
    try:
        logging.info("Attempting to create a new report.")
        
        try:
            parsed_incident_date = datetime.strptime(incident_date, "%Y-%m-%d")
            logging.info(f"Parsed incident_date: {parsed_incident_date}")
        except ValueError:
            logging.error(f"Invalid incident date format received: {incident_date}")
            raise HTTPException(status_code=400, detail="Invalid incident date format. Use `YYYY-MM-DD`.")

        violation_types_list = [v.strip() for v in violation_type.split(',') if v.strip()]
        logging.info(f"Parsed violation_types: {violation_types_list}")

        try:
            parsed_coordinates = json.loads(incident_location_coordinates)
            if not isinstance(parsed_coordinates, dict) or \
               parsed_coordinates.get("type") != "Point" or \
               not isinstance(parsed_coordinates.get("coordinates"), list) or \
               len(parsed_coordinates["coordinates"]) != 2:
                raise ValueError("Invalid GeoJSON Point structure for coordinates.")
            parsed_coordinates["coordinates"] = [
                float(parsed_coordinates["coordinates"][1]), 
                float(parsed_coordinates["coordinates"][0])
            ]
            logging.info(f"Parsed coordinates: {parsed_coordinates}")
        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Error parsing incident_location_coordinates: {e}. Raw: {incident_location_coordinates}")
            raise HTTPException(status_code=400, detail=f"Invalid incident_location_coordinates JSON format: {e}")

        parsed_contact_info = None
        if not anonymous and contact_info:
            try:
                parsed_contact_info_dict = json.loads(contact_info)
                parsed_contact_info = ContactInfo(**parsed_contact_info_dict)
                logging.info(f"Parsed contact_info: {parsed_contact_info.dict()}")
            except (json.JSONDecodeError, ValueError) as e:
                logging.error(f"Error parsing contact_info: {e}. Raw: {contact_info}")
                raise HTTPException(status_code=400, detail=f"Invalid contact_info JSON format: {e}")
        elif anonymous:
            parsed_contact_info = None
            logging.info("Report is anonymous, contact_info set to None.")

        incident_details_dict = {
            "date": parsed_incident_date,
            "description": description,
            "violation_types": violation_types_list,
            "location": {
                "country": incident_location_country,
                "region": incident_location_region,
                "city": incident_location_city,
                "address": incident_location_address,
                "coordinates": parsed_coordinates
            }
        }
        logging.info(f"Built incident_details: {incident_details_dict}")

        report_dict = {
            "title": title,
            "reporter_type": reporter_type,
            "priority": priority,
            "status": status,
            "related_case_id": related_case_id,
            "report_id": f"IR-{str(ObjectId())[:8]}",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "incident_details": incident_details_dict,
            "evidence": [],
            "report_status_history": [
                StatusChange(new_status=status, changed_by="Initial Creation").dict()
            ],
            "anonymous": anonymous,
            "pseudonym": pseudonym if anonymous else None,
            "contact_info": parsed_contact_info.dict() if parsed_contact_info else None
        }
        logging.info(f"Initial report_dict built: {report_dict}")

        uploaded_evidence = []
        if files:
            for file_obj in files:
                if not file_obj.filename:
                    continue
                file_extension = os.path.splitext(file_obj.filename)[1]
                unique_filename = f"{ObjectId()}{file_extension}"
                file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
                
                file_path_for_db = file_path.replace("\\", "/") 

                try:
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(file_obj.file, buffer)
                    logging.info(f"File saved: {file_path}")

                    attachment_data = Attachment(
                        filename=unique_filename,
                        filepath=file_path_for_db,
                        mimetype=file_obj.content_type,
                        size=file_obj.size if file_obj.size is not None else 0,
                        uploaded_at=datetime.utcnow()
                    )
                    uploaded_evidence.append(attachment_data.dict())
                except Exception as file_error:
                    logging.error(f"Error saving file {file_obj.filename}: {file_error}", exc_info=True)
                    raise HTTPException(status_code=500, detail=f"Failed to save evidence file {file_obj.filename}")

        report_dict["evidence"] = uploaded_evidence
        logging.info(f"Final report_dict before DB insert: {report_dict}")

        insert_result = await db["reports"].insert_one(report_dict)
        logging.info(f"MongoDB insert result: Acknowledged={insert_result.acknowledged}, Inserted ID={insert_result.inserted_id}")

        if not insert_result.acknowledged:
            raise HTTPException(status_code=500, detail="Failed to insert report into database (not acknowledged).")

        returned_report = await db["reports"].find_one({"_id": insert_result.inserted_id})
        
        if returned_report:
            return JSONResponse(content=serialize_doc(returned_report), status_code=201)
        else:
            raise HTTPException(status_code=500, detail="Report created but could not be retrieved.")

    except HTTPException as e:
        logging.error(f"HTTPException caught during report creation: {e.detail}")
        raise e
    except Exception as e:
        logging.error(f"Unexpected error during report creation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create report: {e}")

@router.get("/reports/")
async def list_reports(
    db: Database = Depends(get_db),
    status: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, alias="start_date"),
    end_date: Optional[str] = Query(None, alias="end_date"),
    location: Optional[str] = Query(None),
    limit: int = Query(10, gt=0),
    offset: int = Query(0, ge=0)
):
    try:
        query = {}
        if status:
            query["status"] = {"$regex": status, "$options": "i"}

        date_query = {}
        if start_date:
            try:
                parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = parsed_start_date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use `%Y-%m-%d`.")
        if end_date:
            try:
                parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999)
                date_query["$lte"] = parsed_end_date
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use `%Y-%m-%d`.")

        if date_query:
            query["incident_details.date"] = date_query

        if location:
            query["$or"] = [
                {"incident_details.location.country": {"$regex": location, "$options": "i"}},
                {"incident_details.location.region": {"$regex": location, "$options": "i"}},
                {"incident_details.location.city": {"$regex": location, "$options": "i"}},
                {"incident_details.location.address": {"$regex": location, "$options": "i"}}
            ]

        total_reports = await db["reports"].count_documents(query)
        logging.info(f"Listing reports. Query: {query}, Total: {total_reports}")

        reports_cursor = db["reports"].find(query).skip(offset).limit(limit)
        reports_list = await reports_cursor.to_list(length=None)

        return JSONResponse(content={"total": total_reports, "reports": [serialize_doc(r) for r in reports_list]})
    except Exception as e:
        logging.error(f"Failed to list reports: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {e}")


@router.get("/reports/{report_id}")
async def get_report_by_id(report_id: str, db: Database = Depends(get_db)):
    try:
        logging.info(f"Fetching report with report_id: {report_id}")
        report = await db["reports"].find_one({"report_id": report_id})
        if report:
            return JSONResponse(content=serialize_doc(report))
        logging.warning(f"Report with report_id {report_id} not found.")
        raise HTTPException(status_code=404, detail="Report not found")
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Failed to fetch report by ID: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch report")

@router.put("/reports/{report_id}")
async def update_report(report_id: str, report_data: ReportUpdate, db: Database = Depends(get_db)):
    try:
        logging.info(f"Updating report with report_id: {report_id}. Data: {report_data.dict(exclude_unset=True)}")
        existing_report = await db["reports"].find_one({"report_id": report_id})
        if not existing_report:
            logging.warning(f"Report {report_id} not found for update.")
            raise HTTPException(status_code=404, detail="Report not found")

        update_dict = report_data.dict(exclude_unset=True)

        if "status" in update_dict and update_dict["status"] != existing_report.get("status"):
            status_change = StatusChange(
                old_status=existing_report.get("status"),
                new_status=update_dict["status"],
                changed_by="API Update"
            ).dict()
            await db["reports"].update_one(
                {"report_id": report_id},
                {"$push": {"report_status_history": status_change}}
            )
            logging.info(f"Status history updated for report {report_id}.")
        
        if "incident_details" in update_dict:
            if "incident_details" in existing_report and isinstance(existing_report["incident_details"], dict):
                existing_report["incident_details"].update(update_dict["incident_details"])
            else:
                existing_report["incident_details"] = update_dict["incident_details"]
            del update_dict["incident_details"]
            logging.info(f"Incident details updated for report {report_id}.")

        if "evidence" in update_dict:
            existing_report["evidence"] = [att.dict() for att in update_dict["evidence"]]
            del update_dict["evidence"]
            logging.info(f"Evidence updated for report {report_id}.")

        update_dict["updated_at"] = datetime.utcnow()
        
        await db["reports"].update_one({"report_id": report_id}, {"$set": update_dict})
        
        set_nested_fields = {}
        if "incident_details" in existing_report:
            set_nested_fields["incident_details"] = existing_report["incident_details"]
        if "evidence" in existing_report:
            set_nested_fields["evidence"] = existing_report["evidence"]
        
        if set_nested_fields:
            await db["reports"].update_one(
                {"report_id": report_id},
                {"$set": set_nested_fields}
            )
            logging.info(f"Nested fields (incident_details, evidence) pushed to DB for report {report_id}.")

        updated_report = await db["reports"].find_one({"report_id": report_id})
        logging.info(f"Report {report_id} successfully updated.")
        return JSONResponse(content=serialize_doc(updated_report))
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Failed to update report {report_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update report")

@router.patch("/reports/{report_id}")
async def partial_update_report(report_id: str, report_data: ReportUpdate, db: Database = Depends(get_db)):
    try:
        logging.info(f"Partially updating report with report_id: {report_id}. Data: {report_data.dict(exclude_unset=True)}")
        existing_report = await db["reports"].find_one({"report_id": report_id})
        if not existing_report:
            logging.warning(f"Report {report_id} not found for partial update.")
            raise HTTPException(status_code=404, detail="Report not found")

        update_dict = report_data.dict(exclude_unset=True)

        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update provided")

        if "status" in update_dict and update_dict["status"] != existing_report.get("status"):
            status_change = StatusChange(
                old_status=existing_report.get("status"),
                new_status=update_dict["status"],
                changed_by="API Update"
            ).dict()
            await db["reports"].update_one(
                {"report_id": report_id},
                {"$push": {"report_status_history": status_change}}
            )
            logging.info(f"Status history updated for report {report_id} during partial update.")

        if "incident_details" in update_dict:
            if "incident_details" in existing_report and isinstance(existing_report["incident_details"], dict):
                existing_report["incident_details"].update(update_dict["incident_details"])
            else:
                existing_report["incident_details"] = update_dict["incident_details"]
            del update_dict["incident_details"]
            logging.info(f"Incident details updated for report {report_id} during partial update.")

        if "evidence" in update_dict:
            existing_report["evidence"] = [att.dict() for att in update_dict["evidence"]]
            del update_dict["evidence"]
            logging.info(f"Evidence updated for report {report_id} during partial update.")

        update_dict["updated_at"] = datetime.utcnow()
        await db["reports"].update_one({"report_id": report_id}, {"$set": update_dict})

        set_nested_fields = {}
        if "incident_details" in existing_report:
            set_nested_fields["incident_details"] = existing_report["incident_details"]
        if "evidence" in existing_report:
            set_nested_fields["evidence"] = existing_report["evidence"]
        
        if set_nested_fields:
            await db["reports"].update_one(
                {"report_id": report_id},
                {"$set": set_nested_fields}
            )
            logging.info(f"Nested fields (incident_details, evidence) pushed to DB for report {report_id} during partial update.")

        updated_report = await db["reports"].find_one({"report_id": report_id})
        logging.info(f"Report {report_id} successfully partially updated.")
        return JSONResponse(content=serialize_doc(updated_report))
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Failed to partially update report {report_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to partially update report")

@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, db: Database = Depends(get_db)):
    try:
        logging.info(f"Deleting report with report_id: {report_id}")
        result = await db["reports"].delete_one({"report_id": report_id})
        if result.deleted_count == 1:
            logging.info(f"Report {report_id} deleted successfully.")
            return JSONResponse(content={"message": "Report deleted successfully"})
        logging.warning(f"Report {report_id} not found for deletion.")
        raise HTTPException(status_code=404, detail="Report not found")
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Failed to delete report {report_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete report")