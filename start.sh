#!/bin/bash

# Start Flask Backend
echo "🚀 Starting Flask Backend..."
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "🚀 Starting React Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Trap ctrl+c to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

echo ""
echo "✅ Backend running on: http://localhost:5000"
echo "✅ Frontend running on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
