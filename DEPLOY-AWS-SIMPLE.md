# 🚀 HSM Tech Bot - AWS Deployment Guide (Clean Version)

## Quick Start Deployment

### Step 1: Create AWS Lightsail Instance

1. Login to AWS Console: https://lightsail.aws.amazon.com/
2. Click **"Create instance"**
3. Select **Ubuntu 20.04 LTS**
4. Choose **$5/month plan** (1GB RAM - recommended)
5. Create **static IP** and attach it
6. Add firewall rule: **Port 3000 TCP**
7. Download SSH key (save as `lightsail-key.pem`)

### Step 2: Connect via PuTTY

1. Convert `.pem` to `.ppk` using **PuTTYgen**
2. Open **PuTTY**
3. Host: `ubuntu@YOUR_INSTANCE_IP`
4. Load `.ppk` key in: SSH → Auth → Credentials
5. Connect!

### Step 3: Setup Server

Run these commands one by one:

```bash
# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install tools
sudo apt-get install -y git unzip

# Create directories
mkdir -p ~/hsm-tech-bot
cd ~/hsm-tech-bot
mkdir -p auth data logs temp_downloads VU_Files

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Setup PM2 auto-start
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Copy and run the sudo command it shows
```

### Step 4: Upload Bot Files

**Using WinSCP:**
1. Download WinSCP: https://winscp.net/
2. Connect to: `ubuntu@YOUR_INSTANCE_IP` (use `.ppk` key)
3. Upload to `/home/ubuntu/hsm-tech-bot/`:
   - `bot.js`
   - `src/` folder
   - `package.json`
   - `.env`
   - `ecosystem.config.js`
   - `VU_Files/` folder

### Step 5: Start Bot

```bash
cd ~/hsm-tech-bot
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 logs hsm-tech-bot
```

### Step 6: Scan QR Code

1. Wait for QR code in logs
2. Open WhatsApp → Linked Devices → Link a Device
3. Scan the QR code
4. Wait for: `✅ WhatsApp connection established successfully!`

---

## ✅ Your Bot is Now 24/7 Online!

**Features:**
- ✅ Always online (no automatic restarts)
- ✅ Auto-restart on crash
- ✅ Auto-start on server reboot
- ✅ Keep-alive server on port 3000
- ✅ Memory optimized (max 1GB)

**Only restarts when:**
- Manual restart (`pm2 restart`)
- Server reboots (then auto-starts)
- Memory exceeds 1GB (rare)

---

## Essential Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs hsm-tech-bot

# Restart bot
pm2 restart hsm-tech-bot

# Monitor performance
pm2 monit

# Re-scan QR code
rm -rf auth/
pm2 restart hsm-tech-bot
pm2 logs hsm-tech-bot
```

---

## Monitoring

**Keep-Alive URL:** `http://YOUR_INSTANCE_IP:3000`

**Setup UptimeRobot (Free):**
1. Go to https://uptimerobot.com/
2. Add monitor: `http://YOUR_INSTANCE_IP:3000`
3. Interval: 5 minutes

---

## Monthly Cost

**AWS Lightsail:** $5/month
- 1 GB RAM
- 1 vCPU  
- 40 GB SSD
- 2 TB Transfer

---

## Troubleshooting

**Bot not responding?**
```bash
pm2 status
pm2 logs hsm-tech-bot --lines 100
```

**Session logged out?**
```bash
rm -rf ~/hsm-tech-bot/auth/
pm2 restart hsm-tech-bot
pm2 logs hsm-tech-bot  # Scan new QR
```

**High memory?**
```bash
pm2 restart hsm-tech-bot
```

---

> **That's it! Your bot runs 24/7 without interruptions.**
