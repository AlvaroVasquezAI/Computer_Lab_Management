from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import timedelta
import random
import string
from src.database import get_db
from src.crud import crud_teacher
from src.schemas import teacher as teacher_schema
from src.schemas import token as token_schema
from src.auth import security
from src.core.config import settings
from src.services.email_service import send_password_reset_email 

router = APIRouter()

@router.post("/register", response_model=teacher_schema.Teacher, status_code=status.HTTP_201_CREATED)
def register_new_teacher(
    teacher_in: teacher_schema.TeacherCreate, 
    db: Session = Depends(get_db)
):
    """
    Register a new teacher.
    """
    teacher = crud_teacher.get_teacher_by_email(db, email=teacher_in.email)
    if teacher:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A teacher with this email already exists in the system.",
        )
    new_teacher = crud_teacher.create_teacher(db=db, teacher=teacher_in)
    return new_teacher

@router.post("/login", response_model=token_schema.Token)
def login_for_access_token(
    login_data: token_schema.LoginRequest, 
    db: Session = Depends(get_db)
):
    """
    Authenticate a teacher via email and password and return a JWT access token.
    """
    # The username is now accessed via login_data.email
    teacher = crud_teacher.get_teacher_by_email(db, email=login_data.email)
    
    # The password is now accessed via login_data.password
    if not teacher or not security.verify_password(login_data.password, teacher.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={
            "sub": teacher.email, 
            "role": teacher.role.value,
            "name": teacher.teacher_name 
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Handle forgot password request.
    If the user exists, generate a new password and email it to them.
    """
    teacher = crud_teacher.get_teacher_by_email(db, email=email)
    
    # IMPORTANT: We always return a success message, even if the user doesn't exist.
    # This prevents "user enumeration attacks", where an attacker could guess valid emails.
    if teacher:
        # Generate a new random password
        new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        
        # Update the password in the database
        crud_teacher.update_teacher_password(db, teacher=teacher, new_password=new_password)
        
        # Send the email
        send_password_reset_email(recipient_email=email, new_password=new_password)
        
    return {"message": "If an account with this email exists, a password reset email has been sent."}