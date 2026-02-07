# 🚀 Deploy HSM Tech Bot to Bot Hosting Panel (FREE 24/7 Hosting)

This guide will help you deploy your WhatsApp bot to a **Bot Hosting Panel** for **FREE 24/7 uptime**.

---

## 📋 What is Bot Hosting Panel?

Bot hosting panels are **free/affordable hosting platforms** designed for Discord bots, Telegram bots, and Node.js applications. Popular options include:
- **fps.ms** - Free 24/7 bot hosting with 128MB RAM
- **Bot-Hosting.net** - Simple panel for bot deployment
- **Wispbyte** - Free hosting with up to 3GB RAM
- **Cybrancee** - Container-based bot hosting

### ✅ Features You Get:
- ✅ **FREE hosting** with generous resources
- ✅ **24/7 uptime** (no sleep mode)
- ✅ **Web-based control panel** for easy management
- ✅ **File manager** and **SFTP access**
- ✅ **Console/Terminal** for real-time logs
- ✅ **Node.js support** (perfect for WhatsApp bots)

---

## 🔧 Step 1: Prepare Your Bot Files

### 1.1 Create a ZIP Archive

Most bot hosting panels require your bot as a ZIP file. Here's what to include:

```bash
# On Windows (PowerShell)
Compress-Archive -Path * -DestinationPath hsm-tech-bot.zip -Exclude node_modules,auth,logs,temp_downloads

# Or manually:
# 1. Select all files EXCEPT node_modules, auth, logs, temp_downloads
# 2. Right-click → Send to → Compressed (zipped) folder
```

**Important**: Make sure to include:
- ✅ All `.js` files (`bot.js`, `src` folder)
- ✅ `package.json` and `package-lock.json`
- ✅ `.env` file with your settings
- ✅ `data` folder (for settings persistence)
- ❌ **Exclude**: `node_modules`, `auth`, `logs`, `temp_downloads`

> 💡 **Why exclude `node_modules`?** The hosting panel will automatically install dependencies from `package.json`, saving upload time and space.

### 1.2 Verify Your .env File

Make sure your `.env` file has all required variables:

```env
BOT_PREFIX=!
BOT_NAME=HSM Tech Bot
BOT_OWNER=𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑
ADMIN_NUMBERS=923001234567
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=3000
```

---

## 🌐 Step 2: Deploy to Bot Hosting Panel

### 2.1 Create an Account

**Choose a hosting provider** and sign up:
- **fps.ms**: [panel.fps.ms](https://panel.fps.ms/) - *Recommended for beginners*
- **Bot-Hosting.net**: [bot-hosting.net](https://bot-hosting.net/)
- **Wispbyte**: [wispbyte.com](https://wispbyte.com/)

1. Click **"Sign Up"** or **"Register"**
2. Verify your email
3. Log in to the panel

### 2.2 Create a New Server/Container

1. In the panel dashboard, click **"Create Server"** or **"Deploy Container"**
2. **Server Name**: `hsm-tech-bot` (or any name you prefer)
3. **Select Language/Environment**: Choose **"Node.js"** or **"Node"**
4. **Select Plan**: Choose the **"Free"** tier
5. Click **"Create"** or **"Deploy"**

### 2.3 Upload Your Bot Files

#### Option A: File Manager (Recommended for ZIP files)

1. In your server dashboard, go to **"Files"** or **"File Manager"** tab
2. **Upload** your `hsm-tech-bot.zip` file
   - Drag and drop, or click "Upload" button
   - Wait for upload to complete
3. **Extract/Unzip** the file:
   - Right-click the ZIP file → **"Unarchive"** or **"Extract"**
   - Or look for an "Unzip" button in the panel
   - Files should extract to the root directory

#### Option B: SFTP (For advanced users)

1. Go to **"Settings"** or **"SFTP"** tab
2. Note your SFTP credentials:
   - **Host**: `sftp.yourpanel.com` (shown in panel)
   - **Username**: Your panel username
   - **Password**: Your panel password
   - **Port**: Usually `2022` or `22`
3. Use FileZilla or WinSCP to connect
4. Upload all files (except `node_modules`, `auth`, `logs`)

### 2.4 Install Dependencies

1. Go to **"Console"** or **"Terminal"** tab
2. Run the following command:

```bash
npm install
```

3. Wait for installation to complete (usually 1-2 minutes)
4. You should see "added X packages" message

> 💡 **Tip**: Some panels auto-install dependencies when they detect `package.json`. Check the console logs.

### 2.5 Configure Startup

1. Go to **"Startup"** or **"Settings"** tab
2. Set the **Startup Command**:
   ```bash
   node bot.js
   ```
3. Set **Main File**: `bot.js`
4. **Save** the settings

### 2.6 Start Your Bot

1. Go to **"Console"** tab
2. Click the **"Start"** button (usually green)
3. Watch the console for startup messages:

```
✅ WhatsApp connection established successfully!
Keep-Alive Server running on port 3000
Bot is ready to receive messages!
```

---

## 📱 Step 3: Link WhatsApp

### 3.1 Get QR Code from Console

1. In your panel, go to **"Console"** or **"Logs"** tab
2. Look for "**QR Code received!**" message
3. You'll see an **ASCII QR code** displayed in the console (looks like a square pattern of characters)

### 3.2 Scan QR Code

1. Open **WhatsApp** on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. **Scan the QR code** from the console
5. Wait for "✅ Connection established successfully!" message

> ⚠️ **Note**: QR code expires in ~60 seconds. If it doesn't work, restart the bot to generate a new one.

---

## ✅ Step 4: Verify 24/7 Operation

### 4.1 Test Bot Commands

Send these commands in any WhatsApp group where the bot is added:

```
!ping         → Check if bot is alive
!help         → Show all available commands
!stats        → View bot statistics
CS301         → Test file search from Google Drive
```

### 4.2 Check Bot Status

- ✅ **Panel Dashboard**: Should show **"Running"** or **"Online"** status
- ✅ **Console Logs**: No critical errors, only info messages
- ✅ **WhatsApp**: Bot responds instantly to commands

---

## 🎯 Why Your Bot Will Stay 24/7 Online

### ✅ Built-in Keep-Alive Features

Your HSM Tech Bot has multiple mechanisms to ensure 24/7 uptime:

1. **HTTP Keep-Alive Server** (Port 3000)
   - Responds to health check pings
   - Prevents hosting panel from sleeping the bot
   - Self-pings every 5 minutes

2. **Auto-Reconnect Logic**
   - Exponential backoff (2s → 4s → 8s... up to 60s)
   - Automatically handles WhatsApp disconnections
   - Recovers from temporary network errors

3. **Error Recovery**
   - Catches uncaught exceptions
   - Logs errors without crashing
   - Continues running even when errors occur

4. **Session Persistence**
   - Saves WhatsApp session in `auth` folder
   - No need to re-scan QR after restarts
   - Maintains connection across deployments

---

## 🛠️ Managing Your Bot

### Start/Stop/Restart

From your panel dashboard:
- **Start**: Click **"Start"** button (green)
- **Stop**: Click **"Stop"** button (red)
- **Restart**: Click **"Restart"** button (yellow/orange)

### View Real-Time Logs

Go to **"Console"** or **"Logs"** tab to monitor:
- ✅ Connection status
- ✅ Incoming messages and commands
- ✅ File search queries
- ⚠️ Error messages (if any)
- 📱 QR codes for linking

### Update Bot Files

**Method 1: Re-upload ZIP**
1. Stop the bot
2. Go to **"Files"** tab
3. Delete old files or upload new ZIP
4. Extract new ZIP
5. Run `npm install` if dependencies changed
6. Start the bot

**Method 2: Edit Individual Files**
1. Go to **"Files"** tab
2. Click on file to edit (e.g., `bot.js`, `.env`)
3. Make changes in the built-in editor
4. Save
5. Restart bot for changes to take effect

### Manage Environment Variables

**Option A: Edit .env file**
1. Go to **"Files"** tab
2. Click on `.env` file
3. Edit variables as needed
4. Save and restart bot

**Option B: Panel Environment Variables** (if supported)
1. Go to **"Settings"** or **"Environment"** tab
2. Add/edit key-value pairs
3. Restart bot

---

## 🔍 Troubleshooting

### Bot Not Starting

**Symptom**: Bot shows errors in console

**Solutions**:
1. ✅ Check `.env` file has all required variables
2. ✅ Verify `GEMINI_API_KEY` and `GROQ_API_KEY` are valid
3. ✅ Ensure `package.json` exists in root directory
4. ✅ Run `npm install` in console
5. ✅ Check console for specific error messages

### QR Code Not Appearing

**Symptom**: No QR code in console after 1-2 minutes

**Solutions**:
1. Restart the bot from panel
2. Delete `auth` folder in File Manager
3. Start bot again
4. Check if WhatsApp is already linked on another device (max 4 devices)

### "Bad MAC Error" / "MessageCounterError"

**Symptom**: Errors in console about decryption

**Solution**:
- ✅ **This is completely normal!** No action needed
- These errors occur for old/encrypted messages from before the bot was online
- Bot automatically skips them and continues normally
- Does not affect bot functionality

### Bot Stops Responding After Hours

**Symptom**: Bot was working, now doesn't respond

**Solutions**:
1. Check panel dashboard - is bot status still "Running"?
2. Restart bot from panel
3. Check console for out-of-memory errors
4. If using free tier, check if daily renewal is required

### WhatsApp Session Lost

**Symptom**: "Logged out" or "Session error 403"

**Solution**:
1. Stop the bot
2. In File Manager, **delete entire `auth` folder**
3. Start the bot
4. Scan new QR code from console

### Files Not Uploading

**Symptom**: ZIP file won't upload or upload fails

**Solutions**:
1. Check file size (free tier usually has ~100-500MB limit)
2. Exclude `node_modules` and large files
3. Use SFTP instead of web upload for large files
4. Split into smaller uploads if necessary

---

## 💰 Free Tier Limits

### What's Included (Free)

- ✅ **24/7 uptime** (no forced sleep)
- ✅ **128MB - 3GB RAM** (depends on provider)
- ✅ **Node.js support** (v14, v16, v18+)
- ✅ **File manager** and SFTP access
- ✅ **Console/Terminal** access
- ✅ **Basic DDoS protection**

### Potential Limitations

- **RAM**: 128MB - 3GB (WhatsApp bots use ~50-150MB)
- **CPU**: Shared/limited (sufficient for small-medium groups)
- **Storage**: 250MB - 15GB
- **Bandwidth**: Usually unlimited for free tier
- **Daily Renewal**: Some providers require daily server renewal

> 💡 **Tip**: If you need more resources, most providers offer affordable paid plans starting at $2-5/month.

---

## 📊 Expected Bot Behavior

### ✅ Success Indicators

| Indicator | What to Look For |
|-----------|-----------------|
| **Console** | "✅ Connection established successfully!" |
| **Bot Response** | Instant replies to `!ping` command |
| **Panel Status** | Shows "Running" or "Online" |
| **File Sharing** | Works even when your PC/mobile is offline |
| **Auto-Reconnect** | Bot reconnects automatically after brief disconnects |
| **Keep-Alive** | "Keep-Alive Server running on port 3000" in logs |

### ⚠️ Normal Behaviors (Not Errors)

- **"Bad MAC Error"** → Skipping old encrypted messages (normal)
- **"Decryption errors detected"** → Normal after reconnect, bot continues
- **Brief disconnects** → Bot auto-reconnects within 2-60 seconds
- **"QR Code received"** → Appears on first start or after session loss

---

## 🔐 Security Best Practices

1. **Protect Your .env File**
   - ✅ Never commit `.env` to GitHub
   - ✅ Keep `GEMINI_API_KEY` and `GROQ_API_KEY` secret
   - ✅ Don't share your ZIP file publicly

2. **Secure Your Panel Account**
   - ✅ Use a strong, unique password
   - ✅ Enable 2FA (Two-Factor Authentication) if available
   - ✅ Don't share panel login credentials

3. **Regular Backups**
   - ✅ Download `data` folder weekly (contains settings)
   - ✅ Keep backup of `auth` folder (WhatsApp session)
   - ✅ Export `.env` file for disaster recovery

4. **Monitor Bot Activity**
   - ✅ Check console logs regularly
   - ✅ Watch for unauthorized command usage
   - ✅ Review `!stats` periodically

---

## 🎉 Your Bot is Now 24/7!

Once successfully deployed, your **HSM Tech Bot** will:
- ✅ Stay online 24/7 with **FREE hosting**
- ✅ Work even when your **PC/mobile is turned off**
- ✅ **Auto-reconnect** on network disconnections
- ✅ Handle **file requests** from Google Drive reliably
- ✅ Send **automated messages** on schedule
- ✅ Respond to **AI queries** using Gemini/Groq

---

## 📞 Support & Resources

### Bot Commands
Send `!help` in WhatsApp to see all available commands:
```
!ping         → Check bot status
!help         → Show all commands
!stats        → View bot statistics
!open         → Enable file sharing (owner only)
!close        → Disable file sharing (owner only)
!antilink on  → Enable link moderation (admin)
```

### Hosting Support
- **fps.ms**: [docs.fps.ms](https://docs.fps.ms/)
- **Bot-Hosting.net**: Check dashboard help section
- **Wispbyte**: Community Discord server

### Troubleshooting
- Check console logs first
- Restart bot if unresponsive
- Re-scan QR if session lost
- Contact hosting support for panel issues

---

## 🚀 Quick Reference

### First-Time Setup Checklist
```
✅ 1. Create ZIP of bot files (exclude node_modules, auth, logs)
✅ 2. Sign up at hosting panel (fps.ms, bot-hosting.net, etc.)
✅ 3. Create new server (select Node.js, free tier)
✅ 4. Upload and extract ZIP in File Manager
✅ 5. Run 'npm install' in Console
✅ 6. Set startup command to 'node bot.js'
✅ 7. Start the bot
✅ 8. Scan QR code from Console with WhatsApp
✅ 9. Test with !ping command
```

### Daily Operations
```bash
# Check bot status
!ping

# View bot statistics
!stats

# Enable/disable file sharing (owner only)
!open
!close

# View all commands
!help
```

### Updating Bot Code
```bash
# Method 1: Full re-upload
1. Stop bot in panel
2. Upload new ZIP to Files tab
3. Extract files (overwrite old)
4. Run: npm install (if package.json changed)
5. Start bot

# Method 2: Quick edits
1. Edit file directly in File Manager
2. Save changes
3. Restart bot
4. No re-scanning needed (session persists)
```

---

## 🌟 Recommended Hosting Providers

Based on WhatsApp bot requirements:

| Provider | RAM | Storage | Uptime | Best For |
|----------|-----|---------|--------|----------|
| **fps.ms** | 128MB | 250MB | 24/7 | Beginners, simple setup |
| **Wispbyte** | Up to 3GB | 15GB | 24/7 | Power users, large groups |
| **Bot-Hosting.net** | Varies | Varies | 24/7* | Discord bot users |

*Some free tiers require daily renewal

---

**Congratulations! Your HSM Tech Bot is now running 24/7 on FREE hosting!** 🎉

For questions or issues, check the console logs first or send `!help` in WhatsApp.
