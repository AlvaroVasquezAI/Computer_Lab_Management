@echo off
echo Stopping containers and removing volumes...
docker-compose down -v

echo Cleaning up uploads directory...
IF EXIST ".\backend\uploads" (
    RMDIR /S /Q ".\backend\uploads"
    MKDIR ".\backend\uploads"
)

echo Cleanup complete.