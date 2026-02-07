/**
 * Special Commands
 * Easter eggs and Sudo Owner commands.
 */

const { security } = require('../security');
const config = require('../config');

// Cache for group indices: { 1: "jid1", 2: "jid2" }
let groupIndexCache = {};

const commands = {
    jin: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: `❌ *Security Alert*: Only the Great *${config.BOT_OWNER}* can summon the Jin!` });
            return;
        }

        await sock.sendMessage(remoteJid, {
            text: `🧞‍♂️ *AAQA, Main Hazir Hun!* 🧞‍♂️\n\n(Master, I am here!)\n\n_What is your command, my Lord?_`
        });
    },

    // List Active Groups with Index
    active: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Owner can view active groups.' });
            return;
        }

        try {
            // Fetch all groups
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);

            if (groupList.length === 0) {
                await sock.sendMessage(remoteJid, { text: 'ℹ️ No active groups found.' });
                return;
            }

            // Sort by name for consistency
            groupList.sort((a, b) => a.subject.localeCompare(b.subject));

            // Build list and Update Cache
            groupIndexCache = {}; // Reset cache
            let text = `📋 *Active Groups List*\n\n`;

            groupList.forEach((g, index) => {
                const srNo = index + 1;
                groupIndexCache[srNo] = g.id;
                text += `${srNo}. ${g.subject}\n`;
            });

            text += `\nUsage: ${config.BOT_PREFIX}remote <SR_NO> <COMMAND>\nExample: ${config.BOT_PREFIX}remote 1 ${config.BOT_PREFIX}open`;

            await sock.sendMessage(remoteJid, { text: text });

        } catch (err) {
            console.error('Failed to fetch groups', err);
            await sock.sendMessage(remoteJid, { text: '❌ Failed to fetch active groups.' });
        }
    },

    // Remote Control Command
    remote: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Owner can use remote control.' });
            return;
        }

        if (args.length < 2) {
            await sock.sendMessage(remoteJid, { text: `⚠️ Usage: ${config.BOT_PREFIX}remote <SR_NO | PHONE> <COMMAND>` });
            return;
        }

        const target = args[0];
        const commandToRun = args.slice(1).join(' '); // Reconstruct command
        let targetJid;

        // 1. Check if Target is an Index (1, 2, 3...)
        if (/^\d{1,3}$/.test(target)) {
            const index = parseInt(target);
            if (groupIndexCache[index]) {
                targetJid = groupIndexCache[index];
            } else {
                await sock.sendMessage(remoteJid, { text: `❌ Invalid Index "${index}". Run ${config.BOT_PREFIX}active first.` });
                return;
            }
        }
        // 2. Check if Target is a Phone Number (for Inbox)
        else if (/^\d{10,15}$/.test(target)) {
            let cleanNum = target.replace(/\D/g, '');
            // Basic Normalization for PK (03xx -> 923xx)
            if (cleanNum.startsWith('03') && cleanNum.length === 11) {
                cleanNum = '92' + cleanNum.substring(1);
            }
            targetJid = cleanNum + '@s.whatsapp.net';
        }
        // 3. Fallback: Assume it's a raw JID? (Optional, maybe risky)
        else {
            await sock.sendMessage(remoteJid, { text: '❌ Invalid Target. Use SR No (from !active) or Phone Number.' });
            return;
        }

        // --- EXECUTE COMMAND ON TARGET ---
        try {
            await sock.sendMessage(remoteJid, { text: `🔄 Executing on target...` });

            // Construct a Fake Message Object
            const fakeMsg = {
                key: {
                    remoteJid: targetJid,
                    fromMe: true, // Pretend it's from bot/owner
                    id: 'REMOTE-' + Date.now(),
                    participant: undefined // or owner's ID
                },
                message: {
                    conversation: commandToRun
                },
                pushName: config.BOT_OWNER
            };

            // Parse command name
            const cleanContent = commandToRun.trim();
            if (!cleanContent.startsWith(config.BOT_PREFIX) && !cleanContent.startsWith('.')) {
                await sock.sendMessage(remoteJid, { text: '⚠️ Command must start with prefix.' });
                return;
            }

            const contentWithoutPrefix = cleanContent.substring(1).trim();
            const [cmdName, ...cmdArgs] = contentWithoutPrefix.split(/\s+/);

            const commandRegistry = require('./index'); // access the registry

            if (commandRegistry[cmdName]) {
                // Execute with FORCE OWNER permissions
                await commandRegistry[cmdName](sock, fakeMsg, cmdArgs, true, true);
                await sock.sendMessage(remoteJid, { text: `✅ Command "${cmdName}" call sent to ${targetJid}` });
            } else {
                await sock.sendMessage(remoteJid, { text: `❌ Command "${cmdName}" not found.` });
            }

        } catch (err) {
            console.error('Remote execution failed', err);
            await sock.sendMessage(remoteJid, { text: '❌ Remote execution failed.' });
        }
    },

    // Broadcast Command (Enhanced with Message Forwarding)
    broadcast: async (sock, msg, args, isGroupAdmin, isOwner) => {
        const remoteJid = msg.key.remoteJid;

        if (!isOwner) {
            await sock.sendMessage(remoteJid, { text: '❌ Only the Owner can use broadcast.' });
            return;
        }

        // Check if this is a reply to a message (for forwarding)
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isReply = !!quotedMessage;

        if (!isReply && args.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ *Broadcast Usage:*\n\n*Text Broadcast:*\n${config.BOT_PREFIX}broadcast <message>\n\n*Forward Broadcast:*\nReply to any message with ${config.BOT_PREFIX}broadcast\n\n*Example:*\n${config.BOT_PREFIX}broadcast Important announcement!`
            });
            return;
        }

        try {
            // Fetch all groups
            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);

            if (groupList.length === 0) {
                await sock.sendMessage(remoteJid, { text: '❌ No active groups found to broadcast to.' });
                return;
            }

            let successCount = 0;
            let failCount = 0;

            if (isReply) {
                // FORWARD MODE: Forward the replied message
                await sock.sendMessage(remoteJid, { text: `📡 Broadcasting message to ${groupList.length} groups...` });

                for (const group of groupList) {
                    try {
                        // Forward the quoted message
                        await sock.sendMessage(group.id, { forward: msg.message.extendedTextMessage.contextInfo });
                        successCount++;
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (err) {
                        console.error(`Failed to broadcast to ${group.subject}:`, err);
                        failCount++;
                    }
                }
            } else {
                // TEXT MODE: Send custom text message
                const broadcastMessage = args.join(' ');
                await sock.sendMessage(remoteJid, { text: `📡 Broadcasting to ${groupList.length} groups...\n\n_"${broadcastMessage}"_` });

                for (const group of groupList) {
                    try {
                        await sock.sendMessage(group.id, {
                            text: `📢 *Broadcast Message*\n\n${broadcastMessage}\n\n━━━━━━━━━━━━━━━━\n_From: 𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑._`
                        });
                        successCount++;
                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (err) {
                        console.error(`Failed to broadcast to ${group.subject}:`, err);
                        failCount++;
                    }
                }
            }

            await sock.sendMessage(remoteJid, {
                text: `✅ *Broadcast Complete*\n\n✓ Sent: ${successCount}\n✗ Failed: ${failCount}\n📊 Total: ${groupList.length}`
            });

        } catch (err) {
            console.error('Broadcast failed', err);
            await sock.sendMessage(remoteJid, { text: '❌ Broadcast failed.' });
        }
    }
};

module.exports = commands;

