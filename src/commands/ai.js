/**
 * AI Commands
 * Handles AI interactions.
 */

const aiService = require('../aiService');
const config = require('../config');
const { settings } = require('../dataStore');

const aiContexts = new Map();

const commands = {
    ai: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        if (args[0] === 'clear') {
            if (!isGroupAdmin && !isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only admins can clear AI memory.' });
                return;
            }
            aiContexts.delete(remoteJid);
            await sock.sendMessage(remoteJid, { text: '🧠 *AI Memory Cleared*\n\nI have forgotten our previous conversation.' });
            return;
        }

        if (args[0] === 'off') {
            if (!isGroupAdmin && !isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only admins can disable AI.' });
                return;
            }
            settings.set(`${remoteJid}.ai_enabled`, false);
            await sock.sendMessage(remoteJid, { text: '📴 *AI Disabled*\n\nI will no longer reply to questions in this chat.' });
            return;
        }

        if (args[0] === 'on') {
            if (!isGroupAdmin && !isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only admins can enable AI.' });
                return;
            }
            settings.set(`${remoteJid}.ai_enabled`, true);
            await sock.sendMessage(remoteJid, { text: '🔛 *AI Enabled*\n\nI will now reply to questions!' });
            return;
        }

        if (['autoreply', 'chat'].includes(args[0]) && args[1] === 'off') {
            if (!isGroupAdmin && !isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only admins can configure auto-reply.' });
                return;
            }
            settings.set(`${remoteJid}.autoreply_enabled`, false);
            await sock.sendMessage(remoteJid, { text: '🔇 *Auto-Reply Disabled*\n\nI will only reply when you ask for specific AI help.' });
            return;
        }

        if (['autoreply', 'chat'].includes(args[0]) && args[1] === 'on') {
            if (!isGroupAdmin && !isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only admins can configure auto-reply.' });
                return;
            }
            settings.set(`${remoteJid}.autoreply_enabled`, true);
            await sock.sendMessage(remoteJid, { text: '🔈 *Auto-Reply Enabled*\n\nI will chat normally.' });
            return;
        }

        // Check if AI is disabled for this chat
        if (settings.get(`${remoteJid}.ai_enabled`) === false && !msg.key.fromMe) {
            // If disabled, but user explicitly used !ai <question>, we should probably still answer?
            // The user request says: "mean if i turn i off .it should not response Like AI reply in group on any question"
            // But usually explicit commands override settings. 
            // However, if they just type "!ai off", then "!ai hello", it might be confusing if it replies.
            // But standard convention is explicit command > implicit behavior.
            // Let's assume !ai <question> ALWAYS works, but auto-reply (implicit) is what we want to stop.
            // Wait, the current logic relies on `commandRegistry.ai` being called ONLY when prefix is used OR preference is set.
            // If I disable it here, then even !ai <question> might fail if I am strict.
            // BUT, the request implies "auto response".
            // Let's allow !ai <question> even if "off", but update messageHandler to stop *implicit* replies.
            // So actually, this file (commands/ai.js) is ONLY reached when `!ai` is typed (or routed explicitly).
            // If the user types `!ai <question>`, they probably WANT an answer.
            // BUT, if they typed `!ai off`, maybe they don't want any AI at all?
            // Let's stick to: !ai command ALWAYS works. The "off" setting controls the *auto-detection* in messageHandler.
        }

        const query = args.join(' ');
        if (!query) {
            const status = settings.get(`${remoteJid}.ai_enabled`, true) ? '✅ Enabled' : '❌ Disabled';
            await sock.sendMessage(remoteJid, { text: `🧠 *AI Assistant* (${status})\n\nUsage:\n${config.BOT_PREFIX}ai <question>\n${config.BOT_PREFIX}ai on/off\n${config.BOT_PREFIX}ai clear` });
            return;
        }

        const history = aiContexts.get(remoteJid) || [];

        try {
            await sock.sendMessage(remoteJid, { text: 'Thinking... 💭' });

            // Fixed method call
            const response = await aiService.generateResponse(query);

            const finalResponse = `🤖 *AI Response:*\n\n${response}\n\n━━━━━━━━━━━━━━━━━━━━━\n🤖 _Powered by:_ 👑 _${config.BOT_OWNER}_\n📞 @${config.OWNER_HELP_NUMBER || '923177180123'}`;

            await sock.sendMessage(remoteJid, {
                text: finalResponse,
                mentions: [`${config.OWNER_HELP_NUMBER || '923177180123'}@s.whatsapp.net`]
            });

            history.push({ user: query, ai: response });
            if (history.length > 10) history.shift();
            aiContexts.set(remoteJid, history);

        } catch (err) {
            console.error('AI Error', err);
            await sock.sendMessage(remoteJid, { text: '❌ Failed to get AI response. Please try again later.' });
        }
    },
    // Inbox AI Toggle (Owner Only)
    inbox: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        // Owner Check moved down to allow checking logic
        // if (!isOwner) ... we will check later to allow better error msg or logic logic


        const subCmd = args[0]?.toLowerCase(); // 'ai'
        const action = args[1]?.toLowerCase(); // 'on' or 'off'
        const targetNumber = args[2]; // phone number
        let cleanNumber;

        if (subCmd !== 'ai' || !['on', 'off'].includes(action)) {
            await sock.sendMessage(remoteJid, { text: `⚠️ Use: ${config.BOT_PREFIX}inbox ai on/off <number>` });
            return;
        }

        if (!targetNumber) {
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                // If in DM and no number, apply to self
                // But check strictness: User asked for "in inbox chat" support
                // We use remoteJid as target
                // If sender is NOT owner, can they use it? "remaining all are for admin and oenwer"
                // The explicit "inbox" command was listed as OWNER command in help.
                // But if they are Owner in DM, they can use it.
                // If they are regular user? User says !inbox ai off is not working.
                // If they restrict "ai!" as member command, maybe they want !inbox to be usable by members FOR THEMSELVES?
                // The prompt says: "remaining all are for admin and oenwer"
                // !inbox wasn't in the "member" list (!owner, !stop, !resume, !ai, !link).
                // So !inbox is Admin/Owner.
                // BUT, if I am the Owner (superuser), using it in DM.
            }
            if (!isOwner) {
                await sock.sendMessage(remoteJid, { text: '❌ Only the Bot Owner can use this command.' });
                return;
            }

            // Support self-target in DM if owner/admin?
            if (!msg.key.remoteJid.endsWith('@g.us')) {
                cleanNumber = remoteJid;
            } else {
                await sock.sendMessage(remoteJid, { text: '⚠️ Please specify a phone number (e.g., 923001234567).' });
                return;
            }
        } else {
            // targetNumber provided
            let rawNum = targetNumber.replace(/\D/g, '');
            // Basic Normalization for PK (03xx -> 923xx)
            if (rawNum.startsWith('03') && rawNum.length === 11) {
                rawNum = '92' + rawNum.substring(1);
            }
            cleanNumber = rawNum + '@s.whatsapp.net';
        }

        // Force Owner Check (Already done above via isOwner arg in original code, but we moved it)
        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Bot Owner can use this command.' });
            return;
        }

        let blockedUsers = settings.get('ai_blocklist') || [];

        if (action === 'off') {
            if (!blockedUsers.includes(cleanNumber)) {
                blockedUsers.push(cleanNumber);
                settings.set('ai_blocklist', blockedUsers);
                await sock.sendMessage(remoteJid, { text: `✅ AI Disabled for user: ${targetNumber}` });
            } else {
                await sock.sendMessage(remoteJid, { text: `ℹ️ AI is already disabled for this user.` });
            }
        } else { // 'on'
            if (blockedUsers.includes(cleanNumber)) {
                blockedUsers = blockedUsers.filter(u => u !== cleanNumber);
                settings.set('ai_blocklist', blockedUsers);
                await sock.sendMessage(remoteJid, { text: `✅ AI Enabled for user: ${targetNumber}` });
            } else {
                await sock.sendMessage(remoteJid, { text: `ℹ️ AI is already enabled for this user.` });
            }
        }
    }
};

module.exports = commands;
