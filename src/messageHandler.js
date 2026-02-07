/**
 * Message Handler Module
 * Command processing, greeting detection, and message routing
 * Refactored for modularity
 */

const config = require('./config');
const logger = require('./logger');
const security = require('./security');
const fileManager = require('./fileManager');
const aiService = require('./aiService');

// Import Command Registry and Data Store
const commandRegistry = require('./commands');
const { settings, warnings, vip } = require('./dataStore');
const { activeSendings, continueFileSending, processFileSearch } = require('./commands/files');
const statsService = require('./statsService');

// ... (stats, getSenderId, isGroupAdmin, checkModeration from previous tool call) ...

// We only need to update the end of handleMessage where Subject Code Search is


// Statistics tracking (Moved to statsService)


/**
 * Get the actual sender ID from a message
 */
function getSenderId(msg) {
    return msg.key.participant || msg.key.remoteJid;
}

/**
 * Check if user is a WhatsApp group admin
 */
async function isGroupAdmin(sock, groupId, participantId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === participantId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        return false;
    }
}

/**
 * Moderation Checks
 * Returns true if message should be ignored/deleted
 */
async function checkModeration(sock, msg, remoteJid, senderId, isGroup, isAdmin) {
    if (!isGroup || isAdmin || security.isOwner(senderId)) return false;

    const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // 1. VIP Lock Check
    if (vip.get(`${remoteJid}.${senderId}.locked`)) {
        // Count messages? Or just delete?
        // Prompt says "3 msg ke baad auto-kick"
        const countKey = `${remoteJid}.${senderId}.lockCount`;
        const count = (vip.get(countKey) || 0) + 1;
        vip.set(countKey, count);

        if (count >= 3) {
            await sock.groupParticipantsUpdate(remoteJid, [senderId], 'remove');
            await sock.sendMessage(remoteJid, { text: `🚫 @${senderId.split('@')[0]} has been kicked due to chat lock.`, mentions: [senderId] });
            vip.delete(countKey); // Reset
            vip.set(`${remoteJid}.${senderId}.locked`, false); // Unlock?
            return true;
        }

        // Delete message if possible (admin only feature usually)
        if (messageContent) {
            await sock.sendMessage(remoteJid, { delete: msg.key });
        }
        return true;
    }

    // 2. Anti-Spam Check
    if (settings.get(`${remoteJid}.antispam`)) {
        // Simple duplicate message check
        // We need a memory store for last message to be effective
        // Using global spam tracker map (simple version)
        if (!global.spamTracker) global.spamTracker = new Map();

        const lastMsg = global.spamTracker.get(senderId);
        if (lastMsg && lastMsg.text === messageContent && Date.now() - lastMsg.time < 5000) {
            lastMsg.count++;
            if (lastMsg.count >= 3) {
                await sock.groupParticipantsUpdate(remoteJid, [senderId], 'remove');
                await sock.sendMessage(remoteJid, { text: `🚫 @${senderId.split('@')[0]} kicked for spamming.`, mentions: [senderId] });
                global.spamTracker.delete(senderId);
                return true;
            }
        } else {
            global.spamTracker.set(senderId, { text: messageContent, time: Date.now(), count: 1 });
        }
    }

    // 3. Anti-Link (Advanced)
    if (settings.get(`${remoteJid}.antilink`, config.FEATURE_LINK_MODERATION)) {
        const linkModerator = require('./linkModerator');
        const modResult = linkModerator.checkMessage(msg, messageContent, remoteJid, senderId);

        if (modResult.hasViolation) {
            // Delete message
            if (modResult.shouldDelete) {
                await sock.sendMessage(remoteJid, { delete: msg.key });
            }

            // Warn User
            if (modResult.shouldWarn) {
                const warningMsg = linkModerator.getFormattedWarning(senderId.split('@')[0], modResult);
                await sock.sendMessage(remoteJid, {
                    text: warningMsg,
                    mentions: [senderId]
                });
            }

            // Kick if needed
            if (modResult.shouldKick) {
                try {
                    await sock.groupParticipantsUpdate(remoteJid, [senderId], 'remove');
                    await sock.sendMessage(remoteJid, { text: `🚫 @${senderId.split('@')[0]} has been removed for repeated violations.`, mentions: [senderId] });
                    linkModerator.resetWarnings(remoteJid, senderId);
                } catch (e) {
                    await sock.sendMessage(remoteJid, { text: '❌ Failed to remove user. Please check my admin permissions.' });
                }
            }

            return true;
        }
    }

    // 4. Anti-Sticker
    if (settings.get(`${remoteJid}.antisticker`, config.FEATURE_ANTISTICKER)) { // Check Group Config
        if (msg.message && (msg.message.stickerMessage || (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stickerMessage))) {
            await sock.sendMessage(remoteJid, { delete: msg.key });
            // Optional: Warn user? Maybe too spammy for stickers. Just delete.
            // We can use a cooldown warning if needed.
            return true;
        }
    }

    return false;
}

/**
 * Main Message Handler
 */
// User preferences state
const userAIPreference = new Map(); // 'ai' | 'human' | null
const pendingAIChoice = new Map(); // true if waiting for choice

/**
 * Main Message Handler
 */
async function handleMessage(sock, msg) {
    if (!msg.message) return; // Ignore empty messages

    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.includes('@g.us');
    const senderId = getSenderId(msg);

    const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const cleanContent = messageContent.trim();

    // 1. Check for Commands
    // Support both config prefix (usually !) and dot (.)
    const isCommand = cleanContent.startsWith(config.BOT_PREFIX) || cleanContent.startsWith('.');


    statsService.incrementMessageCount();

    // Determine Admin Status
    let isAdmin = false;
    // Treat the Bot itself (fromMe) as an Owner
    let isOwner = security.isOwner(senderId) || msg.key.fromMe;

    if (isGroup) {
        isAdmin = await isGroupAdmin(sock, remoteJid, senderId);
    }

    // Run Moderation Checks
    // Skip moderation for Bot Owner / Self
    if (!isOwner && await checkModeration(sock, msg, remoteJid, senderId, isGroup, isAdmin)) {
        return;
    }

    if (isCommand) {
        // Remove prefix (1st character)
        const contentWithoutPrefix = cleanContent.substring(1).trim();
        const [cmd, ...args] = contentWithoutPrefix.split(/\s+/);
        const commandName = cmd.toLowerCase();

        if (commandRegistry[commandName]) {
            try {
                logger.info(`Executing command: ${commandName}`, { from: senderId, args: args });

                // Log command detailed
                statsService.logCommand(commandName, senderId, isGroup ? remoteJid : 'Private', args);

                await commandRegistry[commandName](sock, msg, args, isAdmin, isOwner);
            } catch (err) {
                logger.error(`Command error: ${commandName}`, err);
                await sock.sendMessage(remoteJid, { text: '❌ An error occurred while executing the command.' });
            }
            return;
        } else {
            logger.debug(`Command not found: ${commandName}`);
        }
    }

    // 2. Greeting & Type Handling (Restored Feature)

    // Check if waiting for choice
    if (pendingAIChoice.get(senderId)) {
        if (['1', 'ai', 'chatbot'].includes(cleanContent.toLowerCase())) {
            userAIPreference.set(senderId, 'ai');
            pendingAIChoice.delete(senderId);
            await sock.sendMessage(remoteJid, { text: '🤖 *AI Assistant Mode Activated*\n\nAsk me anything! Type `!ai <question>` or just chat.' });
            return;
        } else if (['2', 'human', 'admin'].includes(cleanContent.toLowerCase())) {
            userAIPreference.set(senderId, 'human');
            pendingAIChoice.delete(senderId);
            await sock.sendMessage(remoteJid, { text: '👤 *Human Admin Mode*\n\nI will stay quiet. Please wait for an admin to reply.' });
            return;
        }
    }

    // Check group-specific AI setting
    // Moved up to gate Greeting as well
    const isGroupAIEnabled = settings.get(`${remoteJid}.ai_enabled`, true);
    const isHandleGroupMode = settings.get(`${remoteJid}.auto_handle_group`, false);

    // 2. Greeting & Type Handling (Refined & Professional)
    const GREETING_PATTERNS = /^(hi|hello|hey|salam|assalam|aoa)$/i;

    // Check if waiting for choice
    if (pendingAIChoice.get(senderId)) {
        if (['1', 'ai', 'chatbot'].includes(cleanContent.toLowerCase())) {
            userAIPreference.set(senderId, 'ai');
            pendingAIChoice.delete(senderId);
            await sock.sendMessage(remoteJid, { text: '🤖 *AI Assistant Mode Activated*\n\nI am ready to help you with your queries.' });
            return;
        } else if (['2', 'human', 'admin'].includes(cleanContent.toLowerCase())) {
            userAIPreference.set(senderId, 'human');
            pendingAIChoice.delete(senderId);
            await sock.sendMessage(remoteJid, { text: '👤 *Human Admin Mode*\n\nI will remain silent. Please wait for an admin to respond.' });
            return;
        }
    }

    // Only show Greeting Menu if AI is ENABLED and NOT in Handle Group Mode
    // If AI is off, we stay silent.
    // If Handle Group Mode is on, we let the AI Persona handle the greeting naturally.
    /* Greeting Menu Disabled for Silence
    if (config.FEATURE_AI_ENABLED && isGroupAIEnabled && !isHandleGroupMode && GREETING_PATTERNS.test(cleanContent)) {
       // ... code ...
       return;
    }
    */

    // 3. Smart Search & Subject Code Detection

    // 3. Smart Search & Subject Code Detection
    // Detects: "CS101 files", "send mth101 notes", "mth302 handout", "cs101 past papers"
    // Also handles: "send all cs101 files", "cs101 active files"
    // Also handles: "send more", "more files", "aur bhejo"

    // Check for "More" request first
    // Enhanced detection for "more files", "send all", "all files", etc.
    if (/^(send )?(more|aur|next|baki|all|sab|sari)( files?)?$/i.test(cleanContent)) {
        await processFileSearch(sock, remoteJid, null, null, { more: true });
        return;
    }

    const SUBJECT_CODE_REGEX = /\b([A-Z]{2,4}\d{2,4})\b/i;
    // Keywords to confirm intent (must exist)
    const FILE_INTENT_KEYWORDS = /\b(file|files|note|notes|handout|handouts|paper|papers|quiz|assignment|gdb|solution|mid|final)\b/i;
    const DEMAND_KEYWORDS = /\b(send|give|want|need|chahiye|bhejo|share|upload|please|plz|kindly|me)\b/i;

    const subjectMatch = cleanContent.match(SUBJECT_CODE_REGEX);

    // Strict Search Logic:
    // 1. Short Message (< 10 words) + Code + (FileKeyword OR Just Code) -> Allow
    // 2. Long Message (> 10 words) + Code + FileKeyword + DemandKeyword -> Allow (Must explicitly ask)
    // 3. Forwarded messages often don't contain "send", so we skip them unless they are short.

    let isFileRequest = false;

    if (subjectMatch) {
        const wordCount = cleanContent.split(/\s+/).length;
        const hasFileKeywords = FILE_INTENT_KEYWORDS.test(cleanContent);
        const hasDemandKeywords = DEMAND_KEYWORDS.test(cleanContent);

        if (wordCount <= 10) {
            // Short: Allow if has file keywords OR is just the code (e.g. "cs101")
            isFileRequest = hasFileKeywords || wordCount <= 3;
        } else {
            // Long: MUST have file keywords AND explicit demand keywords (e.g. "please send notes")
            // This prevents "I am studying CS101 notes" from triggering.
            isFileRequest = hasFileKeywords && hasDemandKeywords;
        }
    }

    if (isFileRequest) {
        // Check both global and per-group file sharing setting
        const isFileSharingEnabled = settings.get(`${remoteJid}.filesharing`, config.FEATURE_FILE_SHARING);
        if (!isFileSharingEnabled) return;

        const subjectCode = subjectMatch[1].toUpperCase();

        // NOISE words to strip from the Search Query
        // We remove conversational stuff so we can find specific authors or topics
        const NOISE_REGEX = /\b(send|give|want|need|chahiye|bhejo|share|upload|please|plz|kindly|me|us|mujhe|hamen|sir|mam|bhai|admin|bot|yaar|help|urgent|asap|jhat|file|files|pdf|doc|link|notes|handout|handouts|paper|papers|sol|solution)\b/gi;

        // Extract usable keywords
        // 1. Remove Subject Code
        // 2. Remove Noise Words
        let keywords = cleanContent.replace(subjectMatch[0], '') // Remove Code
            .replace(NOISE_REGEX, '')     // Remove Noise
            .replace(/[^\w\s]/g, '')      // Remove special chars (optional, might kill hyphen names)
            .replace(/\s+/g, ' ')         // Collapse spaces
            .trim();

        // Check for "ALL" flag separately as before
        const isAll = /\b(all|sab|sari|everything|sara|sare|tamam)\b/i.test(cleanContent);
        // Remove 'all' from keywords too if present so it doesn't mess up search
        keywords = keywords.replace(/\b(all|sab|sari|everything|sara|sare|tamam)\b/gi, '').trim();

        logger.info(`File Search: Code=[${subjectCode}] Keywords=[${keywords}] Original=[${cleanContent}]`);

        await processFileSearch(sock, remoteJid, subjectCode, keywords, { limit: isAll ? 'all' : 10 });
        return;
    }

    // 4. AI Chat Routing & Special Responses
    if (config.FEATURE_AI_ENABLED) {

        // --- INBOX HANDLING ---
        if (!isGroup) {
            // Check Global Blocklist (unified approach with !inbox command)
            const blockedUsers = settings.get('ai_blocklist') || [];
            if (blockedUsers.includes(senderId)) {
                return; // Complete silence for blocked users
            }

            // Proceed with AI for Inbox
            try {
                // Use a more casual system instruction for DM
                const dmInstruction = "You are a helpful assistant. Chat normally and strictly. Be brief.";
                const response = await aiService.generateResponse(cleanContent, dmInstruction);
                if (response) {
                    await sock.sendMessage(remoteJid, { text: response });
                }
            } catch (e) {
                logger.error('Inbox AI failed', e);
            }
            return;
        }

        // --- GROUP HANDLING ---
        const isHandleGroupMode = settings.get(`${remoteJid}.auto_handle_group`, false);

        // --- EXCEPTION: PAID SERVICES / LMS HANDLING ---
        // This triggers EVEN IF group mode is OFF.
        // Keywords: paid assignment, lms handling, quiz paid, paid work, assignment paid
        const isPaidRequest = /\b(paid|lms)\b/i.test(cleanContent) &&
            /\b(assignment|handling|handle|quiz|gdb|work|mid|final|project)\b/i.test(cleanContent);

        if (isPaidRequest) {
            const paidMsg = `╔══════════════════════════════╗
║   🎓 *ACADEMIC SERVICES*    ║
╚══════════════════════════════╝

✅ *Paid Services Available!*
We handle LMS, Assignments, Quizzes, and Projects with guaranteed results. 💯

━━━━━━━━━━━━━━━━━━━━━
📞 _Contact for Deal:_
👤 *𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.*
🔗 *wa.me/${config.OWNER_HELP_NUMBER || '923177180123'}*`;

            await sock.sendMessage(remoteJid, { text: paidMsg });
            return;
        }

        // --- EXCEPTION: ADMIN CONTACT REQUEST ---
        // This triggers EVEN IF group mode is OFF.
        if (/\b(admin|owner|contact|number|num|mobile|whatsapp)\b/i.test(cleanContent) &&
            /\b(give|send|chahiye|need|talk|bat|rabta)\b/i.test(cleanContent)) {

            const contactMsg = `╔══════════════════════════════╗
║  🤖 *${config.BOT_NAME}*  ║
╚══════════════════════════════╝

📚 Virtual University exam! Need help with a subject or want to discuss a topic? 🤔

━━━━━━━━━━━━━━━━━━━━━
📞 _Need human help? Contact:_
👤 *𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.*
🔗 *wa.me/${config.OWNER_HELP_NUMBER || '923177180123'}*`;

            await sock.sendMessage(remoteJid, {
                text: contactMsg
                // No mentions here to avoid tagging
            });
            return;
        }

        // If Group Mode is OFF, and it wasn't a paid request or admin contact, we stay silent.
        if (!isHandleGroupMode) {
            return;
        }

        // --- Handle Group Mode Activity (Auto-Admin) ---
        // (Removed duplicate Contact Request block)

        // If defined, proceed with AI
        const systemInstruction = "You are a polite and helpful group admin named 'HSM Bot'. Your job is to handle the group professionally. Answer questions, calm down arguments, and be helpful. If you don't know something, suggest asking the main admin '𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑.' Be brief and human-like.";

        try {
            const response = await aiService.generateResponse(cleanContent, systemInstruction);
            if (response) {
                // Formatting response
                const finalResponse = `${response}`;
                await sock.sendMessage(remoteJid, {
                    text: finalResponse
                });
            }
        } catch (e) {
            logger.error('Auto AI failed', e);
        }
    }
}

// Helper to get stats safely
function getStats() {
    return statsService.getStats();
}

module.exports = {
    handleMessage,
    getStats
};
