from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from datetime import datetime
import fitz # PyMuPDF
from src import crud, models, schemas
from src.database import get_db
from src.services.pdf_analyzer import PdfAnalyzer
from src.services.section_config import SECTION_ORDER, SECTION_KEYWORDS, DB_MAPPING

router = APIRouter()

# Create an instance of your analyzer
pdf_analyzer_instance = PdfAnalyzer(SECTION_ORDER, SECTION_KEYWORDS, DB_MAPPING)

# Define the base directory for uploads within the container
UPLOADS_DIR = "/app/uploads"


@router.post("/upload", response_model=schemas.Practice, status_code=status.HTTP_201_CREATED)
def upload_practice_endpoint(
    title: str = Form(...),
    subject: str = Form(...),
    teacher_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Validate teacher exists 
    teacher = crud.get_teacher(db, teacher_id=teacher_id)
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with ID {teacher_id} not found."
        )

    # --- 2. PERFORM PDF ANALYSIS ---
    # Read the file content into memory to be processed
    file_content = file.file.read()
    analysis_report = {}
    try:
        # Open the PDF document from the in-memory content
        with fitz.open(stream=file_content, filetype="pdf") as doc:
            analysis_report = pdf_analyzer_instance.analyze_document(doc)
    except Exception as e:
        # If analysis fails, we can still save the file but with no extracted data
        print(f"PDF Analysis Error: {e}")
        # We'll proceed with an empty report, the file will be saved but marked as un-analyzed.
        analysis_report = {
            "num_pages": 0, "extracted_sections": {}, "found_flags": {},
            "missing_required_sections": list(k for k, v in DB_MAPPING.items() if v["is_required"]),
            "error": str(e)
        }


    # --- 3. SAVE THE FILE TO DISK --- 
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_title = "".join(c if c.isalnum() else "_" for c in title)
    safe_subject = "".join(c if c.isalnum() else "_" for c in subject)
    filename = f"{timestamp}_{teacher_id}_{safe_subject}_{safe_title}_{file.filename}"
    
    teacher_dir = os.path.join(UPLOADS_DIR, str(teacher.id))
    subject_dir = os.path.join(teacher_dir, safe_subject)
    os.makedirs(subject_dir, exist_ok=True)
    
    file_path_on_disk = os.path.join(subject_dir, filename)
    
    # Write the content we already have in memory to the file
    with open(file_path_on_disk, "wb") as buffer:
        buffer.write(file_content)
    

    # --- 4. PREPARE DATA FOR DATABASE ---
    # Map the analysis results to the Pydantic schema fields
    db_data = {
        "title": title,
        "subject": subject,
        "num_pages": analysis_report.get("num_pages", 0),
    }

    for section_key, config in DB_MAPPING.items():
        db_data[config['text_col']] = analysis_report["extracted_sections"].get(section_key)
        db_data[config['flag_col']] = analysis_report["found_flags"].get(section_key, False)
    
    practice_data = schemas.PracticeCreate(**db_data)

    # 5. Create the practice record in the database
    return crud.create_practice(
        db=db,
        practice=practice_data,
        teacher_id=teacher_id,
        file_path=file_path_on_disk
    )

@router.get("/", response_model=List[schemas.Practice])
def read_practices_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    practices = crud.get_practices(db, skip=skip, limit=limit)
    return practices