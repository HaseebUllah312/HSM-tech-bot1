# 📖 HSM TECH BOT v3.0 - Setup Guide

Complete step-by-step instructions to get your WhatsApp bot running.

## Prerequisites Verification

### 1. Check Node.js Version

```bash
node --version
```

**Required**: v18.0.0 or higher

If you need to install/update Node.js:
- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS (Long Term Support) version
- Install and restart your terminal

### 2. Verify npm

```bash
npm --version
```

npm comes with Node.js installation.

### 3. WhatsApp Account

You need a WhatsApp account (phone number) to link to the bot.  
**Recommendation**: Use a separate phone number, not your primary WhatsApp.

## Installation Steps

### Step 1: Project Setup

```bash
# Navigate to project directory
cd C:\Users\SULTAN COMPUTER\.gemini\antigravity\scratch\hsm-tech-bot

# Verify you're in the correct directory
dir
# You should see: package.json, bot.js, src/, etc.
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `@whiskeysockets/baileys` - WhatsApp client
- `nodemailer` - Email service
- `pino` - Logger
- `qrcode-terminal` - QR code display
- `joi` - Configuration validation
- `node-schedule` - Task scheduling
- `dotenv` - Environment variables

**Expected output**: Dependencies installed successfully (may take 1-2 minutes)

### Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit the .env file
notepad .env
```

**Required Configuration**:

```env
# Bot Basic Settings
BOT_NAME=HSM Tech Bot          # Your bot's name
BOT_PREFIX=!                    # Command prefix
BOT_OWNER=Your Name             # Your name

# Admin Numbers (YOUR phone number with country code, no spaces or +)
ADMIN_NUMBERS=923001234567      # Example: Pakistan number

# Email Settings (Optional but recommended)
EMAIL_ENABLED=true
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your16charapppassword
EMAIL_RECIPIENT=youremail@gmail.com

# Feature Toggles (Leave as default for first run)
FEATURE_BOT_ENABLED=true
FEATURE_AUTO_REPLY=true
FEATURE_FILE_SHARING=true
```

**Important Notes**:
- `ADMIN_NUMBERS`: Use your WhatsApp number with country code (e.g., 923001234567 for Pakistan)
- `EMAIL_PASSWORD`: Use Gmail App Password, NOT your regular password (see Email Setup below)

### Step 4: Gmail App Password Setup (Optional)

If you want email notifications:

1. Go to [Google Account](https://myaccount.google.com/)
2. Click "Security" → "2-Step Verification"
3. Enable 2-Factor Authentication if not already enabled
4. Go to "App passwords"
5. Select "Mail" and "Windows Computer"
6. Click "Generate"
7. Copy the 16-character password (example: `abcd efgh ijkl mnop`)
8. Paste it in `.env` as `EMAIL_PASSWORD` (remove spaces: `abcdefghijklmnop`)

### Step 5: Run Tests

```bash
npm test
```

**Expected Output**:
```
🧪 HSM TECH BOT v3.0 TEST SUITE

==============================
📋 Configuration Module Tests
==============================
  ✅ Config module loads successfully
  ✅ BOT_NAME is defined
  ... (57+ tests)

📊 TEST RESULTS SUMMARY
Total Tests:  57+
✅ Passed:    57 (100%)
❌ Failed:    0

🎉 ALL TESTS PASSED! Bot is production-ready!
```

If tests fail:
- Check your `.env` file configuration
- Ensure all dependencies installed correctly
- Review error messages

### Step 6: First Run - QR Code Authentication

```bash
npm start
```

**Expected Output**:

```
╔══════════════════════════════════════════╗
║    🤖  HSM TECH BOT v3.0  🤖           ║
║    Professional WhatsApp Automation      ║
╚══════════════════════════════════════════╝

[2026-01-30T22:00:00.000Z] [INFO] Starting HSM TECH BOT v3.0...
[2026-01-30T22:00:00.000Z] [INFO] Loading authentication state...
[2026-01-30T22:00:01.000Z] [INFO] QR Code received! Scan with your WhatsApp:

█████████████████████████████
█████████████████████████████
███ ▄▄▄▄▄ █▀█ █▄▄▀▄ ▄▄▄▄▄ ███
███ █   █ █▀▀▀█ ▀█▀ █   █ ███
...

[2026-01-30T22:00:01.000Z] [INFO] Open WhatsApp → Settings → Linked Devices → Link a Device
[2026-01-30T22:00:01.000Z] [INFO] Then scan the QR code above
```

### Step 7: Scan QR Code

On your phone:
1. Open WhatsApp
2. Tap **⋮** (three dots) or Settings
3. Tap **Linked Devices**
4. Tap **Link a Device**
5. Scan the QR code from your computer screen
6. Wait for connection...

**Expected Output** (after scanning):

```
[2026-01-30T22:00:05.000Z] [INFO] ✅ WhatsApp connection established successfully!
[2026-01-30T22:00:05.000Z] [INFO] Bot Name: HSM Tech Bot
[2026-01-30T22:00:05.000Z] [INFO] Command Prefix: !
[2026-01-30T22:00:05.000Z] [INFO] Admin Numbers: 923001234567
[2026-01-30T22:00:05.000Z] [INFO] Bot is ready to receive messages!
```

## First Test

### Test 1: Send a Greeting

From another WhatsApp account, send a message to your bot's number:
```
Hello
```

**Expected Response**:
```
👋 Hello! I'm HSM Tech Bot.

Type !help to see what I can do!
```

### Test 2: Help Command

Send:
```
!help
```

**Expected Response**: List of all available commands

### Test 3: Status Command

Send:
```
!status
```

**Expected Response**: Bot uptime, message count, feature status

## Common Issues & Solutions

### Issue: QR Code Doesn't Appear

**Solution 1**: Wait 30 seconds, sometimes it takes time

**Solution 2**: Check internet connection
```bash
ping google.com
```

**Solution 3**: WhatsApp temporary block (wait 2 hours)

**Solution 4**: Delete auth folder and restart
```bash
rm -rf auth
npm start
```

### Issue: "Configuration validation error"

**Problem**: `.env` file has invalid values

**Solution**: 
1. Check `.env` file
2. Compare with `.env.example`
3. Ensure no extra spaces
4. Verify email format is correct

### Issue: Bot doesn't respond to commands

**Check 1**: Is `FEATURE_BOT_ENABLED=true`?

**Check 2**: Are you using correct prefix? (default is `!`)

**Check 3**: Check logs:
```bash
type logs\app.log
```

**Check 4**: Restart bot:
```bash
# Press Ctrl+C to stop
npm start
```

### Issue: Email not working

**Problem**: Gmail App Password not configured

**Solution**:
1. Verify `EMAIL_ENABLED=true`
2. Check App Password is 16 characters, no spaces
3. Verify 2FA is enabled on Google account
4. Check spam folder

### Issue: "Module not found"

**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

## Next Steps After Setup

### 1. Add Files to Share

```bash
# Add files to VU_Files directory
copy your-file.pdf VU_Files\
```

Test with `!files` command

### 2. Customize Bot Responses

Edit `src/messageHandler.js` to customize responses

### 3. Configure Admin Commands

Update `ADMIN_NUMBERS` in `.env` with your phone numbers

### 4. Enable Email Reports

Set up Gmail App Password and enable reports

### 5. Monitor Logs

```bash
# View live logs
npm run logs

# Or view log file
type logs\app.log
```

## Production Deployment

### Option 1: Keep Computer Running

- Bot runs as long as terminal is open
- Close terminal = bot stops
- Keep computer on 24/7

### Option 2: Use PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start bot.js --name hsm-bot

# View status
pm2 status

# View logs
pm2 logs hsm-bot

# Stop bot
pm2 stop hsm-bot

# Restart bot
pm2 restart hsm-bot

# Auto-start on system reboot
pm2 startup
pm2 save
```

### Option 3: Deploy to VPS/Cloud

- Recommended: DigitalOcean, AWS, Google Cloud, Azure
- Install Node.js on server
- Upload bot files
- Use PM2 for process management
- Configure firewall and security

## Maintenance

### Update Dependencies

```bash
npm update
```

### Clear Old Logs

```bash
del logs\*.log
```

### Backup Session

```bash
# Backup auth folder (important!)
xcopy auth auth_backup\ /E /I
```

### Reset Bot

```bash
# Stop bot (Ctrl+C)
# Delete auth folder
rm -rf auth
# Restart
npm start
# Scan QR code again
```

## Security Recommendations

1. **Use separate WhatsApp account** - Don't use your primary number
2. **Keep `.env` secure** - Never share or commit to git
3. **Regular backups** - Backup `auth` folder regularly
4. **Monitor logs** - Check `logs/app.log` for suspicious activity
5. **Update dependencies** - Run `npm update` monthly
6. **Strong passwords** - Use strong Gmail App Password
7. **Admin only** - Only add trusted numbers to `ADMIN_NUMBERS`

## Support

Need help?
- Check `README.md` for detailed documentation
- Review `ARCHITECTURE.md` for technical details
- Check `SECURITY.md` for security information
- Contact: support@hsmtech.com

---

**Congratulations!** 🎉 Your WhatsApp bot is now running!
