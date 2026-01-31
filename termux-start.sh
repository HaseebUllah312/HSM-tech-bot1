#!/bin/bash

echo "🚀 Starting HSM Tech Bot for Termux..."

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Installing..."
    npm install
fi

# Clear terminal for clean QR code
clear

echo "📱 HSM Tech Bot - Termux Mode"
echo "------------------------------"
echo "To stop the bot, press CTRL + C"
echo ""

# Start the bot
npm start
