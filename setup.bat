@echo off
echo =======================================================
echo          StudyGenius AI - Automated Project Setup
echo =======================================================

echo.
echo [1/4] Checking prerequisites...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10 or newer.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js 18 or newer.
    pause
    exit /b 1
)

echo Prerequisites found.
echo.

echo [2/4] Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

if not exist ".env" (
    echo Copying .env.example to .env...
    copy .env.example .env
    echo.
    echo [ACTION REQUIRED] Please edit backend\.env and add your GEMINI_API_KEY!
)

if not exist "chroma_db" (
    echo Ingesting documents to ChromaDB...
    python ingest.py
)

cd ..
echo Backend setup complete.
echo.

echo [3/4] Setting up Frontend...
cd frontend
if not exist ".env.local" (
    echo Copying .env.example to .env.local...
    copy .env.example .env.local
)

echo Installing Node dependencies...
npm install

cd ..
echo Frontend setup complete.
echo.

echo =======================================================
echo                Setup Completed!
echo =======================================================
echo Next steps:
echo 1. Add your GEMINI_API_KEY inside backend\.env
echo 2. Run 'start.bat' or run backend & frontend separately.
echo.
pause
