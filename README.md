# 🤖 HSM Tech Bot v1.0

**Professional WhatsApp Bot for Group Management & Automation**

> Owner: **𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑**

---

## 📋 Table of Contents

- [Features Overview](#-features-overview)
- [Commands List](#-commands-list)
- [Link Moderation System](#-link-moderation-system)
- [Group Management](#-group-management)
- [AI Features](#-ai-features)
- [File Sharing](#-file-sharing)
- [Security Features](#-security-features)
- [Configuration](#-configuration)
- [Installation](#-installation)

---

## ✨ Features Overview

### 🔗 Link Moderation System
- **All Links Blocked**: YouTube, Instagram, TikTok, Facebook, WhatsApp Groups/Channels, Telegram, Discord, etc.
- **Warning System**: 4 warnings before auto-kick (1/4 → 2/4 → 3/4 → 4/4 = kick)
- **Channel Post Handling**: Strips links from forwarded channel posts and resends content
- **Professional Alerts**: Beautiful styled warning messages
- **Owner Exempt**: Bot owners can send links freely

### 👥 Group Management
- Open/Close group chat
- Kick/Mute/Warn members
- Promote/Demote admins
- Tag all members
- Welcome & Goodbye messages
- Group rules management

### 🤖 AI Integration
- Google Gemini AI powered responses
- Intelligent auto-replies
- Question answering

### 📁 File Sharing
- VU Subject files (CS101, ENG201, etc.)
- Google Drive integration
- Spam protection with file limits

### 📧 Email Reports
- Daily automated reports
- Error alerts to owner
- Startup/shutdown notifications

### 🛡️ Security
- Rate limiting (anti-spam)
- User blocking
- Input sanitization
- Group whitelisting

---

## 📝 Commands List

### General Commands (Everyone)
| Command | Description |
|---------|-------------|
| `!help` | Show all available commands |
| `!menu` | Beautiful organized menu |
| `!status` | Bot status & statistics |
| `!ping` | Test bot responsiveness |
| `!alive` | Check if bot is online |
| `!owner` | Show owner information |
| `!contact` | Contact information |
| `!paid` | Paid services info |

### Group Commands (Everyone)
| Command | Description |
|---------|-------------|
| `!groupinfo` | Show group statistics |
| `!rules` | Show group rules |
| `!report [message]` | Report issue to owner |

### Admin Commands (Group Admins)
| Command | Description |
|---------|-------------|
| `!tagall [message]` | Tag all group members |
| `!open` | Open group (all can chat) |
| `!close` | Close group (admins only) |
| `!kick @user` | Remove member from group |
| `!mute @user [mins]` | Mute member (default 10 min) |
| `!unmute @user` | Unmute member |
| `!warn @user` | Warn user (3 warns = kick) |
| `!resetwarn @user` | Reset user's warnings |
| `!promote @user` | Make user group admin |
| `!demote @user` | Remove admin from user |
| `!rules set [text]` | Set custom group rules |

### Owner Commands (Bot Owner Only)
| Command | Description |
|---------|-------------|
| `!toggle [feature]` | Toggle bot features |
| `!announce [message]` | Send announcement |
| `!block [number]` | Block a user |
| `!unblock [number]` | Unblock a user |

### File Commands
| Command | Description |
|---------|-------------|
| `!files` | List available files |
| `CS101` / `ENG201` | Get subject files directly |

---

## 🔗 Link Moderation System

### Blocked Link Types
| Category | Links |
|----------|-------|
| **YouTube** | youtube.com, youtu.be, m.youtube.com |
| **Instagram** | instagram.com, instagr.am |
| **TikTok** | tiktok.com, vm.tiktok.com, vt.tiktok.com |
| **Facebook** | facebook.com, fb.com, fb.me, fb.watch |
| **WhatsApp** | chat.whatsapp.com (groups), whatsapp.com/channel |
| **Twitter/X** | twitter.com, x.com, t.co |
| **Telegram** | t.me, telegram.me |
| **Discord** | discord.gg, discord.com/invite |
| **LinkedIn** | linkedin.com, lnkd.in |
| **Pinterest** | pinterest.com, pin.it |
| **Snapchat** | snapchat.com, snap.com |
| **Short URLs** | bit.ly, tinyurl.com, goo.gl, ow.ly, cutt.ly, etc. |
| **Any URL** | All http/https and www. links |

### Warning System
```
1st Link → Warning 1/4 ⚠️
2nd Link → Warning 2/4 🔶
3rd Link → Warning 3/4 🟠
4th Link → Warning 4/4 🔴 → AUTO KICK
```

### Warning Alert Style
```
╔══════════════════════════════╗
║     ⛔ *𝗟𝗜𝗡𝗞 𝗔𝗟𝗘𝗥𝗧* ⛔     ║
╠══════════════════════════════╣
╠➤ 𝗨𝘀𝗲𝗿: @923001234567
╠➤ 𝗧𝘆𝗽𝗲: *YouTube Link*
╠➤ 𝗦𝘁𝗮𝘁𝘂𝘀: *𝐍𝐨𝐭 𝐀𝐥𝐥𝐨𝐰𝐞𝐝*
╠➤ 𝗪𝗮𝗿𝗻: *1/4* ⚠️
╠══════════════════════════════╣
║  🤖 *HSM Tech Bot*
║  👑 Owner: *𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑*
╚══════════════════════════════╝
```

### WhatsApp Channel Posts
- Detects forwarded channel posts
- Strips the channel link
- Resends the content WITHOUT the link
- Shows warning to sender

---

## 👥 Group Management Features

### Welcome Message
When a new member joins:
```
✨ *WELCOME TO THE GROUP!* ✨

👋 @newmember
We're happy to have you here! 😎

📚 Feel free to chat & study 💬
🚫 No personal inbox messages
🔗 No promotional links
📝 Please introduce yourself!

━━━━━━━━━━━━━━━━━━━━━
👑 *Powered by 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑*
```

### Goodbye Message
When a member leaves:
```
👋 *GOODBYE!*

@member has left the group.

━━━━━━━━━━━━━━━━━━━━━
_We'll miss you! Take care_ 💙
```

### Mute System
- Mute users for 1-1440 minutes (24 hours max)
- Muted user's messages are auto-deleted
- Admins can unmute anytime

### Warning System
- Track warnings per user per group
- Auto-kick after 3 warnings
- Admins can reset warnings

---

## 🤖 AI Features

### Google Gemini Integration
- Powered by Google's Gemini AI
- Smart question answering
- Context-aware responses

### Greeting Detection
Recognizes greetings in multiple languages:
- English: hi, hello, hey, good morning
- Urdu/Arabic: assalam, salam, السلام عليكم
- Hindi: namaste, namaskar
- Others: hola, bonjour

---

## 📁 File Sharing System

### VU Subject Files
- Auto-detect subject codes (CS101, ENG201, MTH302, etc.)
- Search local files first
- Fallback to Google Drive search
- Anti-spam protection (file sending limits)

### Supported Formats
- PDF documents
- Word documents
- Images
- Videos

---

## 🛡️ Security Features

### Rate Limiting
- Max 20 messages per minute per user
- Warns user when exceeded
- Prevents spam/flooding

### Spam Detection
- Detects repeated messages (5+ times)
- Auto-deletes spam
- Warns user

### User Blocking
- Block/unblock users
- Blocked users' messages ignored

### Input Sanitization
- Removes null bytes
- Trims whitespace
- Limits message length (2000 chars)

### Group Whitelisting
- Optional: only respond in specific groups

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Bot Settings
BOT_NAME=HSM Tech Bot
BOT_PREFIX=!
BOT_OWNER=𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑
BOT_VERSION=1.0.0

# Feature Toggles
FEATURE_BOT_ENABLED=true
FEATURE_AUTO_REPLY=true
FEATURE_FILE_SHARING=true
FEATURE_EMAIL_REPORTS=true
FEATURE_WELCOME_MESSAGE=true
FEATURE_GROUP_ONLY=false
FEATURE_LINK_MODERATION=true
FEATURE_AI_ENABLED=true

# Admin Numbers (comma-separated)
ADMIN_NUMBERS=923177180123,923037180123

# AI Configuration
GEMINI_API_KEY=your_api_key_here

# Email Configuration
EMAIL_ENABLED=false
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app_password
EMAIL_RECIPIENT=owner@gmail.com
EMAIL_REPORT_TIME=09:00

# Security
MAX_MESSAGES_PER_MINUTE=20
MAX_MESSAGE_LENGTH=2000
BLOCKED_USERS=

# Contact Info
CONTACT_EMAIL=your@email.com
CONTACT_PHONE=+923001234567
CONTACT_WEBSITE=https://yourwebsite.com
```

---

## 🚀 Installation

### Requirements
- Node.js 18+
- npm or yarn

### Steps

1. **Clone/Download the project**

2. **Install dependencies**
```bash
npm install
```

3. **Configure .env file**
- Copy `.env.example` to `.env`
- Fill in your details

4. **Start the bot**
```bash
npm start
```

5. **Scan QR code**
- Open WhatsApp on phone
- Settings → Linked Devices → Link Device
- Scan the QR code

---

## ☁️ Deploy to Cloud (24/7 Hosting)

### AWS Deployment (Recommended for Production)

Deploy your bot to Amazon Web Services for professional 24/7 hosting:

**📖 Complete Guide**: [DEPLOY-AWS.md](./DEPLOY-AWS.md)

#### Quick Start - AWS Lightsail ($3.50/month)

```bash
# 1. Install AWS CLI and configure
aws configure

# 2. Run automated deployment
bash deploy-aws.sh lightsail

# 3. SSH into instance and view logs
ssh -i hsm-tech-bot-key.pem ubuntu@YOUR_IP
pm2 logs hsm-tech-bot
```

#### What You Get

✅ **99.99% Uptime** - Enterprise-grade reliability  
✅ **Auto-Restart** - PM2 process manager  
✅ **Professional Hosting** - AWS infrastructure  
✅ **Persistent Sessions** - No re-scanning QR code  
✅ **Remote Management** - SSH access anytime  

#### Deployment Options

| Option | Cost | Best For |
|--------|------|----------|
| **AWS Lightsail** | $3.50-5/mo | Simple, predictable pricing |
| **AWS EC2** | Free (1 yr), then $7-10/mo | Free tier, more control |
| **AWS ECS** | $5-15/mo | Containers, scaling |

**See [DEPLOY-AWS.md](./DEPLOY-AWS.md) for detailed instructions.**

---

### Free Bot Hosting Panels

For free hosting with web-based control panel:

**📖 Complete Guide**: [DEPLOY.md](./DEPLOY.md)

Popular options:
- **fps.ms** - Free 128MB RAM, 24/7 uptime
- **Wispbyte** - Free up to 3GB RAM
- **Bot-Hosting.net** - Simple panel interface

---

### Termux Setup
```bash
# Install Node.js
pkg install nodejs

# Clone and setup
cd hsm-tech-bot
npm install

# Start with background support
termux-wake-lock
nohup node bot.js > bot.log 2>&1 &
```

---

## 📂 Project Structure

```
hsm-tech-bot/
├── bot.js              # Main entry point
├── package.json        # Dependencies
├── .env                # Configuration
├── .env.example        # Config template
├── termux-start.sh     # Termux startup script
├── auth/               # WhatsApp auth data
├── files/              # Shared files
├── logs/               # Log files
└── src/
    ├── config.js       # Configuration loader
    ├── logger.js       # Logging system
    ├── security.js     # Security module
    ├── messageHandler.js   # Message processing
    ├── linkModerator.js    # Link detection
    ├── fileManager.js      # File handling
    ├── aiService.js        # AI integration
    └── emailService.js     # Email reports
```

---

## 📊 Statistics Tracking

The bot tracks:
- Messages received
- Commands executed
- Errors encountered
- Uptime
- Recent commands
- File sharing count

View with `!status` command.

---

## 🔧 Toggleable Features

Use `!toggle [feature]` to enable/disable:
- `bot` - Main bot on/off
- `auto_reply` - Auto greeting replies
- `file_sharing` - File commands
- `email_reports` - Daily email reports
- `welcome` - Welcome/goodbye messages

---

## 📞 Support

- **Owner**: 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑
- **Email**: Haseebsaleem312@gmail.com
- **Phone**: +923177180123
- **Website**: https://Haseebullah.me

---

## 📝 License

This project is proprietary software. All rights reserved.

---

**Made with ❤️ by 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑**
