#!/bin/bash

echo "🚀 HSM Tech Bot - Termux Background Runner"
echo "==========================================="

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Installing..."
    npm install
fi

# Function to start in foreground (for QR scanning)
start_foreground() {
    echo "📱 Starting in FOREGROUND mode (for QR code scanning)..."
    echo "Press CTRL + C to stop"
    echo ""
    npm start
}

# Function to start in background
start_background() {
    echo "🔄 Starting in BACKGROUND mode..."
    
    # Acquire wake lock to prevent Termux from sleeping
    termux-wake-lock
    echo "🔒 Wake lock acquired"
    
    # Start bot in background with nohup
    nohup node bot.js > bot.log 2>&1 &
    BOT_PID=$!
    echo $BOT_PID > bot.pid
    
    echo "✅ Bot started in background!"
    echo "📋 Process ID: $BOT_PID"
    echo "📄 Logs saved to: bot.log"
    echo ""
    echo "💡 Useful commands:"
    echo "   View logs:  tail -f bot.log"
    echo "   Stop bot:   ./termux-start.sh stop"
    echo "   Check:      ./termux-start.sh status"
}

# Function to stop the bot
stop_bot() {
    if [ -f "bot.pid" ]; then
        PID=$(cat bot.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm bot.pid
            termux-wake-unlock
            echo "✅ Bot stopped (PID: $PID)"
        else
            rm bot.pid
            echo "⚠️ Bot was not running"
        fi
    else
        echo "⚠️ No bot.pid file found"
        # Try to find and kill node processes
        pkill -f "node bot.js" && echo "✅ Killed node processes"
    fi
}

# Function to check status
check_status() {
    if [ -f "bot.pid" ]; then
        PID=$(cat bot.pid)
        if kill -0 $PID 2>/dev/null; then
            echo "✅ Bot is RUNNING (PID: $PID)"
            echo "📄 Last 10 log lines:"
            tail -10 bot.log 2>/dev/null
        else
            echo "❌ Bot is NOT running (stale PID file)"
        fi
    else
        echo "❌ Bot is NOT running"
    fi
}

# Main script
case "$1" in
    "bg"|"background")
        start_background
        ;;
    "stop")
        stop_bot
        ;;
    "status")
        check_status
        ;;
    "logs")
        tail -f bot.log
        ;;
    "restart")
        stop_bot
        sleep 2
        start_background
        ;;
    *)
        echo ""
        echo "Usage: ./termux-start.sh [option]"
        echo ""
        echo "Options:"
        echo "  (none)      Start in foreground (for QR scanning)"
        echo "  bg          Start in background"
        echo "  stop        Stop the bot"
        echo "  status      Check if bot is running"
        echo "  logs        View live logs"
        echo "  restart     Restart the bot in background"
        echo ""
        echo "📱 First time? Run without options to scan QR code."
        echo "🔄 After login? Use 'bg' to run in background."
        echo ""
        start_foreground
        ;;
esac
