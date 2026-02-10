# 🔐 Deploy HSM Tech Bot on AWS Using PuTTY

Complete step-by-step guide for deploying your WhatsApp bot to AWS EC2/Lightsail using **PuTTY** on Windows.

---

## 📋 What You Need

1. **AWS Account** (free to create)
2. **PuTTY** - SSH client for Windows
3. **PuTTYgen** - SSH key converter (comes with PuTTY)
4. **Your Bot Files** - Ready to upload

---

## 🚀 Quick Start Overview

Here's what we'll do:
1. ✅ Create AWS EC2/Lightsail instance
2. ✅ Download SSH key (.pem file)
3. ✅ Convert .pem to .ppk using PuTTYgen
4. ✅ Connect using PuTTY
5. ✅ Upload and deploy your bot

**Total time**: 20-30 minutes

---

## 📥 Step 1: Install PuTTY

### Download PuTTY

1. Visit: https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
2. Download **"putty-64bit-X.XX-installer.msi"** (full installer)
3. Run installer - this installs:
   - **PuTTY** - SSH client
   - **PuTTYgen** - Key converter
   - **PSCP** - File transfer tool
   - **Pageant** - Key manager

### Verify Installation

Press `Win + R`, type `putty`, press Enter - PuTTY window should open.

---

## 🌐 Step 2: Create AWS Instance

### Option A: AWS Lightsail (Easiest - Recommended)

1. **Login to AWS**
   - Visit: https://lightsail.aws.amazon.com/
   - Sign in to your AWS account

2. **Create Instance**
   - Click **"Create instance"**
   - **Region**: Choose closest to you (e.g., `us-east-1` for North America, `ap-south-1` for India/Pakistan)
   - **Platform**: Linux/Unix
   - **Blueprint**: OS Only → **Ubuntu 20.04 LTS**
   - **Instance plan**: **$3.50/month** (512 MB RAM, 1 vCPU, 20 GB SSD)
   - **Instance name**: `hsm-tech-bot`
   - Click **"Create instance"**

3. **Wait for Instance** (~2 minutes)
   - Status should show **"Running"** with green checkmark
   - Note the **Public IP address** (e.g., `18.232.145.67`)

### Option B: AWS EC2 (Free Tier for 12 months)

1. **Login to AWS EC2**
   - Visit: https://console.aws.amazon.com/ec2/
   - Sign in to your AWS account

2. **Launch Instance**
   - Click **"Launch Instance"**
   - **Name**: `hsm-tech-bot`
   - **AMI**: Ubuntu Server 20.04 LTS (Free tier eligible)
   - **Instance type**: t2.micro or t3.micro (Free tier eligible)
   - **Key pair**: Click **"Create new key pair"**
     - Name: `hsm-tech-bot-key`
     - Type: RSA
     - Format: **.pem** (we'll convert to .ppk)
     - Click **"Create key pair"** - downloads `.pem` file
   - **Network settings**:
     - Allow SSH (port 22)
     - Allow HTTP (port 80) - optional
     - Allow Custom TCP (port 3000) - for bot health check
   - Click **"Launch instance"**

3. **Note Your Instance IP**
   - Go to EC2 dashboard → Instances
   - Find your instance
   - Copy **Public IPv4 address** (e.g., `18.232.145.67`)

---

## 🔑 Step 3: Download SSH Key

### For Lightsail:

1. In Lightsail dashboard, click on your instance name
2. Go to **"SSH keys"** tab (or **"Account"** → **"SSH keys"**)
3. Click **"Download"** next to your region's default key
4. Save as `hsm-tech-bot-key.pem` in a secure location (e.g., `C:\Users\YourName\Documents\AWS-Keys\`)

### For EC2:

You already downloaded the `.pem` file when creating the key pair. If you didn't:
1. **IMPORTANT**: You cannot re-download EC2 keys!
2. You'll need to create a new key pair and re-launch the instance

---

## 🔄 Step 4: Convert .pem to .ppk Using PuTTYgen

PuTTY uses `.ppk` format, but AWS provides `.pem` format. We need to convert it.

### Conversion Steps:

1. **Open PuTTYgen**
   - Press `Win + R`, type `puttygen`, press Enter

2. **Load .pem File**
   - Click **"Load"** button (NOT "Open")
   - In file dialog:
     - Change file type dropdown from "PuTTY Private Key Files (*.ppk)" to **"All Files (*.*)"**
     - Navigate to your `.pem` file
     - Select `hsm-tech-bot-key.pem`
     - Click **"Open"**
   - You should see: **"Successfully imported foreign key"**

3. **Save as .ppk**
   - Click **"Save private key"**
   - Warning about passphrase: Click **"Yes"** (no passphrase for simplicity)
   - Save as `hsm-tech-bot-key.ppk` in same folder
   - Keep PuTTYgen open for next step (optional)

**You now have**: `hsm-tech-bot-key.ppk` ready for PuTTY!

---

## 🔌 Step 5: Connect Using PuTTY

### Configure PuTTY Session:

1. **Open PuTTY**
   - Press `Win + R`, type `putty`, press Enter

2. **Basic Settings** (Session category)
   - **Host Name (or IP address)**: 
     - For Lightsail: `ubuntu@YOUR_INSTANCE_IP`
     - For EC2: `ubuntu@YOUR_INSTANCE_IP`
     - Example: `ubuntu@18.232.145.67`
   - **Port**: `22`
   - **Connection type**: SSH

3. **Configure SSH Key** (Connection → SSH → Auth)
   - In left sidebar: **Connection** → **SSH** → **Auth** → **Credentials**
   - Click **"Browse..."** next to **"Private key file for authentication"**
   - Select your `hsm-tech-bot-key.ppk` file
   - Click **"Open"**

4. **Save Session** (Back to Session category)
   - In left sidebar, click **"Session"** (top)
   - **Saved Sessions**: Type `AWS-HSM-Bot`
   - Click **"Save"**
   - Next time, just double-click `AWS-HSM-Bot` to connect!

5. **Connect**
   - Click **"Open"**
   - **Security Alert**: "The server's host key is not cached" → Click **"Accept"** (first time only)

### You're Connected! 🎉

You should see:
```
Welcome to Ubuntu 20.04.X LTS
...
ubuntu@ip-172-26-XX-XX:~$
```

---

## 📦 Step 6: Setup Server

Now that you're connected via PuTTY, run these commands:

### Update System

```bash
sudo apt-get update -y && sudo apt-get upgrade -y
```

### Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify Installation

```bash
node --version   # Should show v18.x.x
npm --version    # Should show 9.x.x or higher
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Create Bot Directory

```bash
mkdir -p ~/hsm-tech-bot
cd ~/hsm-tech-bot
mkdir -p auth data logs temp_downloads VU_Files
```

---

## 📤 Step 7: Upload Bot Files

You have **3 options** to upload files:

### Option A: PSCP (Recommended - Fastest)

**PSCP** comes with PuTTY and allows file transfer from Windows Command Prompt.

1. **Open Command Prompt** (Win + R → `cmd`)

2. **Navigate to your bot folder**
   ```cmd
   cd C:\Users\SULTAN COMPUTER\.gemini\antigravity\scratch\hsm-tech-bot
   ```

3. **Create ZIP of your bot** (optional but recommended)
   ```powershell
   # In PowerShell
   Compress-Archive -Path *.js,src,package*.json,.env,data,VU_Files,ecosystem.config.js -DestinationPath hsm-tech-bot.zip -Force
   ```

4. **Upload using PSCP**
   ```cmd
   pscp -i C:\Path\To\hsm-tech-bot-key.ppk hsm-tech-bot.zip ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/
   ```

   Example:
   ```cmd
   pscp -i "C:\Users\SULTAN COMPUTER\Documents\AWS-Keys\hsm-tech-bot-key.ppk" hsm-tech-bot.zip ubuntu@18.232.145.67:~/hsm-tech-bot/
   ```

### Option B: WinSCP (GUI - Easiest for beginners)

1. **Download WinSCP**
   - Visit: https://winscp.net/eng/download.php
   - Install WinSCP

2. **Configure Connection**
   - **File protocol**: SFTP
   - **Host name**: YOUR_INSTANCE_IP
   - **Port**: 22
   - **User name**: ubuntu

3. **Add SSH Key**
   - Click **"Advanced..."**
   - **SSH** → **Authentication**
   - **Private key file**: Browse to your `.ppk` file
   - Click **"OK"**

4. **Connect and Transfer**
   - Click **"Login"**
   - Drag and drop files from left (local) to right (server)
   - Upload to: `/home/ubuntu/hsm-tech-bot/`

### Option C: Manual Copy-Paste (Small files only)

For `.env` file or small edits:

1. **In PuTTY**:
   ```bash
   nano ~/hsm-tech-bot/.env
   ```

2. **Copy your .env contents** from local file

3. **Right-click in PuTTY window** to paste

4. **Save**: `Ctrl + X`, then `Y`, then `Enter`

---

## ⚙️ Step 8: Install Dependencies and Start Bot

Back in PuTTY terminal:

### Extract Files (if uploaded zip)

```bash
cd ~/hsm-tech-bot
unzip -o hsm-tech-bot.zip
```

### Install Dependencies

```bash
npm install --production
```

### Start Bot with PM2

```bash
pm2 start ecosystem.config.js
```

### Save PM2 Configuration

```bash
pm2 save
```

### Enable Auto-Start on Server Reboot

```bash
pm2 startup
```

**Important**: Copy the `sudo` command it outputs and run it. Example:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## 📱 Step 9: Link WhatsApp

### View QR Code

```bash
pm2 logs hsm-tech-bot
```

You'll see a QR code in the terminal (ASCII art).

### Scan QR Code

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code from PuTTY window

### Wait for Connection

You should see:
```
✅ WhatsApp connection established successfully!
🤖 HSM Tech Bot is ready!
```

Press `Ctrl + C` to exit logs (bot keeps running).

---

## ✅ Step 10: Verify Deployment

### Check Bot Status

```bash
pm2 status
```

Should show:
```
┌────┬────────────────┬─────────┬─────────┬─────────┬───────────┐
│ id │ name           │ mode    │ ↺       │ status  │ cpu       │
├────┼────────────────┼─────────┼─────────┼─────────┼───────────┤
│ 0  │ hsm-tech-bot   │ fork    │ 0       │ online  │ 0%        │
└────┴────────────────┴─────────┴─────────┴─────────┴───────────┘
```

### View Logs

```bash
pm2 logs hsm-tech-bot --lines 50
```

### Test WhatsApp

Send to your bot:
```
!ping
```

Bot should respond!

### Test Keep-Alive Server

From your Windows PC browser:
```
http://YOUR_INSTANCE_IP:3000
```

Should show: **"HSM Tech Bot is Active! 🤖"**

---

## 🎛️ Managing Your Bot via PuTTY

### Reconnect Anytime

1. Open PuTTY
2. Double-click saved session **"AWS-HSM-Bot"**
3. Connected!

### Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart bot
pm2 restart hsm-tech-bot

# Stop bot
pm2 stop hsm-tech-bot

# View detailed info
pm2 describe hsm-tech-bot

# Monitor resources
pm2 monit
```

### Update Bot Code

1. **Make changes locally** on your Windows PC
2. **Create new ZIP**
3. **Upload via PSCP**:
   ```cmd
   pscp -i "C:\Path\To\hsm-tech-bot-key.ppk" hsm-tech-bot-update.zip ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/
   ```
4. **In PuTTY**:
   ```bash
   cd ~/hsm-tech-bot
   unzip -o hsm-tech-bot-update.zip
   pm2 restart hsm-tech-bot
   ```

---

## 🔧 Troubleshooting PuTTY Connection

### "Network error: Connection timed out"

**Causes**:
- Instance is stopped
- Wrong IP address
- Firewall blocking port 22

**Fix**:
1. Check instance is **"Running"** in AWS console
2. Verify IP address is correct
3. Check Security Group allows port 22 from your IP

### "PuTTY Fatal Error: Disconnected: No supported authentication methods"

**Cause**: SSH key not configured

**Fix**:
1. In PuTTY: Connection → SSH → Auth → Credentials
2. Load your `.ppk` file

### "Server refused our key"

**Causes**:
- Wrong key file
- Wrong username

**Fix**:
1. Verify using correct `.ppk` file
2. Username must be `ubuntu` (for Ubuntu AMI)
3. Try `ec2-user` if using Amazon Linux

### "Access denied"

**Cause**: Username mismatch

**Fix**:
- For Ubuntu: use `ubuntu`
- For Amazon Linux: use `ec2-user`
- For Debian: use `admin`

---

## 🔐 Security Best Practices

### 1. Protect Your .ppk File

```
❌ DON'T: Commit to GitHub
❌ DON'T: Share via email
✅ DO: Store in secure folder
✅ DO: Keep backup in encrypted drive
```

### 2. Use Pageant (Key Manager)

For convenience without compromising security:

1. **Open Pageant** (PuTTY's key manager)
2. **Right-click Pageant icon** in system tray
3. **Add Key** → Select your `.ppk` file
4. Now PuTTY auto-uses this key without configuring each session

### 3. Configure AWS Security Group

Only allow SSH from your IP:

1. AWS Console → EC2 → Security Groups
2. Edit inbound rules for SSH (port 22)
3. Change source from `0.0.0.0/0` to **"My IP"**

### 4. Regular Updates

```bash
# Monthly security updates
sudo apt-get update && sudo apt-get upgrade -y
```

---

## 💰 Cost Breakdown

### AWS Lightsail
- **Instance**: $3.50/month (512 MB)
- **Data transfer**: Included (1 TB/month)
- **Total**: **$3.50/month**

### AWS EC2 (Free Tier)
- **First 12 months**: FREE (750 hours/month)
- **After 12 months**: ~$7-10/month
- **Data transfer**: First 100 GB free

---

## 📊 Monitoring from Windows

### PM2 Web Dashboard (Optional)

**Install PM2 Web:**
```bash
pm2 install pm2-server-monit
```

**Access from browser:**
```
http://YOUR_INSTANCE_IP:9615
```

Shows:
- Real-time CPU/Memory
- Process list
- Logs
- Custom metrics

---

## ✅ Deployment Checklist

- [ ] PuTTY installed
- [ ] AWS instance created (Lightsail or EC2)
- [ ] .pem key downloaded
- [ ] .ppk key created using PuTTYgen
- [ ] Successfully connected via PuTTY
- [ ] Server setup completed (Node.js, PM2)
- [ ] Bot files uploaded
- [ ] Dependencies installed
- [ ] Bot started with PM2
- [ ] PM2 auto-start configured
- [ ] WhatsApp QR scanned and linked
- [ ] Bot responds to `!ping`
- [ ] Keep-alive server accessible

---

## 🎉 Success!

Your **HSM Tech Bot** is now running 24/7 on AWS, managed via PuTTY!

**What you've achieved:**
- ✅ Professional cloud hosting
- ✅ Remote management from Windows via PuTTY
- ✅ Auto-restart on crashes
- ✅ Persistent WhatsApp session
- ✅ Bot runs even when your PC is off

**Quick Access:**
- **Connect**: Double-click `AWS-HSM-Bot` in PuTTY
- **Logs**: `pm2 logs`
- **Status**: `pm2 status`
- **Restart**: `pm2 restart hsm-tech-bot`

---

## 📞 Need Help?

1. Check bot logs: `pm2 logs hsm-tech-bot`
2. Check status: `pm2 status`
3. Review [DEPLOY-AWS.md](./DEPLOY-AWS.md) for detailed AWS info
4. Review [DEPLOY-24-7.md](./DEPLOY-24-7.md) for stability tips

**Total Setup Time**: 20-30 minutes  
**Monthly Cost**: $3.50-10  
**Uptime**: 99.9%+ with PM2

Happy deploying! 🚀
