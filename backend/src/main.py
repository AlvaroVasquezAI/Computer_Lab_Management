from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, Base
from src.models import (
    teacher, subject, group, room, schedule, practice, booking
)
from src.api.api import api_router

# This creates the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Computer Lab Management API",
    description="API for managing lab schedules, practices, and bookings.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the new Computer Lab Management API!"}

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the new Computer Lab Management API!"}