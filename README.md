# 🤖 HSM TECH BOT v3.0 - Professional WhatsApp Automation

A production-ready WhatsApp bot with enterprise-grade security, advanced features, and zero errors.

## ✨ Features

- **🤖 Automated Responses** - Intelligent command processing and greetings
- **📁 File Sharing** - Organize and share files with users
- **📧 Email Notifications** - Daily reports and error alerts
- **🔒 Enterprise Security** - Rate limiting, user blocking, input validation
- **⚙️ Feature Toggles** - Enable/disable features without restart
- **📊 Activity Logging** - Comprehensive logging and monitoring
- **⚡ Infinite Retry** - Automatic reconnection with exponential backoff
- **💬 Multi-language Support** - Greeting detection in multiple languages

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- WhatsApp account for linking
- **Android Users**: See [Termux Guide](TERMUX_GUIDE.md)

### Installation

```bash
# 1. Clone or navigate to project
cd hsm-tech-bot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (email, bot settings, etc.)

# 4. Run tests
npm test

# 5. Start the bot
npm start
```

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | Show all commands | `!help` |
| `!status` | Check bot status | `!status` |
| `!files` | Get shared files | `!files` |
| `!contact` | Contact information | `!contact` |
| `!paid` | Paid services info | `!paid` |
| `!ping` | Test bot responsiveness | `!ping` |
| `!toggle [feature]` | Toggle features (admin) | `!toggle bot` |
| `!block [number]` | Block user (admin) | `!block 923001234567` |
| `!unblock [number]` | Unblock user (admin) | `!unblock 923001234567` |

## 🎯 Project Structure

```
hsm-tech-bot/
├── bot.js                 # Main application
├── package.json          # Dependencies & scripts
├── test-bot.js          # Comprehensive tests
├── .env.example         # Configuration template
├── src/
│   ├── config.js        # Configuration management
│   ├── logger.js        # Logging system
│   ├── security.js      # Security & validation
│   ├── fileManager.js   # File operations
│   ├── messageHandler.js # Command processing
│   └── emailService.js  # Email functionality
├── VU_Files/           # Shared files directory
├── logs/               # Application logs
├── auth/               # WhatsApp authentication (auto-generated)
└── README.md          # This file
```

## ⚙️ Configuration

Edit `.env` to customize:

```env
# Bot Settings
BOT_NAME=HSM Tech Bot
BOT_PREFIX=!
BOT_OWNER=Admin

# Feature Toggles
FEATURE_BOT_ENABLED=true
FEATURE_AUTO_REPLY=true
FEATURE_FILE_SHARING=true
FEATURE_EMAIL_REPORTS=true
FEATURE_WELCOME_MESSAGE=true

# Email Settings
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENT=your-email@gmail.com

# Rate Limiting
MAX_MESSAGES_PER_MINUTE=20

# And more...
```

## 📊 Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- ✅ 57+ test cases
- ✅ 100% success rate
- ✅ Configuration validation
- ✅ Input sanitization
- ✅ Command processing
- ✅ Rate limiting
- ✅ File management
- ✅ Email functionality
- ✅ Security features

## 🔒 Security Features

- **Input Sanitization** - Removes null bytes and limits length
- **Rate Limiting** - Max 20 messages/minute per user (configurable)
- **User Blocking** - Block specific users from using the bot
- **Path Validation** - Prevents directory traversal attacks
- **Group Filtering** - Whitelist allowed groups
- **Error Masking** - Safe error messages to users
- **Comprehensive Logging** - All activities logged for audit

## 📧 Email Integration

### Setup Gmail App Password

1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use the 16-character App Password in `.env` as `EMAIL_PASSWORD`

### Daily Reports

The bot sends daily reports at configured time (default 9:00 AM) with:
- Activity summary
- Recent commands
- Error log
- Bot status

## 🔄 How It Works

1. **Connection** - Bot connects to WhatsApp using Baileys library
2. **QR Code** - Scan QR code with your WhatsApp phone
3. **Message Received** - Bot processes incoming messages
4. **Command Check** - Checks if message starts with prefix (!)
5. **Response** - Executes command or sends greeting/auto-reply
6. **Logging** - All activities logged for monitoring

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start bot
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run test suite
npm run logs       # View live logs
npm run clean      # Clean and reinstall
```

### Project Statistics

- **Total Files**: 20+
- **Lines of Code**: 2000+
- **Modules**: 6 professional modules
- **Test Coverage**: 57+ test cases
- **Security Layers**: 8+
- **Error Handling**: Comprehensive try-catch blocks

## 📱 WhatsApp Linking

### First Time Setup

1. Start the bot: `npm start`
2. A QR code will appear in terminal
3. Open WhatsApp on your phone
4. Go to Settings → Linked Devices → Link Device
5. Scan the QR code
6. Bot will automatically connect

### If QR Code Doesn't Appear

- WhatsApp may be blocking connection (try again in 30 mins - 2 hours)
- Delete `auth` folder and restart:
  ```bash
  rm -rf auth
  npm start
  ```
- Check internet connection
- Verify you're using Node.js v18+

## 🐛 Troubleshooting

### Bot Not Connecting
- Check WhatsApp hasn't blocked you temporarily
- Wait 2 hours and try again
- Delete auth folder: `rm -rf auth`
- Restart bot: `npm start`

### Messages Not Sending
- Verify `FEATURE_BOT_ENABLED=true` in `.env`
- Check rate limiting settings
- Review logs in `logs/app.log`

### Email Not Working
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check `EMAIL_ENABLED=true` in `.env`
- Ensure 2FA is enabled on Google account
- Check spam folder for emails

### High Memory Usage
- Reduce `LOG_RETENTION_DAYS` in `.env`
- Clear old logs: `rm logs/*.log`
- Restart bot periodically

## 📝 License

MIT License - Free for personal and commercial use

## 👨💍 Support

For issues, feature requests, or questions:
- GitHub Issues
- Email: support@hsmtech.com
- WhatsApp: +92 300 1234567

## 🎉 Version History

### v3.0.0 - Complete Rewrite (Current)
- ✅ Complete professional refactoring
- ✅ Enterprise security implementation
- ✅ Comprehensive test suite (57+ tests)
- ✅ Zero errors, production-ready
- ✅ 6 modular components
- ✅ Full documentation
- ✅ Baileys library integration
- ✅ Infinite retry with exponential backoff
- ✅ Email notifications and daily reports
- ✅ Multi-language greeting detection
- ✅ Feature toggle system
- ✅ Advanced rate limiting

### v2.0.0
- Added modular architecture
- Implemented security layers
- Email integration
- Feature toggles

### v1.0.0
- Initial release
- Basic commands
- Simple file sharing

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2026  
**Maintained By**: HSM Tech Team  
**Powered By**: Baileys WhatsApp Library

---

## 🌟 Getting Started Now

1. **Install dependencies**: `npm install`
2. **Copy environment**: `cp .env.example .env`
3. **Edit `.env`**: Add your email and admin numbers
4. **Run tests**: `npm test` (should see 57✅ tests passing)
5. **Start bot**: `npm start`
6. **Scan QR code**: With WhatsApp on your phone
7. **Send `!help`**: To your bot's WhatsApp number
8. **Enjoy!**: Your bot is now running! 🎉

**Need help?** Check the detailed guides:
- `SETUP_GUIDE.md` - Step-by-step setup
- `TERMUX_GUIDE.md` - Android/Termux setup
- `ARCHITECTURE.md` - Technical architecture
- `SECURITY.md` - Security details
- `API.md` - Module documentation
