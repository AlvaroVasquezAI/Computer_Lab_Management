from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from src.crud import crud_teacher 
from src.core.config import settings
from src.database import get_db
from src.models.teacher import Teacher


# --- Password Hashing ---
# Create a CryptContext instance for hashing passwords using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain text password."""
    return pwd_context.hash(password)


# --- JWT Token Handling ---
# This scheme defines that the token should be sent in the Authorization header
# as a Bearer token. It also tells the interactive docs where to get the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Creates a new JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default to the expiration time from settings if not provided
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


# --- User Dependency ---
def get_current_teacher(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> Teacher:
    """
    Dependency to get the current teacher from a JWT token.
    
    This function is used in protected endpoints. It will automatically:
    1. Extract the token from the request's Authorization header.
    2. Validate the token's signature and expiration.
    3. Decode the token to get the user's email.
    4. Fetch the user from the database.
    5. Return the user object or raise a 401 Unauthorized error.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # The "subject" of the token is the user's email
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Fetch the teacher from the database using the email from the token
    teacher = crud_teacher.get_teacher_by_email(db, email=email)
    if teacher is None:
        raise credentials_exception
    return teacher