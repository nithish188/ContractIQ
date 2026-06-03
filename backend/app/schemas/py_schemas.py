from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# Auth Schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    id: int
    name: str
    email: str
    role: str

# Clause Schemas
class ClauseResponse(BaseModel):
    id: int
    document_id: int
    title: str
    content: str
    type: str
    risk_score: int
    risk_level: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True

# Entity Schemas
class EntityResponse(BaseModel):
    id: int
    document_id: int
    entity_type: str
    entity_value: str

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    avg_risk_score: int
    avg_risk_level: str
    user_id: int
    entities: List[EntityResponse] = []

    class Config:
        from_attributes = True

# Executive Summary details
class ExecutiveSummaryResponse(BaseModel):
    contract_overview: str
    purpose: str
    key_obligations: List[str]
    deadlines: List[str]
    risks: str
    recommendations: List[str]
