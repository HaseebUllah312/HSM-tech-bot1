# 🤖 HSM Tech Bot v1.0 - Termux Edition

A professional WhatsApp bot optimized for running on Termux (Android).

## 📱 Requirements

- **Android Phone** with Termux installed
- **Termux:API** app (from F-Droid)
- **Active Internet Connection**
- **WhatsApp Account** for the bot

## 🚀 Quick Setup

### 1. Install Termux Dependencies

```bash
# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install nodejs git termux-api -y
```

### 2. Clone & Setup Bot

```bash
# Clone the repository
git clone https://github.com/your-repo/hsm-tech-bot.git
cd hsm-tech-bot

# Install dependencies
npm install

# Make start script executable
chmod +x termux-start.sh
```

### 3. Configure the Bot

Edit `.env` file with your settings:
```bash
nano .env
```

Key settings to configure:
- `BOT_NAME` - Your bot's name
- `BOT_OWNER` - Your name
- `ADMIN_NUMBERS` - Your WhatsApp numbers (comma-separated)
- `GEMINI_API_KEY` - Your Google AI API key (for AI features)

### 4. Start the Bot

**First Run (to scan QR code):**
```bash
./termux-start.sh
```

**Run in Background:**
```bash
./termux-start.sh bg
```

## 📋 Commands

| Command | Description |
|---------|-------------|
| `./termux-start.sh` | Start in foreground (QR scan) |
| `./termux-start.sh bg` | Start in background |
| `./termux-start.sh stop` | Stop the bot |
| `./termux-start.sh status` | Check if running |
| `./termux-start.sh logs` | View live logs |
| `./termux-start.sh restart` | Restart the bot |

## 🤖 Bot Features

### Basic Commands
| Command | Description |
|---------|-------------|
| `!help` | Show all commands |
| `!status` | Bot status & uptime |
| `!ping` | Test bot response |
| `!files` | List available files |
| `!contact` | Contact information |
| `!paid` | Paid services info |

### AI Features
- Just send any question to get AI-powered answers!
- Powered by Google Gemini AI

### Admin Commands
| Command | Description |
|---------|-------------|
| `!tagall` | Tag all group members |
| `!open` | Open group chat |
| `!close` | Close group (admins only) |
| `!kick @user` | Remove member |
| `!mute @user [mins]` | Mute member |
| `!warn @user` | Warn member (3 = kick) |
| `!promote @user` | Make admin |
| `!demote @user` | Remove admin |
| `!toggle [feature]` | Toggle bot features |

## 📁 Project Structure

```
hsm-tech-bot/
├── bot.js              # Main bot entry point
├── termux-start.sh     # Termux startup script
├── package.json        # Node.js dependencies
├── .env                # Configuration (create from .env.example)
├── .env.example        # Configuration template
├── src/
│   ├── config.js       # Config loader
│   ├── messageHandler.js # Command processing
│   ├── aiService.js    # Google Gemini AI
│   ├── fileManager.js  # File management
│   ├── emailService.js # Email notifications
│   ├── security.js     # Security checks
│   ├── logger.js       # Logging system
│   └── linkModerator.js # Link moderation
├── VU_Files/           # Shared files
├── auth/               # WhatsApp session (auto-created)
└── logs/               # Log files
```

## ⚠️ Important Tips

1. **Keep Termux Running**: Use `termux-wake-lock` to prevent Android from killing Termux
2. **Battery Optimization**: Disable battery optimization for Termux
3. **Stable Connection**: Use stable WiFi for best results
4. **Backup Auth**: Copy `auth/` folder to backup your session

## 🔧 Troubleshooting

### Bot stops when closing Termux
- Use `./termux-start.sh bg` to run in background
- Install Termux:API and run `termux-wake-lock`

### QR Code not showing
- Check your internet connection
- Delete `auth/` folder and restart

### Connection keeps dropping
- Check your internet stability
- Increase reconnect delay in bot.js

### Permission errors
```bash
chmod +x termux-start.sh
```

## 🔋 Keep Bot Running 24/7 (Always Online)

### Required Apps (from F-Droid only!)
1. **Termux**
2. **Termux:API** - For wake-lock
3. **Termux:Boot** - For auto-start on reboot

### Step-by-Step Setup

**1. Install termux-api package:**
```bash
pkg install termux-api
```

**2. Disable Battery Optimization:**
- Go to **Settings → Apps → Termux**
- Tap **Battery** → Select **Unrestricted**
- Do same for **Termux:API** and **Termux:Boot**

**3. Start Bot in Background:**
```bash
./termux-start.sh bg
```

**4. Setup Auto-Start on Reboot:**
```bash
# Create boot directory
mkdir -p ~/.termux/boot

# Copy boot script
cp .termux/boot/start-bot.sh ~/.termux/boot/

# Make executable
chmod +x ~/.termux/boot/start-bot.sh
```

**5. Test it works:**
- Close Termux completely
- Wait 1 minute
- Open Termux and run: `./termux-start.sh status`
- Bot should still be running!

### What Happens:
- 🔒 **Wake-lock** keeps phone from sleeping
- 🔄 **nohup** keeps bot running when Termux closes
- 🚀 **Termux:Boot** restarts bot after phone reboot
- 📱 **Notification** appears when bot is running

### Tips for Best Results:
1. Keep phone plugged in or well charged
2. Use stable WiFi connection
3. Don't force-stop Termux from settings
4. Check `./termux-start.sh status` periodically

## 📞 Contact

- **Owner**: 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑
- **Email**: Haseebsaleem312@gmail.com
- **Phone**: +923177180123
- **Website**: https://Haseebullah.me

---

*Made with ❤️ for Termux users*
