#!/usr/bin/env bash

echo "Starting StudyGenius AI servers..."

# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Backend running on http://127.0.0.1:8000 (PID $BACKEND_PID)"
echo "Frontend running on http://localhost:3000 (PID $FRONTEND_PID)"

# Wait and handle termination
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT SIGTERM EXIT
wait
