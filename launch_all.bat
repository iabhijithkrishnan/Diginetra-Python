@echo off
echo ============================
echo 🚀 Launching DIGINETRA stack
echo ============================

:: Start MJPEG Server
start cmd /k "cd /d D:\My Files\Diginetra Python && python mjpeg_server.py"

:: Wait briefly
timeout /t 2 >nul

:: Start Node.js Backend Server
start cmd /k "cd /d D:\My Files\Diginetra Python\api-backend && node server.js"

:: Wait briefly
timeout /t 2 >nul

:: Start React Frontend (Vite)
start cmd /k "cd /d D:\My Files\Diginetra Python\react-frontend && npm run dev"

:: Wait briefly
timeout /t 2 >nul


echo ✅ All services launched in separate terminals.
