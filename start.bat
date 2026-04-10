@echo off
REM Start Flask Backend
echo 🚀 Starting Flask Backend...
start cmd /k python app.py

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo 🚀 Starting React Frontend...
cd frontend
start cmd /k npm run dev

echo.
echo ✅ Backend running on: http://localhost:5000
echo ✅ Frontend running on: http://localhost:5173
echo.
echo Close the windows to stop the servers
