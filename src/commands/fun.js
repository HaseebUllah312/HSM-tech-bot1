/**
 * Fun Commands
 * Birthday wishes and other entertainment.
 */

const aiService = require('../aiService');
const config = require('../config');

const commands = {
    // Aliases handled in index or messageHandler dispatcher
    bd: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await commands.birthday(sock, msg, args, isGroupAdmin, isOwner);
    },

    birthday: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use this command.' });
            return;
        }
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant
            || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!target) {
            await sock.sendMessage(remoteJid, { text: '❌ Please mention the birthday boy/girl!' });
            return;
        }

        try {
            // Generate AI wish
            const prompt = `Write a short, funny, and warm birthday wish for a user. Use emojis. Professional but friendly tone. Mix English and Urdu if possible.`;
            const wish = await aiService.generateResponse(prompt);

            await sock.sendMessage(remoteJid, {
                text: `🎉 *Happy Birthday!* 🎂\n\nTo: @${target.split('@')[0]}\n\n${wish}\n\n🎈🎈🎈`,
                mentions: [target]
            });

        } catch (err) {
            // Fallback
            await sock.sendMessage(remoteJid, {
                text: `🎉 *Happy Birthday* @${target.split('@')[0]}! 🎂\n\nMay you have a wonderful year ahead! 🥳`,
                mentions: [target]
            });
        }
    }
};

module.exports = commands;
