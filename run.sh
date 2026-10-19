#!/usr/bin/env bash
# ==============================================================================
# PaperLens: Automated Research Paper & Evidence Analyzer
# All-In-One Unified Startup Script for macOS (Apple Silicon / Intel)
# ==============================================================================

set -e

# Change to project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "🚀 Starting PaperLens Full-Stack Application"
echo "============================================================"

# 1. Kill any existing instances on ports 8000 (backend) and 5173 (frontend)
echo "🧹 Checking and freeing ports 8000 and 5173..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 2. Check virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment (.venv)..."
    python3 -m venv .venv
    ./.venv/bin/pip install --upgrade pip
    ./.venv/bin/pip install -r backend/requirements.txt
fi

# 3. Check frontend node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# 4. Trap Ctrl+C (SIGINT) to cleanly stop both servers together
cleanup() {
    echo ""
    echo "🛑 Shutting down PaperLens servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    echo "✅ PaperLens stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# 5. Start Backend Server
echo "🐍 Starting FastAPI Backend on http://localhost:8000..."
./.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 6. Start Frontend Server
echo "⚛️  Starting React Vite Frontend on http://localhost:5173..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173) &
FRONTEND_PID=$!

# Wait briefly and automatically open the application in default macOS browser
sleep 2
echo "🌐 Opening PaperLens in your browser..."
open http://localhost:5173 2>/dev/null || true

echo "============================================================"
echo "✨ PaperLens is running!"
echo "   - Web App UI:       http://localhost:5173"
echo "   - Swagger API Docs: http://localhost:8000/docs"
echo "   - Health Telemetry: http://localhost:8000/health"
echo "============================================================"
echo "💡 Press Ctrl + C at any time in this terminal to stop both servers."

# Keep script waiting until interrupted
wait
