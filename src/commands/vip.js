/**
 * VIP / User Management Commands
 * Handles locking users (VIP Moderation) and anti-spam settings.
 */

const { vip, settings } = require('../dataStore');
const config = require('../config');

/**
 * Extract mentioned user from message or reply
 */
const getTargetUser = (msg) => {
    if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
        return msg.message.extendedTextMessage.contextInfo.participant;
    }
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    return null;
};

const commands = {
    // Toggle Anti-Spam
    antispam: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }

        if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
            const currentStatus = settings.get(`${remoteJid}.antispam`) ? 'ON' : 'OFF';
            await sock.sendMessage(remoteJid, {
                text: `🔥 *Anti-Spam System*\n\nCurrent Status: *${currentStatus}*\nUsage: ${config.BOT_PREFIX}antispam on/off`
            });
            return;
        }

        const value = args[0].toLowerCase() === 'on';
        settings.set(`${remoteJid}.antispam`, value);

        await sock.sendMessage(remoteJid, {
            text: `🔥 *Anti-Spam System*\n\nStatus changed to: *${value ? 'ON' : 'OFF'}*\nSame message 3 times = Auto-Kick`
        });
    },

    // Lock User
    lock: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const target = getTargetUser(msg);

        if (!target) {
            await sock.sendMessage(remoteJid, { text: '❌ Please mention a user or reply to their message to lock.' });
            return;
        }

        vip.set(`${remoteJid}.${target}.locked`, true);

        await sock.sendMessage(remoteJid, {
            text: `🔒 *User Locked*\n\nUser: @${target.split('@')[0]}\nAction: User will be kicked after 3 messages.`,
            mentions: [target]
        });
    },

    // Unlock User
    unlock: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const target = getTargetUser(msg);

        if (!target) {
            await sock.sendMessage(remoteJid, { text: '❌ Please mention a user or reply to their message to unlock.' });
            return;
        }

        vip.set(`${remoteJid}.${target}.locked`, false);
        // Also reset their message count if we were tracking it
        vip.delete(`${remoteJid}.${target}.msgCount`);

        await sock.sendMessage(remoteJid, {
            text: `🔓 *User Unlocked*\n\nUser: @${target.split('@')[0]}\nAction: User can chat normally now.`,
            mentions: [target]
        });
    }
};

module.exports = commands;
