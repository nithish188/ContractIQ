from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    clauses = relationship("Clause", back_populates="document", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="document", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="document", uselist=False, cascade="all, delete-orphan")

    # Add virtual computed property helper
    @property
    def avg_risk_score(self) -> int:
        if not self.clauses:
            return 0
        return int(sum(c.risk_score for c in self.clauses) / len(self.clauses))

    @property
    def avg_risk_level(self) -> str:
        avg = self.avg_risk_score
        if avg > 70:
            return "HIGH"
        elif avg > 35:
            return "MEDIUM"
        return "LOW"


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH
    reason = Column(Text, nullable=True)

    document = relationship("Document", back_populates="clauses")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String, nullable=False) # Date, Money, Company, Individual, etc.
    entity_value = Column(String, nullable=False)

    document = relationship("Document", back_populates="entities")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False) # JSON formatted string or text description
    generated_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="report")
