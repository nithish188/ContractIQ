import os
from pathlib import Path
from dotenv import load_dotenv

# Load env file
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "41b7fcf7c73dbad95bf0a4980f77bc542459a933f81e3a98ea83ee66b4478335")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./contractiq.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

settings = Settings()

# Create upload dir if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
