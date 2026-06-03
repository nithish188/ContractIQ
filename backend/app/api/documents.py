import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.db_models import User, Document, Clause, Entity, Report
from app.schemas.py_schemas import DocumentResponse, ClauseResponse, ExecutiveSummaryResponse
from app.auth.security import get_current_user
from app.services.extractor import extract_text_from_file
from app.ai.gemini_client import analyze_contract_with_gemini
from app.services.report_generator import generate_pdf_report
from app.utils.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, DOCX or TXT"
        )
    
    # Save file to uploads folder
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file to server disk: {str(e)}"
        )

    try:
        # Step 1: Extract Text from Document
        extracted_text = extract_text_from_file(file_path, filename)
        if not extracted_text.strip():
            raise ValueError("Extracted text is empty or invalid.")

        # Step 2: Run Gemini Clause, Risk & Entity Pipeline
        clauses_data, entities_data, summary_data = analyze_contract_with_gemini(extracted_text)

        # Step 3: Populate Database
        # Create Document entry
        new_doc = Document(
            user_id=current_user.id,
            filename=filename,
            file_path=file_path
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # Create Clause entries
        for c in clauses_data:
            new_clause = Clause(
                document_id=new_doc.id,
                title=c.get("title", "Unnamed Clause"),
                content=c.get("content", ""),
                type=c.get("type", "Miscellaneous"),
                risk_score=c.get("risk_score", 0),
                risk_level=c.get("risk_level", "LOW"),
                reason=c.get("reason", "")
            )
            db.add(new_clause)

        # Create Entity entries
        for ent in entities_data:
            new_entity = Entity(
                document_id=new_doc.id,
                entity_type=ent.get("entity_type", "Miscellaneous"),
                entity_value=ent.get("entity_value", "")
            )
            db.add(new_entity)

        # Create Report (Executive Summary) entry
        new_report = Report(
            document_id=new_doc.id,
            summary=json.dumps(summary_data)
        )
        db.add(new_report)
        db.commit()
        db.refresh(new_doc)
        
        return new_doc
        
    except Exception as e:
        # Cleanup file if processing fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Document pipeline processing failed: {str(e)}"
        )

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admins can see all documents; Users can see only their own uploads
    if current_user.role == "admin":
        return db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()

@router.get("/{id}", response_model=DocumentResponse)
def get_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check permission
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
        
    return doc

@router.get("/{id}/clauses", response_model=List[ClauseResponse])
def get_document_clauses(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
        
    return doc.clauses

@router.get("/{id}/summary", response_model=ExecutiveSummaryResponse)
def get_document_summary(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc or not doc.report:
        raise HTTPException(status_code=404, detail="Document summary report not found")
        
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this document")
        
    try:
        summary_dict = json.loads(doc.report.summary)
        return summary_dict
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored summary is corrupted or is not standard JSON format"
        )

@router.get("/{id}/report")
def get_pdf_report(
    id: int,
    # Standard query token parameter allows browser downloads using regular anchor href links
    token: str = None, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
        
    pdf_buffer = generate_pdf_report(doc)
    filename = f"ContractIQ_RiskReport_{os.path.splitext(doc.filename)[0]}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != "admin" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
        
    # Delete file from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            # log warning, still proceed to delete from DB
            pass
            
    db.delete(doc)
    db.commit()
    return {"detail": "Document successfully deleted"}
