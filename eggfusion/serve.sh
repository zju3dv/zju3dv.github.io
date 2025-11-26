#!/bin/bash

# Simple script to serve the webpage locally for preview
# Usage: ./serve.sh [port]

PORT=${1:-8000}

echo "Starting local server on port $PORT..."
echo "Open http://localhost:$PORT in your browser to view the page"
echo "Press Ctrl+C to stop the server"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
# Fallback to Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
# If no Python, try Node.js
elif command -v npx &> /dev/null; then
    npx http-server -p $PORT
else
    echo "Error: No suitable server found. Please install Python or Node.js"
    echo "Alternatively, open index.html directly in your browser"
fi
