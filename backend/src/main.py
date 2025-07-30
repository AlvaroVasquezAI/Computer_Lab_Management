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

# This regular expression matches:
# 1. http://localhost:5173
# 2. http://127.0.0.1:5173
# 3. Any IP address in the 192.168.x.x range on port 5173
# 4. Any IP address in the 10.x.x.x range on port 5173
# This covers almost all home and office local network configurations automatically.
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