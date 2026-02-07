/**
 * Group Management Commands
 * Handles administrative group actions.
 */

const config = require('../config');
const { settings } = require('../dataStore');

// Helper component for tagall
const getGroupParticipants = async (sock, remoteJid) => {
    const metadata = await sock.groupMetadata(remoteJid);
    return metadata.participants;
};

const commands = {
    // Get Group Link
    link: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        // Allow members to get link
        try {
            const code = await sock.groupInviteCode(remoteJid);
            await sock.sendMessage(remoteJid, { text: `🔗 *Group Link*\n\nhttps://chat.whatsapp.com/${code}` });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to get group link. Make sure I am an admin.' });
        }
    },

    // Kick User
    kick: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can kick users.' });
            return;
        }
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant
            || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!target) {
            await sock.sendMessage(remoteJid, { text: '❌ Please mention a user or reply to their message to kick.' });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(remoteJid, [target], 'remove');
            await sock.sendMessage(remoteJid, { text: '👞 User kicked successfully.' });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to kick user. Make sure I am an admin.' });
        }
    },

    // Open Group (Allow all to send messages)
    open: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can open the group.' });
            return;
        }
        try {
            await sock.groupSettingUpdate(remoteJid, 'announcement'); // 'announcement' set to false? No, API is weird.
            // Actually: 'announcement' = admins only. 'not_announcement' = all.
            // checking Baileys docs/usage: 
            // groupSettingUpdate(jid, 'announcement') -> sets to true
            // groupSettingUpdate(jid, 'not_announcement') -> sets to false

            await sock.groupSettingUpdate(remoteJid, 'not_announcement');
            await sock.sendMessage(remoteJid, { text: '🔓 *Group Opened*\n\nNow everyone can send messages.' });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to open group. Make sure I am an admin.' });
        }
    },

    // Close Group (Admins only)
    close: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can close the group.' });
            return;
        }
        try {
            await sock.groupSettingUpdate(remoteJid, 'announcement');
            await sock.sendMessage(remoteJid, { text: '🔐 *Group Closed*\n\nOnly admins can send messages now.' });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to close group. Make sure I am an admin.' });
        }
    },

    // Mute Group (Close for X minutes)
    mute: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can mute the group.' });
            return;
        }

        if (!args[0] || isNaN(args[0])) {
            // If no args, maybe they meant "mute user"? But "kick" implies removal.
            // Given the context of "Group Management", let's assume it's temporay close.
            await sock.sendMessage(remoteJid, { text: `Usage: ${config.BOT_PREFIX}mute [minutes]\nExample: ${config.BOT_PREFIX}mute 10` });
            return;
        }

        const minutes = parseInt(args[0]);

        try {
            await sock.groupSettingUpdate(remoteJid, 'announcement');
            await sock.sendMessage(remoteJid, { text: `⏳ *Group Muted*\n\nChat closed for ${minutes} minutes.` });

            // Schedule reopen
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(remoteJid, 'not_announcement');
                    await sock.sendMessage(remoteJid, { text: '🔊 *Group Unmuted*\n\nTimer finished. Chat is open.' });
                } catch (e) {
                    console.error('Failed to unmute group', e);
                }
            }, minutes * 60 * 1000);

        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to mute group. Make sure I am an admin.' });
        }
    },

    // Tag All
    tagall: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins can use tagall.' });
            return;
        }
        const message = args.join(' ') || 'Attention everyone!';

        try {
            const metadata = await sock.groupMetadata(remoteJid);
            const participants = metadata.participants.map(p => p.id);

            let text = `👥 *Everyone Mentioned*\n\n📜 Message: ${message}`;

            await sock.sendMessage(remoteJid, {
                text: text,
                mentions: participants
            });

        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to fetch participants.' });
        }
    },

    // Alias for tagall
    t: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await commands.tagall(sock, msg, args, isGroupAdmin, isOwner);
    },

    // Group Info
    ginfo: async (sock, msg, args) => {
        const remoteJid = msg.key.remoteJid;
        try {
            const metadata = await sock.groupMetadata(remoteJid);

            let text = `🏛 *Group Information*\n\n`;
            text += `📝 Name: ${metadata.subject}\n`;
            text += `🆔 ID: ${metadata.id}\n`;
            text += `👑 Owner: @${metadata.owner?.split('@')[0] || 'Unknown'}\n`;
            text += `👥 Members: ${metadata.participants.length}\n`;
            text += `📅 Created: ${new Date(metadata.creation * 1000).toDateString()}\n`;

            if (metadata.desc) {
                text += `\n📄 Description:\n${metadata.desc.toString()}`;
            }

            await sock.sendMessage(remoteJid, {
                text: text,
                mentions: metadata.owner ? [metadata.owner] : []
            });
        } catch (err) {
            await sock.sendMessage(remoteJid, { text: '❌ Failed to get group info.' });
        }
    },

    // Handle Group Mode (Auto Admin)
    handlegroup: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!isGroupAdmin && !isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only admins or owner can toggle Auto-Admin.' });
            return;
        }
        const currentStatus = settings.get(`${remoteJid}.auto_handle_group`, false);
        const newStatus = !currentStatus;

        settings.set(`${remoteJid}.auto_handle_group`, newStatus);

        if (newStatus) {
            await sock.sendMessage(remoteJid, { text: '🤖 *Auto-Admin Mode Enabled*\n\nI will now handle the group professionally and reply to general queries.' });
        } else {
            await sock.sendMessage(remoteJid, { text: '👤 *Auto-Admin Mode Disabled*\n\nI will only rely to explicit commands.' });
        }
    },

    // Alias for handlegroup
    handle: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await commands.handlegroup(sock, msg, args, isGroupAdmin, isOwner);
    },

    // Alias for handlegroup (requested by user)
    autogroup: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await commands.handlegroup(sock, msg, args, isGroupAdmin, isOwner);
    }
};

module.exports = commands;
