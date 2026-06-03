import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
from app.api import auth, documents

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("contractiq")

# Initialize database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

# Initialize FastAPI App
app = FastAPI(
    title="ContractIQ – AI-Powered Document Risk Intelligence API",
    description="Backend API services for extracting clauses, identifying liabilities, assessing risk ratings, and exporting audits.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite local server default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router)
app.include_router(documents.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "ContractIQ Document Risk Intelligence API",
        "version": "1.0.0",
        "documentation": "/docs"
    }
