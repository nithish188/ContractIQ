import os
import fitz  # PyMuPDF
import docx
from fastapi import HTTPException

def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File path does not exist on disk")

    try:
        if ext == ".pdf":
            return _extract_pdf(file_path)
        elif ext == ".docx":
            return _extract_docx(file_path)
        elif ext == ".txt":
            return _extract_txt(file_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

def _extract_pdf(file_path: str) -> str:
    text_content = []
    # Open PDF using PyMuPDF (fitz)
    with fitz.open(file_path) as doc:
        for i, page in enumerate(doc):
            page_text = page.get_text()
            text_content.append(f"--- [Page {i + 1}] ---\n{page_text}")
    return "\n".join(text_content)

def _extract_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text_content = []
    for para in doc.paragraphs:
        if para.text.strip():
            text_content.append(para.text)
    return "\n".join(text_content)

def _extract_txt(file_path: str) -> str:
    # Try different encodings
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            with open(file_path, "r", encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise ValueError("Unable to decode text file with standard encodings.")
