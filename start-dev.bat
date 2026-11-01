@echo off
title Smart Community - Platform Runner
color 0b

echo ======================================================================
echo          SMART COMMUNITY SKILL & CAREER PLATFORM
echo               Starting Backend + Frontend...
echo ======================================================================
echo.

:: Check if Laragon / MySQL is running
echo [*] Checking MySQL service (Port 3306)...
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [WARNING] MySQL on port 3306 does not seem active!
    echo           Please ensure Laragon is opened and click 'Start All'.
    echo.
) else (
    echo [OK] MySQL is active on port 3306.
    echo.
)

:: 1. Start Backend in separate window
echo [1/2] Launching Backend API (Port 4000)...
start "Smart Community - Backend (Port 4000)" cmd /k "cd /d %~dp0backend && npm run dev"

:: 2. Start Frontend User in separate window
echo [2/2] Launching Frontend Web (Port 5173)...
start "Smart Community - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend_user && npm run dev"

echo.
echo ======================================================================
echo   SUCCESS: Both services have been launched!
echo.
echo   - Backend API:  http://localhost:4000
echo   - Frontend Web: http://localhost:5173
echo   - Database:     Laragon MySQL 3306 (final_pro)
echo ======================================================================
echo.
timeout /t 5
