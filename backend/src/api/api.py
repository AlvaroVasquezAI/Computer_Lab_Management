from fastapi import APIRouter
from src.api.endpoints import auth, dashboard, onboarding, data, workspace, practices, activities

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"]) 
api_router.include_router(data.router, prefix="/data", tags=["Data"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["Workspace"])
api_router.include_router(practices.router, prefix="/practices", tags=["Practices"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])