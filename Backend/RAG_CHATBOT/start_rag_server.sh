#!/bin/bash

echo "🚀 Starting RAG Chatbot Server..."
echo "================================="

# Navigate to RAG_CHATBOT directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Set Flask port
export FLASK_PORT=5555

# Start Flask server
echo "🌐 Starting Flask server on port 5555..."
python flask_server.py
