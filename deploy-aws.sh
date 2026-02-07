#!/bin/bash
#
# AWS Deployment Script for HSM Tech Bot
# Supports both AWS Lightsail and EC2 deployments
#
# Usage:
#   ./deploy-aws.sh lightsail
#   ./deploy-aws.sh ec2
#

set -e  # Exit on error

DEPLOYMENT_TYPE="${1:-lightsail}"
BOT_NAME="hsm-tech-bot"
INSTANCE_NAME="hsm-tech-bot-instance"
KEY_PAIR_NAME="hsm-tech-bot-key"

echo "========================================="
echo "AWS Deployment for HSM Tech Bot"
echo "Deployment Type: $DEPLOYMENT_TYPE"
echo "========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found!"
    echo ""
    echo "Please install AWS CLI:"
    echo "  Windows: https://awscli.amazonaws.com/AWSCLIV2.msi"
    echo "  Linux:   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    echo "  macOS:   brew install awscli"
    echo ""
    echo "After installation, configure with: aws configure"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured!"
    echo ""
    echo "Please configure AWS CLI with your credentials:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1)"
    exit 1
fi

echo "✅ AWS CLI configured"
AWS_REGION=$(aws configure get region)
echo "✅ Using region: $AWS_REGION"
echo ""

# Deploy based on type
if [ "$DEPLOYMENT_TYPE" = "lightsail" ]; then
    deploy_lightsail
elif [ "$DEPLOYMENT_TYPE" = "ec2" ]; then
    deploy_ec2
else
    echo "❌ Invalid deployment type: $DEPLOYMENT_TYPE"
    echo "Usage: $0 [lightsail|ec2]"
    exit 1
fi

function deploy_lightsail() {
    echo "🚀 Deploying to AWS Lightsail..."
    echo ""
    
    # Check if instance already exists
    if aws lightsail get-instance --instance-name "$INSTANCE_NAME" &> /dev/null; then
        echo "⚠️  Instance '$INSTANCE_NAME' already exists!"
        read -p "Do you want to delete and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🗑️  Deleting existing instance..."
            aws lightsail delete-instance --instance-name "$INSTANCE_NAME"
            echo "⏳ Waiting for deletion (30 seconds)..."
            sleep 30
        else
            echo "Deployment cancelled."
            exit 0
        fi
    fi
    
    # Create SSH key pair if it doesn't exist
    echo "🔐 Creating SSH key pair..."
    if [ ! -f "${KEY_PAIR_NAME}.pem" ]; then
        aws lightsail create-key-pair \
            --key-pair-name "$KEY_PAIR_NAME" \
            --query 'privateKeyBase64' \
            --output text > "${KEY_PAIR_NAME}.pem"
        chmod 400 "${KEY_PAIR_NAME}.pem"
        echo "✅ SSH key saved to: ${KEY_PAIR_NAME}.pem"
    else
        echo "✅ Using existing SSH key: ${KEY_PAIR_NAME}.pem"
    fi
    
    # Create Lightsail instance
    echo "🏗️  Creating Lightsail instance..."
    aws lightsail create-instances \
        --instance-names "$INSTANCE_NAME" \
        --availability-zone "${AWS_REGION}a" \
        --blueprint-id "ubuntu_20_04" \
        --bundle-id "nano_2_0" \
        --key-pair-name "$KEY_PAIR_NAME"
    
    echo "⏳ Waiting for instance to be running (60 seconds)..."
    sleep 60
    
    # Get instance IP
    INSTANCE_IP=$(aws lightsail get-instance \
        --instance-name "$INSTANCE_NAME" \
        --query 'instance.publicIpAddress' \
        --output text)
    
    echo "✅ Instance created!"
    echo "   Public IP: $INSTANCE_IP"
    echo ""
    
    # Open firewall ports
    echo "🔥 Opening firewall ports..."
    aws lightsail open-instance-public-ports \
        --instance-name "$INSTANCE_NAME" \
        --port-info fromPort=3000,toPort=3000,protocol=TCP
    
    echo "✅ Port 3000 opened for keep-alive server"
    echo ""
    
    # Wait for SSH to be available
    echo "⏳ Waiting for SSH to be ready (30 seconds)..."
    sleep 30
    
    # Upload and run setup script
    echo "📤 Uploading files to instance..."
    upload_and_setup "$INSTANCE_IP"
    
    print_success_message "$INSTANCE_IP"
}

function deploy_ec2() {
    echo "🚀 Deploying to AWS EC2..."
    echo ""
    echo "⚠️  EC2 deployment via script coming soon!"
    echo ""
    echo "For now, please:"
    echo "1. Create an EC2 instance (t3.micro, Ubuntu 20.04)"
    echo "2. Download the SSH key pair"
    echo "3. SSH into the instance"
    echo "4. Run the aws-setup.sh script"
    echo "5. Upload your bot files"
    echo ""
    echo "See DEPLOY-AWS.md for detailed instructions."
}

function upload_and_setup() {
    local IP=$1
    local SSH_KEY="${KEY_PAIR_NAME}.pem"
    local SSH_USER="ubuntu"
    local SSH_OPTIONS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
    
    # Create deployment package (exclude node_modules, auth, logs)
    echo "📦 Creating deployment package..."
    if [ -f "${BOT_NAME}.zip" ]; then
        rm "${BOT_NAME}.zip"
    fi
    
    # Use PowerShell on Windows, zip on Unix
    if command -v powershell &> /dev/null; then
        powershell -Command "Compress-Archive -Path *.js,src,package*.json,.env,data,VU_Files,ecosystem.config.js -DestinationPath ${BOT_NAME}.zip -Force"
    else
        zip -r "${BOT_NAME}.zip" *.js src package*.json .env data VU_Files ecosystem.config.js -x "node_modules/*" "auth/*" "logs/*" "temp_downloads/*"
    fi
    
    echo "✅ Deployment package created"
    
    # Upload setup script
    echo "📤 Uploading setup script..."
    scp $SSH_OPTIONS aws-setup.sh ${SSH_USER}@${IP}:~/
    
    # Run setup script
    echo "🔧 Running server setup..."
    ssh $SSH_OPTIONS ${SSH_USER}@${IP} 'bash ~/aws-setup.sh'
    
    # Upload bot files
    echo "📤 Uploading bot files..."
    scp $SSH_OPTIONS ${BOT_NAME}.zip ${SSH_USER}@${IP}:~/hsm-tech-bot/
    
    # Extract and install
    echo "📦 Installing bot..."
    ssh $SSH_OPTIONS ${SSH_USER}@${IP} << 'ENDSSH'
        cd ~/hsm-tech-bot
        unzip -o hsm-tech-bot.zip
        npm install --production
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ Bot started with PM2!"
ENDSSH
    
    echo ""
    echo "✅ Deployment complete!"
}

function print_success_message() {
    local IP=$1
    
    echo ""
    echo "========================================="
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    echo ""
    echo "Your bot is now running on AWS!"
    echo ""
    echo "Instance IP: $IP"
    echo "SSH Command: ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${IP}"
    echo ""
    echo "Next steps:"
    echo "1. SSH into your instance:"
    echo "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${IP}"
    echo ""
    echo "2. View bot logs to get QR code:"
    echo "   pm2 logs hsm-tech-bot"
    echo ""
    echo "3. Scan the QR code with WhatsApp"
    echo ""
    echo "4. Test the bot by sending: !ping"
    echo ""
    echo "Useful PM2 commands:"
    echo "  pm2 status           - Check bot status"
    echo "  pm2 logs bot         - View live logs"
    echo "  pm2 restart bot      - Restart bot"
    echo "  pm2 stop bot         - Stop bot"
    echo ""
    echo "Keep-Alive URL: http://${IP}:3000"
    echo ""
    echo "⚠️  IMPORTANT: Save your SSH key (${KEY_PAIR_NAME}.pem) in a safe place!"
    echo ""
}

# Run deployment
if [ "$DEPLOYMENT_TYPE" = "lightsail" ]; then
    deploy_lightsail
elif [ "$DEPLOYMENT_TYPE" = "ec2" ]; then
    deploy_ec2
fi
