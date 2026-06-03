from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.utils.config import settings

# For SQLite, check if thread checking is required (needed for SQLite to work with multiple threads in FastAPI)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL, connect_args=connect_args
    )
except Exception as e:
    # If connection fails (e.g. Postgres is not configured), fallback to SQLite automatically
    print(f"Database connection error: {e}. Falling back to SQLite.")
    fallback_url = "sqlite:///./contractiq.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
