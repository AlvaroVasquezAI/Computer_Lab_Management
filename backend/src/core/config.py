import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='./backend/.env')

class Settings:
    """
    Application settings loaded from environment variables.
    """
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # --- JWT Settings ---
    # To generate a good secret key, run this in a Python shell:
    # import secrets; secrets.token_hex(32)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_bad_default_secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    SMTP_SERVER: str = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    EMAIL_ADDRESS: str = os.getenv("EMAIL_ADDRESS")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD")

settings = Settings()