#!/bin/bash

# ========================================
# HSM Tech Bot - Koyeb Deployment Helper
# ========================================

echo "🚀 HSM Tech Bot - Deployment Helper"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Check critical environment variables
echo "🔍 Checking required environment variables..."
echo ""

check_env_var() {
    local var_name=$1
    local display_name=$2
    
    if grep -q "^${var_name}=" .env && [ -n "$(grep "^${var_name}=" .env | cut -d'=' -f2)" ]; then
        echo -e "${GREEN}✅ ${display_name}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${display_name} - NOT SET${NC}"
        return 1
    fi
}

errors=0

# Check critical variables
check_env_var "BOT_NAME" "Bot Name" || ((errors++))
check_env_var "BOT_PREFIX" "Bot Prefix" || ((errors++))
check_env_var "BOT_OWNER" "Bot Owner" || ((errors++))
check_env_var "ADMIN_NUMBERS" "Admin Numbers" || ((errors++))
check_env_var "GEMINI_API_KEY" "Gemini API Key" || ((errors++))

echo ""

if [ $errors -gt 0 ]; then
    echo -e "${RED}⚠️ Found $errors missing required variables${NC}"
    echo "Please update your .env file before deploying"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ All required variables are set!${NC}"
fi

echo ""
echo "======================================"
echo "📋 Pre-Deployment Checklist"
echo "======================================"
echo ""

# Git check
if [ -d .git ]; then
    echo -e "${GREEN}✅ Git repository initialized${NC}"
    
    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
        git status -s
        echo ""
        read -p "Commit and push changes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "Commit message: " commit_msg
            git commit -m "$commit_msg"
            
            # Check if remote exists
            if git remote | grep -q origin; then
                git push
                echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"
            else
                echo -e "${RED}❌ No remote repository found${NC}"
                echo "Please set up your GitHub repository first"
                echo "Run: git remote add origin https://github.com/YOUR_USERNAME/hsm-tech-bot.git"
            fi
        fi
    else
        echo -e "${GREEN}✅ No uncommitted changes${NC}"
        
        # Offer to push
        read -p "Push to GitHub? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if git remote | grep -q origin; then
                git push
                echo -e "${GREEN}✅ Pushed to GitHub${NC}"
            else
                echo -e "${RED}❌ No remote repository found${NC}"
                echo "Please set up your GitHub repository first"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Git not initialized${NC}"
    echo ""
    read -p "Initialize git and push to GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔧 Initializing git repository..."
        git init
        git add .
        git commit -m "Initial commit - Prepare for Koyeb deployment"
        
        echo ""
        echo "📝 Please create a GitHub repository and then run:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/hsm-tech-bot.git"
        echo "   git branch -M main"
        echo "   git push -u origin main"
    fi
fi

echo ""
echo "======================================"
echo "🌐 Koyeb Deployment Steps"
echo "======================================"
echo ""
echo "1. Go to https://app.koyeb.com/"
echo "2. Click 'Create Service'"
echo "3. Select 'GitHub' as deployment source"
echo "4. Select your repository"
echo "5. Builder: Docker (auto-detected)"
echo "6. Instance: Choose Eco (free) or Starter (\$7/month, recommended)"
echo "7. Add environment variables from your .env file"
echo "8. Click 'Deploy'"
echo ""
echo "======================================"
echo "📱 After Deployment"
echo "======================================"
echo ""
echo "1. Go to Koyeb Dashboard → Your Service → Logs"
echo "2. Look for QR code in logs"
echo "3. Scan QR code with WhatsApp"
echo "4. Test with: !ping, !help, !stats"
echo ""
echo -e "${BLUE}📖 For detailed instructions, read DEPLOY.md${NC}"
echo ""
echo -e "${GREEN}🎯 Good luck with your deployment!${NC}"
