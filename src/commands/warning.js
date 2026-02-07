/**
 * Warning System Commands
 * Manages user warnings and limits.
 */

const { warnings, settings } = require('../dataStore');
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
    // Show specific user warning or instructions
    showwarn: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const target = getTargetUser(msg);

        // If specific user
        if (target) {
            const count = warnings.get(`${remoteJid}.${target}`) || 0;
            const limit = settings.get(`${remoteJid}.warningLimit`) || config.DEFAULT_WARNING_LIMIT;

            await sock.sendMessage(remoteJid, {
                text: `⚠️ *Warning Status*\n\nUser: @${target.split('@')[0]}\nWarnings: ${count} / ${limit}`,
                mentions: [target]
            });
        } else {
            await sock.sendMessage(remoteJid, {
                text: `📜 *Warning System*\n\nUsage:\n${config.BOT_PREFIX}warnlist - See all warned users\n${config.BOT_PREFIX}showwarn @user - Check user warnings`
            });
        }
    },

    // Alias for showwarn
    warnshow: async (sock, msg, args) => {
        await commands.showwarn(sock, msg, args);
    },

    // List ALL warned users in the group
    warnlist: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const allData = warnings.getAll();
        const groupWarnings = [];

        // Filter keys for this group: "remoteJid.participantJid"
        Object.keys(allData).forEach(key => {
            if (key.startsWith(remoteJid + '.')) {
                const count = allData[key];
                if (count > 0) {
                    const userJid = key.split(`${remoteJid}.`)[1];
                    groupWarnings.push({ id: userJid, count });
                }
            }
        });

        if (groupWarnings.length === 0) {
            await sock.sendMessage(remoteJid, { text: '✅ No active warnings in this group.' });
            return;
        }

        const listText = groupWarnings.map((w, i) => `${i + 1}. @${w.id.split('@')[0]} - *${w.count}*`).join('\n');
        await sock.sendMessage(remoteJid, {
            text: `⚠️ *Warned Users List*\n\n${listText}\n\nTo reset all: ${config.BOT_PREFIX}resetwarn all`,
            mentions: groupWarnings.map(w => w.id)
        });
    },

    // Reset Warnings
    resetwarn: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const target = getTargetUser(msg);

        // Reset ALL functionality
        if (args[0] && args[0].toLowerCase() === 'all') {
            const allData = warnings.getAll();
            let count = 0;
            Object.keys(allData).forEach(key => {
                if (key.startsWith(remoteJid)) {
                    warnings.delete(key);
                    count++;
                }
            });
            await sock.sendMessage(remoteJid, { text: `♻️ *Group Reset*\n\nCleared warnings for ${count} users.` });
            return;
        }

        if (target) {
            warnings.set(`${remoteJid}.${target}`, 0);
            await sock.sendMessage(remoteJid, {
                text: `♻️ *Warnings Reset*\n\nUser: @${target.split('@')[0]}\nWarnings cleared.`,
                mentions: [target]
            });
        } else {
            await sock.sendMessage(remoteJid, {
                text: `❌ Usage:\n1. Reply to user with \`!resetwarn\`\n2. Type \`!resetwarn all\` to reset everyone.`
            });
        }
    },

    // Set Warning Limit
    setwarnlimit: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }

        if (!args[0] || isNaN(args[0])) {
            await sock.sendMessage(remoteJid, { text: `⚠️ Usage: ${config.BOT_PREFIX}setwarnlimit <number>\nExample: ${config.BOT_PREFIX}setwarnlimit 5` });
            return;
        }

        const limit = parseInt(args[0]);
        if (limit < 1 || limit > 10) {
            await sock.sendMessage(remoteJid, { text: '❌ Limit must be between 1 and 10.' });
            return;
        }

        settings.set(`${remoteJid}.warningLimit`, limit);
        await sock.sendMessage(remoteJid, { text: `⚠️ *Warning Limit Set*\n\nNew Limit: ${limit} warnings = Action (Kick)` });
    }
};

module.exports = commands;
