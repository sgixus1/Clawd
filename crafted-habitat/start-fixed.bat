@echo off
echo Starting Crafted Habitat (Fixed SQLite Version)...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Create necessary directories
if not exist "data" mkdir data
if not exist "uploads" mkdir uploads

REM Start the fixed server
echo Starting backend server...
start "Crafted Habitat Backend" cmd /k "node server-fixed.js"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo Starting frontend...
start "Crafted Habitat Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Crafted Habitat is starting...
echo ========================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo Health Check: http://localhost:5000/api/health
echo.
echo Press any key to open in browser...
pause >nul

REM Open browser
start http://localhost:5173
start http://localhost:5000/api/health

echo.
echo To stop: Close both command windows.
pause