# 🚀 Deploy Bot via GitHub to AWS

## ✅ Benefits of Using GitHub

- ✅ **Easier** than WinSCP
- ✅ **Version control** - track all changes
- ✅ **Quick updates** - just `git pull`
- ✅ **Backup** - code is safe on GitHub

---

## ⚠️ CRITICAL: Protect Your Secrets

Your `.env` file contains:
- 🔑 Email passwords
- 🔑 API keys (Gemini, Groq)
- 🔑 Admin numbers

**NEVER push `.env` to GitHub!**

---

## 📋 Step-by-Step Guide

### Step 1: Verify .gitignore (PC)

Your `.gitignore` file already protects sensitive data. Verify it:

```bash
# In your bot folder
cat .gitignore
```

Should include:
```
.env
auth/
node_modules/
*.pem
*.ppk
logs/
```

✅ This is already set up!

---

### Step 2: Create GitHub Repository

1. Go to: https://github.com/
2. Click **"+"** (top right) → **"New repository"**
3. **Repository name:** `hsm-tech-bot` (or `whatsapp-bot-private`)
4. **Visibility:** 
   - ✅ **Private** (recommended - keeps code private)
   - Or Public (if you want to share)
5. **DON'T** check "Initialize with README"
6. Click **"Create repository"**

---

### Step 3: Push Code to GitHub (PC)

**In your bot folder** (`c:\Users\SULTAN COMPUTER\.gemini\antigravity\scratch\hsm-tech-bot\`):

```bash
# Initialize git (if not already done)
git init

# Add all files (except .env - protected by .gitignore)
git add .

# Commit
git commit -m "Initial bot setup for 24/7 deployment"

# Add GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/hsm-tech-bot.git

# Push to GitHub
git push -u origin main
```

**If using `master` instead of `main`:**
```bash
git branch -M main
git push -u origin main
```

---

### Step 4: Clone on AWS Server

**In PuTTY (AWS server):**

```bash
# Navigate to home
cd ~

# Remove empty directory (if exists)
rm -rf hsm-tech-bot

# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/hsm-tech-bot.git

# Navigate to bot folder
cd hsm-tech-bot
```

---

### Step 5: Create .env File on AWS

Since `.env` is NOT on GitHub (protected), create it manually on AWS:

```bash
nano .env
```

**Copy-paste your .env content** (from your PC):
1. Open `.env` on your PC
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. In PuTTY nano editor: Right-click to paste
4. Press **Ctrl+X**, then **Y**, then **Enter** to save

---

### Step 6: Install & Start Bot

```bash
# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# View logs (QR code will appear)
pm2 logs hsm-tech-bot
```

---

### Step 7: Scan QR Code

1. Open WhatsApp on your phone
2. Menu → Linked Devices → Link a Device
3. Scan the QR code from PuTTY
4. Done! ✅

---

## 🔄 Updating Bot Later

**When you make changes on your PC:**

```bash
# Commit changes
git add .
git commit -m "Updated feature X"
git push
```

**On AWS server:**

```bash
cd ~/hsm-tech-bot
git pull
npm install  # If package.json changed
pm2 restart hsm-tech-bot
```

---

## 🔐 Security Checklist

Before pushing to GitHub, verify:

- [x] `.gitignore` includes `.env` ✅
- [x] `.gitignore` includes `auth/` ✅
- [x] `.gitignore` includes `*.pem` ✅
- [x] No credentials in code ✅

**Double-check `.env` is NOT in your repository:**

```bash
git status
```

Should show: `.env` is **NOT** in the list (means it's ignored) ✅

---

## ✅ Advantages of This Method

| Method | Speed | Easy Updates | Version Control |
|--------|-------|--------------|-----------------|
| **GitHub** | ⭐⭐⭐ | ✅ `git pull` | ✅ Full history |
| WinSCP | ⭐ | ❌ Manual upload | ❌ None |

**GitHub is the professional way!** 🎉

---

> **Ready to push to GitHub?** Follow the commands above!
