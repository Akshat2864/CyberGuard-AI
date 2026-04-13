#!/bin/bash

set -e

echo "🚀 CyberGuardAI - Startup Script"
echo "================================"

# Setup Node.js if needed
if ! command -v node &> /dev/null; then
    echo "📦 Setting up Node.js..."
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        nvm install node > /dev/null 2>&1
        nvm use node > /dev/null 2>&1
    fi
fi

# Install Python dependencies if needed
echo "📦 Installing Python dependencies..."
python3 -m pip install -q -r requirements.txt 2>/dev/null || true

# Install npm dependencies if needed
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps --silent 2>/dev/null || npm install --legacy-peer-deps
cd ..

# Start Flask Backend
echo ""
echo "🚀 Starting Backend (Flask)..."
python3 app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start Frontend
echo "🚀 Starting Frontend (Vite)..."
cd frontend
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

# Trap ctrl+c to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT

echo ""
echo "================================"
echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:5173"
echo "================================"
echo ""
echo "🌐 Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop"
echo ""

wait
