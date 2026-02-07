# PowerShell script for AWS deployment on Windows
# HSM Tech Bot - AWS Lightsail Deployment
#
# Usage: .\deploy-aws.ps1 -DeploymentType lightsail

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('lightsail', 'ec2')]
    [string]$DeploymentType = 'lightsail'
)

$BOT_NAME = "hsm-tech-bot"
$INSTANCE_NAME = "hsm-tech-bot-instance"
$KEY_PAIR_NAME = "hsm-tech-bot-key"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AWS Deployment for HSM Tech Bot" -ForegroundColor Cyan
Write-Host "Deployment Type: $DeploymentType" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install AWS CLI:" -ForegroundColor Yellow
    Write-Host "  Download: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, configure with: aws configure" -ForegroundColor Yellow
    exit 1
}

# Check if AWS credentials are configured
try {
    $null = aws sts get-caller-identity 2>$null
} catch {
    Write-Host "❌ AWS credentials not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please configure AWS CLI with your credentials:" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You'll need:" -ForegroundColor Yellow
    Write-Host "  - AWS Access Key ID" -ForegroundColor Yellow
    Write-Host "  - AWS Secret Access Key" -ForegroundColor Yellow
    Write-Host "  - Default region (e.g., us-east-1)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AWS CLI configured" -ForegroundColor Green
$AWS_REGION = aws configure get region
Write-Host "✅ Using region: $AWS_REGION" -ForegroundColor Green
Write-Host ""

# Deploy based on type
if ($DeploymentType -eq 'lightsail') {
    Deploy-Lightsail
} elseif ($DeploymentType -eq 'ec2') {
    Deploy-EC2
}

function Deploy-Lightsail {
    Write-Host "🚀 Deploying to AWS Lightsail..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if instance already exists
    try {
        $existingInstance = aws lightsail get-instance --instance-name $INSTANCE_NAME 2>$null
        if ($existingInstance) {
            Write-Host "⚠️  Instance '$INSTANCE_NAME' already exists!" -ForegroundColor Yellow
            $response = Read-Host "Do you want to delete and recreate? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Host "🗑️  Deleting existing instance..." -ForegroundColor Yellow
                aws lightsail delete-instance --instance-name $INSTANCE_NAME
                Write-Host "⏳ Waiting for deletion (30 seconds)..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
            } else {
                Write-Host "Deployment cancelled." -ForegroundColor Yellow
                exit 0
            }
        }
    } catch {
        # Instance doesn't exist, continue
    }
    
    # Create SSH key pair if it doesn't exist
    Write-Host "🔐 Creating SSH key pair..." -ForegroundColor Cyan
    if (-not (Test-Path "${KEY_PAIR_NAME}.pem")) {
        $privateKey = aws lightsail create-key-pair --key-pair-name $KEY_PAIR_NAME --query 'privateKeyBase64' --output text
        $privateKey | Out-File -FilePath "${KEY_PAIR_NAME}.pem" -Encoding ASCII
        Write-Host "✅ SSH key saved to: ${KEY_PAIR_NAME}.pem" -ForegroundColor Green
    } else {
        Write-Host "✅ Using existing SSH key: ${KEY_PAIR_NAME}.pem" -ForegroundColor Green
    }
    
    # Create Lightsail instance
    Write-Host "🏗️  Creating Lightsail instance..." -ForegroundColor Cyan
    aws lightsail create-instances `
        --instance-names $INSTANCE_NAME `
        --availability-zone "${AWS_REGION}a" `
        --blueprint-id "ubuntu_20_04" `
        --bundle-id "nano_2_0" `
        --key-pair-name $KEY_PAIR_NAME
    
    Write-Host "⏳ Waiting for instance to be running (60 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    # Get instance IP
    $INSTANCE_IP = aws lightsail get-instance --instance-name $INSTANCE_NAME --query 'instance.publicIpAddress' --output text
    
    Write-Host "✅ Instance created!" -ForegroundColor Green
    Write-Host "   Public IP: $INSTANCE_IP" -ForegroundColor Green
    Write-Host ""
    
    # Open firewall ports
    Write-Host "🔥 Opening firewall ports..." -ForegroundColor Cyan
    aws lightsail open-instance-public-ports `
        --instance-name $INSTANCE_NAME `
        --port-info fromPort=3000,toPort=3000,protocol=TCP
    
    Write-Host "✅ Port 3000 opened for keep-alive server" -ForegroundColor Green
    Write-Host ""
    
    # Package bot files
    Write-Host "📦 Creating deployment package..." -ForegroundColor Cyan
    if (Test-Path "${BOT_NAME}.zip") {
        Remove-Item "${BOT_NAME}.zip"
    }
    
    Compress-Archive -Path *.js,src,package*.json,.env,data,VU_Files,ecosystem.config.js -DestinationPath "${BOT_NAME}.zip" -Force
    Write-Host "✅ Deployment package created" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "✅ AWS INSTANCE CREATED!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instance IP: $INSTANCE_IP" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  NEXT STEPS (Manual):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Use an SSH client (PuTTY, WSL, or Git Bash):" -ForegroundColor White
    Write-Host "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${INSTANCE_IP}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. On the instance, download setup script:" -ForegroundColor White
    Write-Host "   wget https://raw.githubusercontent.com/YOUR_REPO/main/aws-setup.sh" -ForegroundColor Gray
    Write-Host "   bash aws-setup.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Upload your bot files using SCP or SFTP" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Install and start bot:" -ForegroundColor White
    Write-Host "   cd ~/hsm-tech-bot" -ForegroundColor Gray
    Write-Host "   unzip hsm-tech-bot.zip" -ForegroundColor Gray
    Write-Host "   npm install" -ForegroundColor Gray
    Write-Host "   pm2 start ecosystem.config.js" -ForegroundColor Gray
    Write-Host "   pm2 save" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. View logs to get QR code:" -ForegroundColor White
    Write-Host "   pm2 logs hsm-tech-bot" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Keep-Alive URL: http://${INSTANCE_IP}:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Save ${KEY_PAIR_NAME}.pem in a safe place!" -ForegroundColor Red
    Write-Host ""
}

function Deploy-EC2 {
    Write-Host "🚀 EC2 deployment coming soon!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For now, please create EC2 instance manually:" -ForegroundColor White
    Write-Host "1. Go to AWS Console → EC2" -ForegroundColor Gray
    Write-Host "2. Launch Instance (Ubuntu 20.04, t3.micro)" -ForegroundColor Gray
    Write-Host "3. Download key pair" -ForegroundColor Gray
    Write-Host "4. SSH and run aws-setup.sh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "See DEPLOY-AWS.md for detailed instructions." -ForegroundColor Yellow
}
