from fastapi import APIRouter
from src.api.endpoints import auth, dashboard, onboarding, data, workspace, practices, activities, rooms, announcements, admin, analysis, chat, export, schedules

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding"]) 
api_router.include_router(data.router, prefix="/data", tags=["Data"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["Workspace"])
api_router.include_router(practices.router, prefix="/practices", tags=["Practices"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(export.router, prefix="/export", tags=["Data Export"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])