# 📱 Run HSM Tech Bot on Termux (Android)

This guide will help you set up and run the **HSM Tech Bot** on your Android device using **Termux**.

## Prerequisite
1.  **Download Termux**: Get it from F-Droid (recommended) or the Play Store (often outdated).
    *   [F-Droid Link](https://f-droid.org/en/packages/com.termux/)

## 🚀 Setup Instructions

### 1. Update Termux & Install Dependencies
Open Termux and copy-paste these commands one by one:

```bash
pkg update && pkg upgrade -y
pkg install git nodejs-lts ffmpeg libwebp -y
```

### 2. Clone the Repository
Download the bot files to your phone:

```bash
git clone https://github.com/YOUR_USERNAME/hsm-tech-bot.git
cd hsm-tech-bot
```
*(Replace `YOUR_USERNAME` with your actual GitHub username if you forked it, or use the direct link provided by the developer)*

### 3. Install Bot Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
You need to configure your `.env` file.
```bash
cp .env.example .env
nano .env
```
*   Use the on-screen keyboard to navigate.
*   Edit `OWNER_NUMBER` (e.g., `923001234567`).
*   Press `CTRL` + `X`, then `Y`, then `Enter` to save and exit.

## ▶️ Running the Bot

### Option A: Quick Start (Recommended)
We have included a startup script for Termux users.
```bash
chmod +x termux-start.sh
./termux-start.sh
```

### Option B: Manual Start
```bash
npm start
```

### Option C: Keep Alive (Background)
To keep the bot running even when you close Termux, use PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 logs
```

## ❓ Troubleshooting
*   **QR Code Issues**: If the QR code is distorted, try zooming out in Termux (`Pinch` screen) or run in landscape mode.
*   **Permission Denied**: Run `chmod +x termux-start.sh` again.
*   **Storage Access**: If the bot needs to save files to your gallery, run `termux-setup-storage` and grant permission.
