#!/usr/bin/env bash
set -e

echo "======================================================="
echo "         StudyGenius AI - Automated Project Setup"
echo "======================================================="

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+."
    exit 1
fi

# Backend setup
echo ""
echo "[1/2] Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "[ACTION REQUIRED] Set your GEMINI_API_KEY in backend/.env"
fi

if [ ! -d "chroma_db" ]; then
    echo "Ingesting documents into ChromaDB..."
    python3 ingest.py || echo "Warning: ingest failed. Ensure GEMINI_API_KEY is configured."
fi

cd ..

# Frontend setup
echo ""
echo "[2/2] Setting up Frontend..."
cd frontend
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
fi

npm install
cd ..

echo ""
echo "======================================================="
echo "                  Setup Complete!"
echo "======================================================="
echo "1. Verify backend/.env contains your GEMINI_API_KEY"
echo "2. Run './start.sh' to start both servers"
