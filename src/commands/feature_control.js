/**
 * Feature Control Commands
 * Comprehensive feature management: botzero, botall, filesharing, features
 * All settings are PER-GROUP (isolated)
 */

const { settings } = require('../dataStore');
const config = require('../config');

// All toggleable features with their display names
const FEATURES = {
    'welcome': 'Welcome/Goodbye Messages',
    'filesharing': 'File Sharing & Search',
    'ai_enabled': 'AI Auto-Replies',
    'auto_handle_group': 'Auto Admin Mode',
    'antilink': 'Link Moderation',
    'antisticker': 'Sticker Blocking',
    'antitag': 'Anti-Tag Protection',
    'antipromotion': 'Anti-Promotion',
};

const commands = {
    /**
     * botzero - Disable ALL features (complete silence)
     * Owner only, per-group
     */
    botzero: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' });
            return;
        }

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Bot Owner can use this command.' });
            return;
        }

        // Disable ALL features for THIS GROUP ONLY
        for (const feature of Object.keys(FEATURES)) {
            settings.set(`${remoteJid}.${feature}`, false);
        }

        await sock.sendMessage(remoteJid, {
            text: `🔇 *COMPLETE SILENCE MODE*

All features have been disabled in this group.

❌ Welcome/Goodbye Messages
❌ File Sharing
❌ AI Replies
❌ Auto Admin
❌ All Moderation

━━━━━━━━━━━━━━━━━━━━━
✅ Owner commands still work
📝 Enable features individually or use ${config.BOT_PREFIX}botall`
        });
    },

    /**
     * botall - Enable ALL features
     * Owner only, per-group
     */
    botall: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' });
            return;
        }

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Bot Owner can use this command.' });
            return;
        }

        // Enable ALL features for THIS GROUP ONLY
        for (const feature of Object.keys(FEATURES)) {
            settings.set(`${remoteJid}.${feature}`, true);
        }

        await sock.sendMessage(remoteJid, {
            text: `🔊 *ALL FEATURES ENABLED*

All features have been activated in this group.

✅ Welcome/Goodbye Messages
✅ File Sharing
✅ AI Replies
✅ Auto Admin
✅ All Moderation

━━━━━━━━━━━━━━━━━━━━━
Bot is now fully operational! 🤖`
        });
    },

    /**
     * filesharing - Toggle file sharing feature
     * Admin/Owner, per-group
     */
    filesharing: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        if (isGroup && !isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }

        if (!isGroup) {
            await sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' });
            return;
        }

        if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
            const currentStatus = settings.get(`${remoteJid}.filesharing`, config.FEATURE_FILE_SHARING) ? 'ON' : 'OFF';
            await sock.sendMessage(remoteJid, {
                text: `📁 *File Sharing & Search*\n\nCurrent Status: *${currentStatus}*\nUsage: ${config.BOT_PREFIX}filesharing on/off`
            });
            return;
        }

        const value = args[0].toLowerCase() === 'on';
        settings.set(`${remoteJid}.filesharing`, value);

        await sock.sendMessage(remoteJid, {
            text: `📁 *File Sharing & Search*\n\nStatus changed to: *${value ? 'ON' : 'OFF'}*`
        });
    },

    /**
     * features - Show current feature status
     * Any user can view
     */
    features: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');

        if (!isGroup) {
            await sock.sendMessage(remoteJid, { text: '❌ This command can only be used in groups.' });
            return;
        }

        let statusText = `⚙️ *FEATURE STATUS*\n\n`;
        statusText += `━━━━━━━━━━━━━━━━━━━━━\n`;

        for (const [key, name] of Object.entries(FEATURES)) {
            // Get feature status with proper defaults
            let isEnabled;
            if (key === 'ai_enabled') {
                isEnabled = settings.get(`${remoteJid}.${key}`, true);
            } else if (key === 'auto_handle_group') {
                isEnabled = settings.get(`${remoteJid}.${key}`, false);
            } else if (key === 'filesharing') {
                isEnabled = settings.get(`${remoteJid}.${key}`, config.FEATURE_FILE_SHARING);
            } else if (key === 'welcome') {
                isEnabled = settings.get(`${remoteJid}.${key}`, config.FEATURE_WELCOME_MESSAGE);
            } else if (key === 'antilink') {
                isEnabled = settings.get(`${remoteJid}.${key}`, config.FEATURE_LINK_MODERATION);
            } else {
                // Other features default to false
                isEnabled = settings.get(`${remoteJid}.${key}`, false);
            }

            const icon = isEnabled ? '✅' : '❌';
            statusText += `${icon} ${name}\n`;
        }

        statusText += `━━━━━━━━━━━━━━━━━━━━━\n`;
        statusText += `\n💡 Toggle features individually or use:\n`;
        statusText += `• ${config.BOT_PREFIX}botzero - Disable all\n`;
        statusText += `• ${config.BOT_PREFIX}botall - Enable all`;

        await sock.sendMessage(remoteJid, { text: statusText });
    }
};

module.exports = commands;
