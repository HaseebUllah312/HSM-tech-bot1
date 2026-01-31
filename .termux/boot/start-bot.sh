#!/data/data/com.termux/files/usr/bin/bash

# HSM Tech Bot - Termux Boot Script
# This script runs automatically when phone restarts

# Wait for network to be ready
sleep 10

# Change to bot directory
cd $HOME/hsm-tech-bot

# Acquire wake lock
termux-wake-lock

# Start bot in background
nohup node bot.js > bot.log 2>&1 &

# Save PID
echo $! > bot.pid

# Send notification
termux-notification --title "HSM Tech Bot" --content "Bot started automatically" --id hsm-bot
