#!/bin/bash
#
# AWS Instance Setup Script
# Run this script on a fresh Ubuntu AWS instance (EC2/Lightsail)
# This will install Node.js, PM2, and configure the server
#

set -e  # Exit on error

echo "========================================="
echo "HSM Tech Bot - AWS Server Setup"
echo "========================================="
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js (v18.x LTS)
echo "📦 Installing Node.js v18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
sudo npm install -g pm2

# Install Git (for future updates)
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install unzip (for extracting uploaded files)
echo "📦 Installing unzip..."
sudo apt-get install -y unzip

# Create app directory
echo "📁 Creating application directory..."
mkdir -p ~/hsm-tech-bot
cd ~/hsm-tech-bot

# Create necessary directories
mkdir -p auth data logs temp_downloads VU_Files

# Set correct permissions
chmod 755 ~/hsm-tech-bot
chmod 755 ~/hsm-tech-bot/auth
chmod 755 ~/hsm-tech-bot/data

# Configure firewall (UFW)
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Bot keep-alive server
sudo ufw --force enable

echo "✅ Firewall configured (SSH: 22, HTTP: 3000)"

# Configure PM2 startup
echo "⚙️  Configuring PM2 auto-startup..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep 'sudo' | bash

# Install logrotate for log management
echo "📊 Configuring log rotation..."
sudo tee /etc/logrotate.d/hsm-tech-bot > /dev/null <<EOF
/home/ubuntu/hsm-tech-bot/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
EOF

# System resource limits (optional but recommended)
echo "⚙️  Configuring system limits..."
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
# HSM Tech Bot resource limits
ubuntu soft nofile 65536
ubuntu hard nofile 65536
EOF

# Timezone configuration
echo "🌍 Setting timezone to Asia/Karachi..."
sudo timedatectl set-timezone Asia/Karachi

echo ""
echo "========================================="
echo "✅ Server setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Upload your bot files to ~/hsm-tech-bot/"
echo "2. Create .env file with your configuration"
echo "3. Run: npm install"
echo "4. Run: pm2 start ecosystem.config.js"
echo "5. Run: pm2 save"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check bot status"
echo "  pm2 logs bot        - View logs"
echo "  pm2 restart bot     - Restart bot"
echo "  pm2 stop bot        - Stop bot"
echo ""
