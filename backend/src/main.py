from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, Base, SessionLocal
from src.models import (
    teacher, subject, group, room, schedule, practice, booking, activity_log, announcement
)
from src.api.api import api_router
from src.initial_data import seed_initial_data # <-- IMPORT THE SEEDING FUNCTION

# This creates the database tables
Base.metadata.create_all(bind=engine)

# --- RUN THE SEEDING SCRIPT ---
# We create a temporary database session to run our seeding logic.
db = SessionLocal()
try:
    seed_initial_data(db)
finally:
    db.close()
# -----------------------------

app = FastAPI(
    title="Computer Lab Management API",
    description="API for managing lab schedules, practices, and bookings.",
    version="1.0.0",
)

development_origin_regex = r"http://(localhost|127\.0\.0\.1|192\.168\..*|10\..*):5173"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=development_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the new Computer Lab Management API!"}

app.include_router(api_router, prefix="/api")