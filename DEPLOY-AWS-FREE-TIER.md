# 🆓 AWS Free Tier Deployment Guide (12 Months Free)

> Deploy your bot on AWS EC2 Free Tier - **No cost for 12 months**

---

## 📋 What You Get (Free for 12 Months)

✅ **EC2 t2.micro instance** - 1 GB RAM, 1 vCPU
✅ **750 hours/month** - Enough for 24/7 operation
✅ **30 GB SSD storage**
✅ **15 GB data transfer/month**
✅ **After 12 months:** ~$8-10/month (or switch to Oracle Cloud)

---

## 🚀 Step 1: Create AWS Account

1. Go to: https://aws.amazon.com/free/
2. Click **"Create a Free Account"**
3. Enter email, password, account name
4. **Verification:** Credit/debit card required (won't be charged)
5. Choose **Basic Support Plan** (Free)
6. Complete phone verification

**Important:** Card is for verification only. You won't be charged while on Free Tier.

---

## 🚀 Step 2: Launch EC2 Instance

### 2.1 Access EC2 Console

1. Login to AWS Console: https://console.aws.amazon.com/
2. Search for **"EC2"** in search bar
3. Click **"Launch Instance"**

### 2.2 Configure Instance

**Name:**
```
hsm-tech-bot
```

**Application and OS Images:**
- Click **"Ubuntu"**
- Select **"Ubuntu Server 20.04 LTS (HVM), SSD Volume Type"**
- Architecture: **64-bit (x86)**
- ✅ Make sure it says **"Free tier eligible"**

**Instance Type:**
- Select **"t2.micro"**
- ✅ Check for **"Free tier eligible"** label

**Key Pair:**
1. Click **"Create new key pair"**
2. Name: `hsm-bot-key`
3. Type: **RSA**
4. Format: **`.pem`** (for PuTTY conversion)
5. Click **"Create key pair"**
6. **Save the .pem file safely!**

**Network Settings:**
- Click **"Edit"**
- Auto-assign public IP: **Enable**
- Create security group with these rules:
  - ✅ **SSH** (Port 22) - Source: My IP (or 0.0.0.0/0)
  - ✅ **Custom TCP** (Port 3000) - Source: 0.0.0.0/0

**Storage:**
- Keep default: **8 GB gp3** (or increase to 30 GB - still free tier)

### 2.3 Launch Instance

1. Click **"Launch instance"**
2. Wait 1-2 minutes for instance to start
3. Click **"View Instances"**

---

## 🚀 Step 3: Get Instance IP

1. In EC2 Dashboard, click on your instance
2. Copy the **"Public IPv4 address"**
3. Example: `3.80.123.45`

**Save this IP - you'll need it for connection!**

---

## 🚀 Step 4: Connect via PuTTY

### 4.1 Convert .pem to .ppk

1. Open **PuTTYgen**
2. Click **"Load"**
3. Select **"All Files (*.*)"**
4. Choose your `hsm-bot-key.pem`
5. Click **"Save private key"** → Yes (no passphrase)
6. Save as `hsm-bot-key.ppk`

### 4.2 Connect

1. Open **PuTTY**
2. **Host Name:** `ubuntu@YOUR_INSTANCE_IP`
3. **Port:** 22
4. Go to: **Connection** → **SSH** → **Auth** → **Credentials**
5. Browse and select `hsm-bot-key.ppk`
6. **(Optional)** Go back to **Session**, name it `HSM-Bot-AWS`, click **Save**
7. Click **"Open"**
8. Click **"Accept"** on security alert

✅ You're connected!

---

## 🚀 Step 5: Setup Server

Run these commands one by one:

```bash
# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node installation
node --version
npm --version

# Install PM2
sudo npm install -g pm2

# Install tools
sudo apt-get install -y git unzip

# Create bot directory
mkdir -p ~/hsm-tech-bot
cd ~/hsm-tech-bot
mkdir -p auth data logs temp_downloads VU_Files

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Setup PM2 auto-start
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

**Important:** After the last command, copy the `sudo` command it shows and run it.

---

## 🚀 Step 6: Upload Bot Files

### Using WinSCP:

1. Download: https://winscp.net/
2. Open WinSCP
3. **File protocol:** SFTP
4. **Host name:** Your EC2 IP
5. **Port:** 22
6. **User name:** ubuntu
7. Click **"Advanced"** → **"SSH"** → **"Authentication"**
8. Select your `hsm-bot-key.ppk`
9. Click **"OK"** → **"Login"**

**Upload these to `/home/ubuntu/hsm-tech-bot/`:**
- `bot.js`
- `src/` (entire folder)
- `package.json`
- `.env`
- `ecosystem.config.js`
- `VU_Files/` (your files folder)

---

## 🚀 Step 7: Start Bot

Back in PuTTY:

```bash
# Navigate to bot directory
cd ~/hsm-tech-bot

# Install dependencies
npm install --production

# Start bot with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# View logs (QR code will appear here)
pm2 logs hsm-tech-bot
```

---

## 🚀 Step 8: Scan QR Code

1. Wait for QR code in logs
2. Open **WhatsApp** on your phone
3. Tap **Menu (⋮)** → **Linked Devices**
4. Tap **"Link a Device"**
5. Scan the QR code

**Wait for:** `✅ WhatsApp connection established successfully!`

Press **Ctrl+C** to exit logs (bot keeps running)

---

## ✅ Verify 24/7 Operation

### Check Status
```bash
pm2 status
```

Should show:
```
┌─────┬──────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ mode    │ ↺       │ status  │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ hsm-tech-bot     │ fork    │ 0       │ online  │ 5m       │
└─────┴──────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### Check Keep-Alive
Visit: `http://YOUR_EC2_IP:3000`

Should show: `HSM Tech Bot is Active! 🤖`

### Test Bot
Send message to bot: `!ping`

✅ Bot should respond!

---

## 🔐 Allocate Elastic IP (Recommended)

Without this, your IP changes when instance restarts.

1. EC2 Console → **"Elastic IPs"** (left sidebar)
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new IP → **Actions** → **"Associate Elastic IP address"**
5. Select your `hsm-tech-bot` instance
6. Click **"Associate"**

✅ Your IP is now permanent!

**Note:** Elastic IP is **free** while attached to a running instance. If instance stops, you'll be charged $0.005/hour (~$3.60/month).

**Keep instance running 24/7** to avoid charges!

---

## 📊 Essential Commands

```bash
# Check bot status
pm2 status

# View live logs
pm2 logs hsm-tech-bot

# Restart bot
pm2 restart hsm-tech-bot

# Stop bot
pm2 stop hsm-tech-bot

# Real-time monitoring
pm2 monit

# Re-scan QR code
rm -rf auth/
pm2 restart hsm-tech-bot
pm2 logs hsm-tech-bot
```

---

## 💰 Free Tier Limits (Stay Within These)

✅ **750 hours/month** - Running 24/7 = 720 hours ✅
✅ **30 GB storage** - You're using ~5-10 GB ✅
✅ **15 GB data transfer out** - Bot uses minimal data ✅
✅ **1 million requests** - More than enough ✅

**You're well within limits for 24/7 bot operation!**

---

## ⚠️ Important Reminders

### Keep Instance Running
- ❌ **Don't stop the instance** unnecessarily
- ✅ Keep it running 24/7 for free tier benefits

### After 12 Months
AWS Free Tier expires after 12 months. Then:
- **Option 1:** Pay ~$8-10/month for EC2
- **Option 2:** Migrate to Oracle Cloud Free Tier (free forever)
- **Option 3:** Switch to AWS Lightsail ($5/month)

I recommend planning to migrate to Oracle Cloud before month 12.

---

## 🔍 Troubleshooting

### Can't connect via PuTTY?
- Verify EC2 instance is **running** (check AWS console)
- Check security group allows **port 22** from your IP
- Verify correct `.ppk` key loaded

### Bot not starting?
```bash
pm2 logs hsm-tech-bot --err
```

Check for missing `.env` or incorrect configuration.

### High data transfer?
```bash
# Check network usage
sudo apt-get install -y vnstat
vnstat -h
```

If exceeding 15GB/month, reduce Google Drive refresh frequency.

---

## 📈 Monitor Free Tier Usage

1. AWS Console → **Billing Dashboard**
2. **"Free Tier"** tab
3. Monitor:
   - EC2 instance hours
   - Data transfer
   - Storage usage

**Set up billing alerts:**
1. Billing → **"Budgets"**
2. Create budget: $1/month
3. Get email if charges occur

---

## ✅ Success Checklist

- [x] AWS account created
- [x] EC2 t2.micro instance launched (free tier)
- [x] Elastic IP allocated and associated
- [x] PuTTY connection working
- [x] Node.js, PM2 installed
- [x] Bot files uploaded
- [x] Bot started with PM2
- [x] QR code scanned
- [x] Bot responding to messages
- [x] Keep-alive URL working
- [x] PM2 startup configured

---

## 🎉 You're Done!

Your bot is now running **24/7 on AWS Free Tier** for **12 months** at **zero cost**!

**Monthly Cost:**
- Months 1-12: **$0** ✅
- After month 12: **~$8-10/month**

**Recommended:** Before month 12, migrate to Oracle Cloud Free Tier (free forever).

---

## 📚 Quick Links

- **AWS Console:** https://console.aws.amazon.com/
- **EC2 Dashboard:** https://console.aws.amazon.com/ec2/
- **Billing:** https://console.aws.amazon.com/billing/
- **PuTTY:** https://www.putty.org/
- **WinSCP:** https://winscp.net/

---

> **Your bot is live 24/7 for FREE (12 months)!** 🎉
