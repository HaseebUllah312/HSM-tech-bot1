# 🚀 Deploy HSM Tech Bot to AWS (Amazon Web Services)

Complete guide for deploying your WhatsApp bot to Amazon Web Services for professional, reliable 24/7 hosting.

---

## 📋 Overview

This guide covers deploying the HSM Tech Bot to AWS using **AWS Lightsail** (recommended for simplicity) or **AWS EC2** (for more control).

### Why AWS?

✅ **Professional Infrastructure** - Enterprise-grade reliability  
✅ **99.99% Uptime SLA** - Industry-leading availability  
✅ **Global Data Centers** - Deploy close to your users  
✅ **Scalable** - Grow as your needs increase  
✅ **12-Month Free Tier** - Free EC2 for first year  

### Cost Comparison

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| **AWS Lightsail** | $3.50-5 | Simplicity, predictable pricing |
| **AWS EC2 (t3.micro)** | FREE (12 mo), then $7-10 | Free tier, more control |
| **AWS ECS/Fargate** | $5-15 | Containers, auto-scaling |

**Recommendation**: AWS Lightsail for easiest deployment at low cost.

---

## 🎯 Quick Start (Automated Deployment)

### Prerequisites

1. **AWS Account** (free to create)
   - Visit: https://aws.amazon.com/
   - Click "Create an AWS Account"
   - Provide email, password, payment method (won't be charged if staying in free tier)

2. **AWS CLI** (command-line tool)
   - **Windows**: Download from https://awscli.amazonaws.com/AWSCLIV2.msi
   - **Linux**: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`
   - **macOS**: `brew install awscli`

3. **Configure AWS CLI**
   ```bash
   aws configure
   ```
   You'll need:
   - **AWS Access Key ID**: Get from AWS Console → Security Credentials
   - **AWS Secret Access Key**: Provided when you create access key
   - **Default region**: e.g., `us-east-1` (cheapest)

### Automated Deployment (Lightsail)

```bash
# Make script executable (Linux/macOS)
chmod +x deploy-aws.sh

# Run deployment
./deploy-aws.sh lightsail
```

**On Windows** (use Git Bash or WSL):
```bash
bash deploy-aws.sh lightsail
```

The script will:
1. ✅ Create SSH key pair
2. ✅ Launch Lightsail instance ($3.50/month)
3. ✅ Configure firewall
4. ✅ Install Node.js and PM2
5. ✅ Upload and start your bot
6. ✅ Display connection details

**Total time**: ~5 minutes

---

## 📖 Manual Deployment (Step-by-Step)

If you prefer manual setup or the automated script doesn't work:

### Step 1: Create AWS Lightsail Instance

1. **Login to AWS Console**
   - Visit: https://lightsail.aws.amazon.com/

2. **Create Instance**
   - Click **"Create instance"**
   - **Select region**: Choose closest to you (e.g., US East for North America)
   - **Platform**: Linux/Unix
   - **Blueprint**: OS Only → **Ubuntu 20.04 LTS**
   - **Instance plan**: **$3.50/month** (512 MB RAM, 1 vCPU, 20 GB SSD)
   - **Instance name**: `hsm-tech-bot`
   - Click **"Create instance"**

3. **Wait for Instance** (~2 minutes)
   - Status should show **"Running"** with a green checkmark

### Step 2: Connect to Your Instance

#### Option A: Browser SSH (Easiest)

1. In Lightsail dashboard, click on your instance
2. Click **"Connect using SSH"** (orange button)
3. A terminal will open in your browser

#### Option B: SSH Client (Recommended)

1. **Download SSH Key**
   - In instance details, go to **"SSH keys"** tab
   - Click **"Download"** to get `.pem` file
   - Save as `hsm-tech-bot-key.pem`

2. **Set Permissions** (Linux/macOS)
   ```bash
   chmod 400 hsm-tech-bot-key.pem
   ```

3. **Connect via SSH**
   ```bash
   ssh -i hsm-tech-bot-key.pem ubuntu@YOUR_INSTANCE_IP
   ```
   Replace `YOUR_INSTANCE_IP` with the Public IP shown in Lightsail dashboard

### Step 3: Setup Server

Once connected to your instance:

```bash
# Upload and run setup script
# First, copy aws-setup.sh to your instance using SCP or paste its contents

# Run setup
bash aws-setup.sh
```

Or **manual setup** without script:

```bash
# Update system
sudo apt-get update -y && sudo apt-get upgrade -y

# Install Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
mkdir -p ~/hsm-tech-bot
cd ~/hsm-tech-bot

# Create subdirectories
mkdir -p auth data logs temp_downloads VU_Files
```

### Step 4: Upload Your Bot Files

#### Option A: SCP (Secure Copy)

From your local machine:

```bash
# Create deployment package (exclude node_modules, auth, logs)
# On Windows PowerShell:
Compress-Archive -Path *.js,src,package*.json,.env,data,VU_Files,ecosystem.config.js -DestinationPath hsm-tech-bot.zip -Force

# On Linux/macOS:
zip -r hsm-tech-bot.zip *.js src package*.json .env data VU_Files ecosystem.config.js -x "node_modules/*" "auth/*" "logs/*"

# Upload to instance
scp -i hsm-tech-bot-key.pem hsm-tech-bot.zip ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/
```

#### Option B: SFTP Client (FileZilla)

1. Open FileZilla
2. **File → Site Manager → New Site**
3. **Protocol**: SFTP
4. **Host**: Your instance Public IP
5. **Logon Type**: Key file
6. **User**: ubuntu
7. **Key file**: Select your `.pem` file
8. Connect and drag files to `/home/ubuntu/hsm-tech-bot/`

#### Option C: Manual File Transfer (Small edits)

```bash
# On your instance, create .env file
nano ~/hsm-tech-bot/.env

# Paste your .env contents, then Ctrl+X, Y, Enter to save
```

### Step 5: Install and Start Bot

On your AWS instance:

```bash
cd ~/hsm-tech-bot

# Extract uploaded files (if using zip)
unzip -o hsm-tech-bot.zip

# Install dependencies
npm install --production

# Start bot with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 auto-start on reboot
pm2 startup
# Copy and run the sudo command it outputs
```

### Step 6: Configure Firewall

In Lightsail dashboard:

1. Click on your instance
2. Go to **"Networking"** tab
3. Under **"Firewall"**, click **"Add rule"**
4. **Application**: Custom
5. **Protocol**: TCP
6. **Port**: 3000
7. Click **"Create"**

This allows the keep-alive server to be accessible.

### Step 7: Get QR Code and Link WhatsApp

```bash
# View bot logs
pm2 logs hsm-tech-bot

# Look for the QR code (appears as ASCII art)
```

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code from the terminal

Wait for: `✅ WhatsApp connection established successfully!`

---

## ✅ Verification

### Check Bot Status

```bash
# Check if bot is running
pm2 status

# Should show:
# │ hsm-tech-bot │ 0    │ online │
```

### Check Logs

```bash
# View live logs
pm2 logs hsm-tech-bot

# View last 100 lines
pm2 logs hsm-tech-bot --lines 100
```

### Test WhatsApp Commands

Send these in WhatsApp (group or DM):

```
!ping         → Bot responds with status
!help         → Shows all commands
!stats        → Shows statistics
CS301         → Tests file search
```

### Test Keep-Alive Server

```bash
# From your local machine
curl http://YOUR_INSTANCE_IP:3000

# Should respond: "HSM Tech Bot is Active! 🤖"
```

---

## 🛠️ Managing Your Bot

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs hsm-tech-bot

# Restart bot
pm2 restart hsm-tech-bot

# Stop bot
pm2 stop hsm-tech-bot

# Start bot
pm2 start hsm-tech-bot

# View detailed info
pm2 info hsm-tech-bot

# Monitor resources
pm2 monit
```

### Update Bot Code

**Method 1: Full Update**

```bash
# On your local machine, create new ZIP
zip -r hsm-tech-bot-update.zip *.js src package*.json ecosystem.config.js

# Upload to instance
scp -i hsm-tech-bot-key.pem hsm-tech-bot-update.zip ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/

# On instance
cd ~/hsm-tech-bot
unzip -o hsm-tech-bot-update.zip
npm install  # If package.json changed
pm2 restart hsm-tech-bot
```

**Method 2: Quick File Edit**

```bash
# SSH into instance
ssh -i hsm-tech-bot-key.pem ubuntu@YOUR_INSTANCE_IP

# Edit file
nano ~/hsm-tech-bot/bot.js  # Or any other file

# Restart bot
pm2 restart hsm-tech-bot
```

### Update Environment Variables

```bash
# Edit .env file
nano ~/hsm-tech-bot/.env

# Make changes, save (Ctrl+X, Y, Enter)

# Restart bot to apply
pm2 restart hsm-tech-bot
```

### View Resource Usage

```bash
# CPU and memory usage
pm2 monit

# System resources
htop  # Install with: sudo apt install htop

# Disk usage
df -h
```

---

## 🔥 Firewall & Security

### Recommended Firewall Rules (Lightsail)

| Application | Protocol | Port | Purpose |
|------------|----------|------|---------|
| SSH | TCP | 22 | Remote access |
| Custom | TCP | 3000 | Keep-alive server |

### Security Best Practices

1. **Protect SSH Key**
   ```bash
   # Never commit .pem file to Git
   # Store in secure location
   chmod 400 hsm-tech-bot-key.pem
   ```

2. **Secure .env File**
   ```bash
   # On instance
   chmod 600 ~/hsm-tech-bot/.env
   ```

3. **Regular Updates**
   ```bash
   # Update system packages monthly
   sudo apt-get update && sudo apt-get upgrade -y
   ```

4. **Enable UFW Firewall** (Ubuntu)
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 3000/tcp # Keep-alive
   sudo ufw enable
   ```

---

## 📊 Monitoring & Logs

### View PM2 Logs

```bash
# Live logs
pm2 logs

# Logs for specific app
pm2 logs hsm-tech-bot

# Error logs only
pm2 logs hsm-tech-bot --err

# Last 200 lines
pm2 logs hsm-tech-bot --lines 200
```

### System Logs

```bash
# Check disk space
df -h

# Memory usage
free -h

# Process list
ps aux | grep node
```

### CloudWatch Integration (Optional)

For advanced monitoring, integrate with AWS CloudWatch:

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

See AWS CloudWatch documentation for configuration.

---

## 🔍 Troubleshooting

### Bot Not Starting

**Check logs:**
```bash
pm2 logs hsm-tech-bot --lines 50
```

**Common issues:**
- ❌ Missing `.env` file → Create it with required variables
- ❌ Wrong Node.js version → Should be v18+: `node --version`
- ❌ Missing dependencies → Run `npm install`

### QR Code Not Appearing

**Solution:**
```bash
# Stop bot
pm2 stop hsm-tech-bot

# Delete auth folder
rm -rf ~/hsm-tech-bot/auth

# Start bot
pm2 start hsm-tech-bot

# View logs for new QR code
pm2 logs hsm-tech-bot
```

### "Bad MAC Error" / "MessageCounterError"

✅ **This is normal!** The bot automatically skips old encrypted messages. No action needed.

### Bot Stops After Some Time

**Check PM2 status:**
```bash
pm2 status

# If errored or stopped
pm2 restart hsm-tech-bot

# Check logs for errors
pm2 logs hsm-tech-bot --err --lines 50
```

**Check memory:**
```bash
free -h

# If low memory, consider upgrading instance
```

### Cannot Connect via SSH

1. **Check instance status** in Lightsail dashboard (should be "Running")
2. **Verify SSH key permissions**: `chmod 400 hsm-tech-bot-key.pem`
3. **Check IP address** - may change after instance restart
4. **Firewall** - ensure port 22 is open in Lightsail networking tab

### WhatsApp Session Lost

**Solution:**
```bash
pm2 stop hsm-tech-bot
rm -rf ~/hsm-tech-bot/auth
pm2 start hsm-tech-bot
pm2 logs hsm-tech-bot  # Scan new QR code
```

---

## 💰 Cost Optimization

### Reduce Costs

1. **Use Free Tier EC2** (first 12 months)
   - t3.micro: 750 hours/month FREE
   - After 12 months: ~$7-10/month

2. **AWS Lightsail** (predictable pricing)
   - $3.50/month for 512MB RAM
   - $5.00/month for 1GB RAM
   - Includes 1TB data transfer

3. **Stop Instance When Not Needed**
   ```bash
   # Stop instance (billing paused for EC2, not Lightsail)
   aws lightsail stop-instance --instance-name hsm-tech-bot-instance
   
   # Start instance
   aws lightsail start-instance --instance-name hsm-tech-bot-instance
   ```

4. **Monitor Data Transfer**
   - First 1GB/month: FREE
   - Lightsail includes 1TB/month
   - Avoid downloading large files frequently

### Current Costs Breakdown

**AWS Lightsail (Recommended)**:
- Instance: $3.50-5/month
- Data transfer: Included (1TB)
- **Total**: $3.50-5/month

**AWS EC2 (Free Tier)**:
- Instance: FREE (first 12 months) or $7-10/month
- Data transfer: First 100GB free
- EBS storage: 30GB included
- **Total**: $0/month (first year), then $7-10/month

---

## 🔄 Backup & Disaster Recovery

### Backup Critical Data

```bash
# Create backup
cd ~/hsm-tech-bot
tar -czf backup-$(date +%Y%m%d).tar.gz auth data .env

# Download backup to local machine
scp -i hsm-tech-bot-key.pem ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/backup-*.tar.gz ./
```

### Restore from Backup

```bash
# Upload backup
scp -i hsm-tech-bot-key.pem backup-20260207.tar.gz ubuntu@YOUR_INSTANCE_IP:~/hsm-tech-bot/

# On instance
cd ~/hsm-tech-bot
tar -xzf backup-20260207.tar.gz
pm2 restart hsm-tech-bot
```

### Create Lightsail Snapshot

1. Go to Lightsail dashboard
2. Click on your instance
3. Go to **"Snapshots"** tab
4. Click **"Create snapshot"**
5. Name it (e.g., `hsm-bot-backup-2026-02-07`)

**Cost**: $0.05/GB/month (first snapshot of stopped instance is FREE)

---

## 🚀 Advanced: Docker Deployment (ECS)

For container-based deployment on AWS ECS:

### Prerequisites

- Docker installed locally
- AWS CLI configured
- ECR repository created

### Deploy to ECS

```bash
# Build Docker image
docker build -t hsm-tech-bot .

# Tag for ECR
docker tag hsm-tech-bot:latest YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/hsm-tech-bot:latest

# Push to ECR
docker push YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/hsm-tech-bot:latest

# Create ECS task and service (see AWS ECS documentation)
```

**Cost**: ~$5-15/month for Fargate

---

## 📞 Support Resources

### AWS Documentation

- **Lightsail**: https://lightsail.aws.amazon.com/ls/docs/
- **EC2**: https://docs.aws.amazon.com/ec2/
- **ECS**: https://docs.aws.amazon.com/ecs/

### Useful Links

- **AWS Free Tier**: https://aws.amazon.com/free/
- **Pricing Calculator**: https://calculator.aws/
- **AWS Support**: https://console.aws.amazon.com/support/

### Bot Commands

```
!ping         - Check bot status
!help         - Show all commands
!stats        - View statistics
!open         - Enable file sharing (owner)
!close        - Disable file sharing (owner)
```

---

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] AWS account created
- [ ] AWS CLI installed and configured
- [ ] `.env` file configured with all keys
- [ ] Bot tested locally

### Deployment

- [ ] Instance created (Lightsail or EC2)
- [ ] SSH access verified
- [ ] Server setup completed (Node.js, PM2)
- [ ] Bot files uploaded
- [ ] Dependencies installed (`npm install`)
- [ ] Bot started with PM2
- [ ] PM2 auto-start configured

### Post-Deployment

- [ ] QR code scanned and WhatsApp linked
- [ ] Bot responds to `!ping`
- [ ] File search tested
- [ ] Keep-alive server accessible
- [ ] PM2 monitoring set up
- [ ] Backup created

---

## 🎉 Success!

Your **HSM Tech Bot** is now running 24/7 on AWS!

**What you've achieved:**
- ✅ Professional cloud hosting
- ✅ 99.99% uptime SLA
- ✅ Auto-restart on crashes
- ✅ Persistent WhatsApp session
- ✅ Accessible even when PC is off

**Next steps:**
- Monitor logs regularly: `pm2 logs`
- Create weekly backups
- Update bot code as needed
- Scale up if needed

For questions, check logs first: `pm2 logs hsm-tech-bot --lines 100`

---

**Deployment Time**: 15-30 minutes  
**Monthly Cost**: $3.50-10 depending on chosen AWS service  
**Uptime**: 99.99% with AWS SLA
