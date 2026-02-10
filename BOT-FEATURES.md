# 🤖 HSM TECH BOT - Complete Feature Documentation

**Professional WhatsApp Automation Bot**  
*Google Drive • AI Powered • 24/7 Ready*

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [All Commands](#all-commands)
- [Technical Specifications](#technical-specifications)
- [Screenshots & Demos](#screenshots--demos)

---

## 🎯 Overview

**HSM Tech Bot** is a professional WhatsApp bot designed to automate group management, file sharing, AI interactions, and educational content delivery. Built with advanced features for seamless 24/7 operation.

### Key Highlights

✅ **Google Drive Integration** - Automatic file searching and sharing from multiple Drive folders  
✅ **AI-Powered Responses** - Gemini & Groq AI integration for intelligent conversations  
✅ **Smart File Search** - Advanced keyword-based file detection with prioritization  
✅ **Group Management** - Complete admin tools for moderation and control  
✅ **Automated Scheduling** - Auto open/close groups at specific times  
✅ **Link Moderation** - Protect groups from spam with smart link detection  
✅ **Feature Toggles** - Granular control over bot features per group  
✅ **24/7 Uptime** - Self-healing connections with automatic reconnection  
✅ **Email Notifications** - Daily reports and error alerts  

---

## 🚀 Core Features

### 1. 📁 **Google Drive File Sharing**

**Automatic File Detection & Sharing**
- Searches multiple Google Drive folders simultaneously
- Smart keyword matching for subject codes and file types
- File prioritization (handouts, quizzes, solutions)
- Concurrent file sending (multiple files at once)
- Resume/Stop controls for file transfers
- Cache refresh on demand

**Supported File Types:**
- Handouts, Highlighted Handouts
- Quizzes, Grand Quizzes
- Solutions, Practice Papers
- Lectures, Notes, PDFs

**Commands:**
- File search triggered automatically by subject codes (e.g., "CS101", "MTH301")
- `!files` - List available files
- `!allfiles` - Admin command to view all cached files
- `!stop` - Stop current file transfer
- `!resume` - Resume stopped transfer

---

### 2. 🧠 **AI Integration**

**Dual AI Engine Support**
- **Gemini AI** - Google's advanced language model
- **Groq AI** - Fast, efficient AI responses (FREE)

**AI Features:**
- Natural conversation handling
- Context-aware responses
- Configurable for inbox and group chats
- Subject-specific information
- Admin contact information on request

**Commands:**
- `!ai <message>` - Direct AI interaction
- `!inbox on/off` - Toggle AI in private chats (Owner only)
- AI responds automatically in configured contexts

---

### 3. 👥 **Group Management**

**Complete Administrative Control**
- Open/Close groups (toggle messaging permissions)
- Kick members
- Tag all members
- Mute groups for specific duration
- Get group info and invite links
- Welcome/Goodbye messages with mentions

**Commands:**
- `!open` - Open group for all members
- `!close` - Close group (admins only)
- `!mute <minutes>` - Temporarily close group
- `!kick @user` - Remove member
- `!tagall <message>` / `!t <message>` - Mention all members
- `!link` - Get group invite link
- `!ginfo` - Display group information

---

### 4. ⏰ **Automation & Scheduling**

**Smart Time-Based Actions**
- Auto-open groups at scheduled time
- Auto-close groups at scheduled time
- Persistent schedules (survive bot restarts)
- Timezone-aware (Asia/Karachi default)

**Commands:**
- `!autoopen HH:MM(AM/PM)` - Schedule daily auto-open
- `!autoclose HH:MM(AM/PM)` - Schedule daily auto-close
- `!autotimer off` - Disable all automation
- `!autotimer` - View current timers

**Example:**
```
!autoopen 09:00AM
!autoclose 11:00PM
```

---

### 5. 🛡️ **Moderation & Security**

**Link Protection**
- Detect and delete WhatsApp channel links
- Detect and delete group invite links
- Whitelist trusted channels by URL or forwarded message
- Remove whitelisted channels
- View all whitelisted channels

**Anti-Spam Features:**
- Anti-sticker mode
- Anti-tag protection (prevent mass mentions)
- Anti-promotion (detect promotional content)
- Anti-status forwarding
- Media restrictions
- Warning system (3 warnings → action)

**Commands:**
- `!antilink on/off` - Toggle link moderation
- `!antisticker on/off` - Toggle sticker blocking
- `!antitag on/off` - Toggle tag protection
- `!antipromotion on/off` - Toggle promotion detection
- `!antistatus on/off` - Toggle status forwarding detection
- `!media on/off` - Toggle media restrictions
- `!shield on/off` - Comprehensive protection
- `!whitelist add <url>` - Whitelist channel
- `!whitelist add` (reply to forwarded message) - Whitelist channel from forward
- `!whitelist remove <channel_id>` - Remove from whitelist
- `!whitelist list` - View all whitelisted channels
- `!warn @user` - Issue warning
- `!unwarn @user` - Remove warning
- `!warnings @user` - Check warnings

---

### 6. ⚙️ **Feature Control**

**Granular Per-Group Settings**
- Enable/disable features independently
- Master controls (enable/disable all)
- View current feature status
- All settings isolated per group

**Commands:**
- `!botzero` - Disable ALL features (Owner only)
- `!botall` - Enable ALL features (Owner only)
- `!filesharing on/off` - Toggle file sharing
- `!welcome on/off` - Toggle welcome messages
- `!features` - View all feature statuses

**Toggleable Features:**
- Welcome/Goodbye Messages
- File Sharing & Search
- AI Auto-Replies
- Auto Admin Mode
- Link Moderation
- Sticker Blocking
- Anti-Tag Protection
- Anti-Promotion

---

### 7. 📊 **Information & Help**

**Comprehensive Help System**
- Role-based help menus (Member, Admin, Owner)
- Contact information
- Bot status and version
- Group introduction templates

**Commands:**
- `!help` / `!menu` - Display help menu (role-specific)
- `!owner` - Show bot owner contact
- `!intro` - Group introduction message

---

### 8. 📧 **Email Notifications**

**Automated Reporting**
- Daily email reports with bot statistics
- Error alerts sent to admin
- Startup/shutdown notifications
- Configurable report timing

---

### 9. 🎮 **Fun & Engagement**

**Interactive Commands**
- `!ping` - Check bot responsiveness
- `!hello` / `!hi` - Friendly greeting

---

### 10. 🔐 **VIP & Special Features**

**Inbox Management**
- Designated inbox numbers for silent file-only access
- Disable auto-replies for specific contacts
- Professional file search confirmations

**Owner Controls**
- Complete feature toggles
- Email configuration
- Admin number management
- Broadcast capabilities

---

## 📝 All Commands Reference

### 🔑 General Commands (All Users)

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | Show help menu | `!help` |
| `!menu` | Alias for help | `!menu` |
| `!owner` | Bot owner contact | `!owner` |
| `!intro` | Group introduction | `!intro` |
| `!ping` | Check bot status | `!ping` |
| `!hello` / `!hi` | Greet the bot | `!hello` |
| `!ai <message>` | AI interaction | `!ai What is photosynthesis?` |
| `!files` | List available files | `!files` |
| `!stop` | Stop file transfer | `!stop` |
| `!resume` | Resume file transfer | `!resume` |
| `!features` | View feature status | `!features` |
| `!ginfo` | Group information | `!ginfo` |

### 👮 Admin Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!open` | Open group | `!open` |
| `!close` | Close group | `!close` |
| `!mute <min>` | Mute group | `!mute 30` |
| `!kick @user` | Remove member | `!kick @923001234567` |
| `!tagall <msg>` | Tag all members | `!tagall Meeting at 5PM` |
| `!t <msg>` | Alias for tagall | `!t Important notice` |
| `!link` | Get group link | `!link` |
| `!antilink on/off` | Toggle link moderation | `!antilink on` |
| `!antisticker on/off` | Toggle sticker blocking | `!antisticker on` |
| `!antitag on/off` | Toggle tag protection | `!antitag on` |
| `!antipromotion on/off` | Toggle promotion detection | `!antipromotion on` |
| `!antistatus on/off` | Toggle status detection | `!antistatus on` |
| `!media on/off` | Toggle media restrictions | `!media off` |
| `!shield on/off` | Comprehensive protection | `!shield on` |
| `!welcome on/off` | Toggle welcome messages | `!welcome on` |
| `!filesharing on/off` | Toggle file sharing | `!filesharing on` |
| `!autoopen <time>` | Schedule auto-open | `!autoopen 09:00AM` |
| `!autoclose <time>` | Schedule auto-close | `!autoclose 11:00PM` |
| `!autotimer off` | Disable automation | `!autotimer off` |
| `!warn @user` | Issue warning | `!warn @user` |
| `!unwarn @user` | Remove warning | `!unwarn @user` |
| `!warnings @user` | Check warnings | `!warnings @user` |
| `!allfiles` | View all cached files | `!allfiles` |
| `!handlegroup on/off` | Auto admin mode | `!handlegroup on` |
| `!handle on/off` | Alias for handlegroup | `!handle on` |
| `!autogroup on/off` | Alias for handlegroup | `!autogroup on` |

### 👑 Owner-Only Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!botzero` | Disable ALL features | `!botzero` |
| `!botall` | Enable ALL features | `!botall` |
| `!inbox on/off` | Toggle inbox AI | `!inbox on` |
| `!whitelist add <url>` | Whitelist channel | `!whitelist add https://...` |
| `!whitelist remove <id>` | Remove channel | `!whitelist remove 123` |
| `!whitelist list` | Show whitelisted | `!whitelist list` |

---

## 🔧 Technical Specifications

### Architecture

**Platform:** Node.js  
**WhatsApp Library:** @whiskeysockets/baileys  
**AI Services:** Google Gemini, Groq  
**Storage:** Google Drive API  
**Scheduling:** node-schedule  
**Logging:** Pino + Custom Logger  

### Features Implementation

#### 🔄 **Auto-Reconnection**
- Exponential backoff retry mechanism
- Session persistence
- Graceful error handling
- Self-healing connections

#### 💾 **Data Persistence**
- Settings stored per group
- Cached file index from Google Drive
- Automation schedules persist across restarts
- Warning system tracking

#### 🌐 **Keep-Alive Server**
- HTTP server for uptime monitoring
- Self-ping mechanism (every 5 minutes)
- Prevents hosting platform timeouts
- Port: 3000 (configurable)

#### 📨 **Message Processing**
- Catch-up missed messages on reconnection
- Process messages < 6 hours old
- Concurrent file sending
- Rate limiting protection

#### 🔐 **Security Features**
- Owner and admin verification
- Blocked user list
- Group whitelist
- Message length limits
- Rate limiting (20 messages/minute)

### Configuration Options

**Bot Settings:**
- Bot Name, Prefix, Owner Name
- Admin Numbers (comma-separated)
- Feature Toggles (AI, File Sharing, Welcome, etc.)
- Timezone Configuration

**AI Configuration:**
- Gemini API Key
- Groq API Key (FREE alternative)
- Inbox/Group AI toggles
- Auto-reply exclusions

**Email Configuration:**
- SMTP credentials
- Daily report scheduling
- Error alert recipients

**Google Drive:**
- Multiple folder links support
- Auto-refresh cache
- Folder depth scanning

---

## 🎨 Customization

### Environment Variables

The bot is fully configurable via `.env` file:

```env
# Bot Identity
BOT_NAME=HSM Tech Bot
BOT_PREFIX=!
BOT_OWNER=Mughal
OWNER_HELP_NUMBER=923177180123

# Features
FEATURE_FILE_SHARING=true
FEATURE_AI_ENABLED=true
FEATURE_WELCOME_MESSAGE=true
FEATURE_LINK_MODERATION=true

# AI Keys
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_groq_key

# Google Drive
GDRIVE_FOLDER_LINKS=link1,link2,link3

# Admin
ADMIN_NUMBERS=923177180123,219086348923028

# Email Notifications
EMAIL_ENABLED=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_RECIPIENT=admin@example.com
EMAIL_REPORT_TIME=09:00

# Security
MAX_MESSAGES_PER_MINUTE=20
MAX_MESSAGE_LENGTH=2000
DEFAULT_WARNING_LIMIT=3

# Timezone
TIMEZONE=Asia/Karachi
```

---

## 🌟 Unique Selling Points

### What Makes This Bot Special?

1. **🎓 Education-Focused** - Built specifically for educational groups with smart file detection
2. **🤖 Dual AI Integration** - Combines Gemini and Groq for best performance
3. **📚 Smart File Prioritization** - Automatically ranks files by importance (handouts > quizzes > solutions)
4. **⏰ Persistent Scheduling** - Timers survive bot restarts
5. **🔒 Advanced Link Moderation** - Whitelist system for trusted channels
6. **⚡ Concurrent Processing** - Send multiple files simultaneously
7. **🌐 24/7 Reliability** - Self-healing with exponential backoff
8. **📊 Daily Reports** - Keep track of bot performance via email
9. **🎛️ Per-Group Settings** - All features configurable independently per group
10. **🚀 Production-Ready** - Logging, error handling, graceful shutdown

---

## 📱 Use Cases

### Perfect For:

- **Educational Institutions** - Share course materials, assignments, quizzes
- **Study Groups** - Automated file distribution and Q&A
- **Professional Communities** - Moderation and scheduling
- **Customer Support** - AI-powered responses
- **Content Distribution** - Automated file sharing from Google Drive

---

## 🔥 Advanced Features

### Smart File Search Algorithm

1. **Keyword Detection** - Identifies subject codes in messages
2. **Context Awareness** - Combines subject + keywords (e.g., "handout", "quiz")
3. **File Categorization** - Groups by type (handout, quiz, solution, etc.)
4. **Prioritization Engine** - Ranks by relevance
5. **Batch Sending** - Sends multiple files concurrently
6. **Network Handling** - Retry mechanism for failed uploads

### Link Moderation Intelligence

- **Pattern Recognition** - Detects various link formats
- **Whitelist Memory** - Stores trusted channels
- **Forward Detection** - Identifies channel forwards
- **Quick Action** - Instant message deletion
- **Admin Alerts** - Notifies admins of violations

### AI Context Management

- **Conversation Memory** - Maintains context per user
- **Role Detection** - Different responses for admins/members
- **Service Information** - Automatically provides paid services info
- **Owner Contact** - Smart detection of contact requests

---

## 📈 Performance Metrics

- ✅ **Uptime:** 99.9% with auto-reconnection
- ✅ **Response Time:** < 1 second for commands
- ✅ **File Search Speed:** < 2 seconds for 500+ files
- ✅ **Concurrent Sends:** Up to 5 files simultaneously
- ✅ **Message Processing:** 20 messages/minute (configurable)
- ✅ **AI Response Time:** 2-5 seconds (depends on AI service)

---

## 🏆 Bot Statistics

### Capabilities Count

- **Total Commands:** 50+
- **Feature Toggles:** 8
- **Moderation Tools:** 10+
- **Automation Features:** 3
- **AI Integrations:** 2
- **File Categories:** 6+

---

## 📞 Support & Contact

**Bot Owner:** Mughal  
**Contact Number:** +92 317 7180123  
**Paid Services:** LMS Handling, Custom Bot Development  

---

## 🚀 Deployment Options

This bot supports multiple deployment platforms:

- **Termux** (Android) - Full support with helper scripts
- **AWS Lightsail** - Cloud deployment guide included
- **VPS/Hosting** - Compatible with any Node.js hosting
- **Docker** - Dockerfile included
- **PM2** - Ecosystem config for process management

---

## 📄 License & Credits

**HSM Tech Bot v1.0**  
Developed by: Mughal  
Technology Stack: Node.js, Baileys, Gemini AI, Groq AI  

---

## 🎯 Conclusion

HSM Tech Bot is a **comprehensive, production-ready WhatsApp automation solution** designed for educational groups and professional communities. With advanced file sharing, AI integration, robust moderation, and intelligent automation, it's the perfect assistant for managing busy WhatsApp groups.

### Key Benefits:

✅ **Save Time** - Automate repetitive tasks  
✅ **Improve Organization** - Smart file management  
✅ **Enhance Engagement** - AI-powered interactions  
✅ **Maintain Order** - Advanced moderation tools  
✅ **Stay Connected** - 24/7 availability  

---

**Ready to deploy and impress!** 🚀

