# How to Access Your AWS Bot Terminal

## Quick Access Guide

You have two options to access your bot's terminal and see the logs:

---

## Option 1: Using PowerShell/Windows Terminal (Recommended)

### Step 1: Get Your Instance IP Address

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click on your instance: **`hsm-tech-bot-instance`**
3. Copy the **Public IP address** (something like `3.xx.xx.xx`)

### Step 2: Connect via SSH

Open PowerShell and run:

```powershell
cd "c:\Users\SULTAN COMPUTER\.gemini\antigravity\scratch\hsm-tech-bot"
ssh -i hsm-bot-key.pem ubuntu@YOUR_INSTANCE_IP
```

Replace `YOUR_INSTANCE_IP` with the IP you copied from AWS Console.

> **Note**: If you get a "WARNING: UNPROTECTED PRIVATE KEY FILE" error, you can ignore it or fix it by running:
> ```powershell
> icacls hsm-bot-key.pem /inheritance:r
> icacls hsm-bot-key.pem /grant:r "%username%":"(R)"
> ```

### Step 3: View Bot Logs

Once connected to your instance, run:

```bash
# View live bot logs (shows real-time output)
pm2 logs hsm-tech-bot

# Or use these commands:
pm2 status              # Check if bot is running
pm2 monit               # Monitor CPU/Memory usage
pm2 restart hsm-tech-bot   # Restart the bot if needed
pm2 stop hsm-tech-bot      # Stop the bot
pm2 start hsm-tech-bot     # Start the bot
```

---

## Option 2: Using AWS Lightsail Browser-Based SSH

If you prefer not to use PowerShell:

1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click on your instance: **`hsm-tech-bot-instance`**
3. Click the **"Connect using SSH"** button (orange terminal icon)
4. A browser-based terminal will open
5. Run the command:
   ```bash
   pm2 logs hsm-tech-bot
   ```

---

## Quick Reference Commands

Once you're connected to your instance:

```bash
# View bot logs (live)
pm2 logs hsm-tech-bot

# Check bot status
pm2 status

# Restart bot
pm2 restart hsm-tech-bot

# Stop bot
pm2 stop hsm-tech-bot

# Start bot
pm2 start ecosystem.config.js

# View last 100 lines of logs
pm2 logs hsm-tech-bot --lines 100

# Monitor resource usage
pm2 monit

# Exit logs view (press Ctrl+C)
```

---

## Need the QR Code?

If you need to scan the WhatsApp QR code again:

1. SSH into your instance (using either method above)
2. Run: `pm2 logs hsm-tech-bot`
3. The QR code should appear in the logs
4. If not, restart the bot: `pm2 restart hsm-tech-bot`
5. Watch the logs again: `pm2 logs hsm-tech-bot`

---

## Troubleshooting

### Bot not running?
```bash
cd ~/hsm-tech-bot
pm2 start ecosystem.config.js
```

### Need to update bot code?
```bash
cd ~/hsm-tech-bot
# Upload new files first, then:
npm install
pm2 restart hsm-tech-bot
```

### Check if server is running?
```bash
sudo systemctl is-active pm2-ubuntu
```
