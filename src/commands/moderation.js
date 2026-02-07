/**
 * Moderation Commands
 * Handles feature toggles for group security and moderation.
 */

const { settings } = require('../dataStore');
const config = require('../config');

// Helper to handle toggle commands
const handleToggle = async (sock, msg, args, featureName, responseMap, isGroupAdmin, isOwner) => {
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
        const currentStatus = settings.get(`${remoteJid}.${featureName}`) ? 'ON' : 'OFF';
        await sock.sendMessage(remoteJid, {
            text: `🛡️ *${responseMap.title}*\n\nCurrent Status: *${currentStatus}*\nUsage: ${config.BOT_PREFIX}${responseMap.command} on/off`
        });
        return;
    }

    const value = args[0].toLowerCase() === 'on';
    settings.set(`${remoteJid}.${featureName}`, value);

    await sock.sendMessage(remoteJid, {
        text: `🛡️ *${responseMap.title}*\n\nStatus changed to: *${value ? 'ON' : 'OFF'}*`
    });
};

const commands = {
    antilink: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antilink', { title: 'Anti-Link System', command: 'antilink' }, isGroupAdmin, isOwner);
    },

    antisticker: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antisticker', { title: 'Anti-Sticker System', command: 'antisticker' }, isGroupAdmin, isOwner);
    },

    antitag: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antitag', { title: 'Anti-Tag System', command: 'antitag' }, isGroupAdmin, isOwner);
    },

    antipromotion: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antipromotion', { title: 'Anti-Promotion System', command: 'antipromotion' }, isGroupAdmin, isOwner);
    },

    antistatus: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antistatus', { title: 'Anti-Status System', command: 'antistatus' }, isGroupAdmin, isOwner);
    },

    welcome: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'welcome', { title: 'Welcome System', command: 'welcome' }, isGroupAdmin, isOwner);
    },

    antivote: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'antivote', { title: 'Anti-Vote System', command: 'antivote' }, isGroupAdmin, isOwner);
    },

    shield: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'shield', { title: 'Group Shield', command: 'shield' }, isGroupAdmin, isOwner);
    },

    media: async (sock, msg, args, isGroupAdmin, isOwner) => {
        await handleToggle(sock, msg, args, 'media', { title: 'Media Moderation', command: 'media' }, isGroupAdmin, isOwner);
    },

    // Whitelist Command
    whitelist: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid.endsWith('@g.us')) {
            await sock.sendMessage(remoteJid, { text: '❌ Group command only.' });
            return;
        }

        // Restrict to Owner Only (User Request: "this can edit owner only")
        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Bot Owner can manage the whitelist.' });
            return;
        }

        const action = args[0] ? args[0].toLowerCase() : 'add';

        if (action === 'list') {
            const whitelist = settings.get(`${remoteJid}.whitelist`) || [];
            const names = settings.get(`${remoteJid}.whitelist_names`) || {};

            if (whitelist.length === 0) {
                await sock.sendMessage(remoteJid, { text: '🛡️ *Channel Whitelist is Empty*' });
                return;
            }

            const listText = whitelist.map((id, index) => {
                const name = names[id] || 'Name Unknown';
                // Try to be smart: if it looks like a JID, hide part of it? No, user needs it for remove?
                // Actually link is better.
                return `${index + 1}. *${name}*\n   ID: \`${id}\``;
            }).join('\n\n');

            const footer = `\n\n──────────────\n🗑️ *How to Remove:*\n1. Reply to a post with \`!whitelist remove\`\n2. Type \`!whitelist remove <link>\`\n3. Type \`!whitelist remove <ID>\``;

            await sock.sendMessage(remoteJid, { text: `🛡️ *Allowed Channels:*\n\n${listText}${footer}` });
            return;
        }

        let whitelist = settings.get(`${remoteJid}.whitelist`) || [];
        let whitelistNames = settings.get(`${remoteJid}.whitelist_names`) || {};
        let channelJid = null;
        let channelCode = null;
        let channelName = 'Unknown Channel';

        // Check if Argument is a URL
        const urlMatch = args[0]?.match(/(?:whatsapp\.com\/channel\/|chat\.whatsapp\.com\/)([a-zA-Z0-9_-]+)/);

        if (urlMatch) {
            channelCode = urlMatch[1];
            try {
                // Try to resolve JID from Code using Baileys
                const metadata = await sock.newsletterMetadata('invite', channelCode);
                channelJid = metadata.id;
                // Baileys 'newsletterMetadata' usually returns 'subject' or 'name'
                channelName = metadata.name || metadata.subject || channelName;
            } catch (err) {
                console.error('Failed to resolve channel code', err);
                // await sock.sendMessage(remoteJid, { text: '⚠️ Could not verify Channel Link. Adding raw code to whitelist...' });
            }
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            // Logic to extract Channel JID from QUOTED message
            const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;

            // Robust context extraction from quoted message
            let contextInfo = null;
            for (const key of Object.keys(quoted)) {
                const content = quoted[key];
                if (content && typeof content === 'object' && content.contextInfo) {
                    contextInfo = content.contextInfo;
                    break;
                }
            }

            const newsletterInfo = contextInfo?.forwardedNewsletterMessageInfo;
            channelJid = newsletterInfo?.newsletterJid;
            channelName = newsletterInfo?.newsletterName || channelName;
        }

        // Fix: Allow 'reset' and 'list' (handled above) and 'remove' to bypass JID check
        if (!channelJid && !channelCode && action !== 'remove' && action !== 'delete' && action !== 'reset') {
            await sock.sendMessage(remoteJid, { text: '❌ Invalid Input.\n\nUsage:\n1. Reply to Channel Post with `!whitelist`\n2. Type `!whitelist <channel_link>`' });
            return;
        }

        if (action === 'remove' || action === 'delete') {
            // Remove logic needs an ID. If user typed "remove <link>", we parsed it above.
            const target = channelJid || channelCode || args[1]; // fallback to args[1] if just "whitelist remove ID"

            if (!target) {
                await sock.sendMessage(remoteJid, { text: '❌ Please provide a link or reply to a post to remove.' });
                return;
            }

            // Remove both JID and Code if found
            const initialLength = whitelist.length;

            // Filter out ID
            const newWhitelist = whitelist.filter(id => id !== channelJid && id !== channelCode && id !== target);

            if (newWhitelist.length === initialLength) {
                await sock.sendMessage(remoteJid, { text: '❌ Channel not found in whitelist.' });
            } else {
                // Cleanup Names
                if (channelJid) delete whitelistNames[channelJid];
                if (channelCode) delete whitelistNames[channelCode];
                if (target) delete whitelistNames[target];

                settings.set(`${remoteJid}.whitelist`, newWhitelist);
                settings.set(`${remoteJid}.whitelist_names`, whitelistNames);

                await sock.sendMessage(remoteJid, { text: `✅ Removed from whitelist.` });
            }
            return;
        } else if (action === 'reset') {
            // Reset ALL whitelist
            settings.delete(`${remoteJid}.whitelist`);
            settings.delete(`${remoteJid}.whitelist_names`);
            await sock.sendMessage(remoteJid, { text: '⚠️ *Whitelist Reset*\n\nAll allowed channels have been removed.' });
            return;
        } else {
            // Add
            let added = false;
            // Add JID
            if (channelJid) {
                if (!whitelist.includes(channelJid)) {
                    whitelist.push(channelJid);
                    added = true;
                }
                whitelistNames[channelJid] = channelName; // Update name
            }
            // Add Code
            if (channelCode) {
                if (!whitelist.includes(channelCode)) {
                    whitelist.push(channelCode);
                    added = true;
                }
                whitelistNames[channelCode] = channelName; // Update name
            }

            if (!added) {
                // Update names even if already exists
                settings.set(`${remoteJid}.whitelist_names`, whitelistNames);
                await sock.sendMessage(remoteJid, { text: '✅ Channel is already whitelisted (Name Updated).' });
                return;
            }

            settings.set(`${remoteJid}.whitelist`, whitelist);
            settings.set(`${remoteJid}.whitelist_names`, whitelistNames);

            await sock.sendMessage(remoteJid, { text: `✅ *${channelName}* added to whitelist!\n\nLink Sharing: ${channelCode ? 'Allowed' : 'Unknown'}\nForwarding: ${channelJid ? 'Allowed' : 'Unknown'}` });
        }
    }
};

module.exports = commands;
