from fastapi import APIRouter
from src.api.endpoints import auth, dashboard, onboarding, data 

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"]) 
api_router.include_router(data.router, prefix="/data", tags=["Data"])