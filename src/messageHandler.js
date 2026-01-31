/**
 * Message Handler Module
 * Command processing, greeting detection, and message routing
 */

const config = require('./config');
const logger = require('./logger');
const security = require('./security');
const fileManager = require('./fileManager');
const aiService = require('./aiService');
const linkModerator = require('./linkModerator');

// Statistics tracking
const stats = {
    messagesReceived: 0,
    commandsExecuted: 0,
    errors: 0,
    recentCommands: [],
    recentErrors: [],
    startTime: Date.now()
};

// Muted users storage: { groupId: { participantId: muteEndTime } }
const mutedUsers = new Map();

// Warnings storage: { groupId: { participantId: warningCount } }
const warnings = new Map();

// Spam tracking: { participantId: { lastMessage: string, count: number, timestamp: number } }
const spamTracker = new Map();

// Group rules storage: { groupId: rulesText }
const groupRules = new Map();

/**
 * Get the actual sender ID from a message
 * In groups, participant is the sender. In private chats, remoteJid is the sender.
 */
function getSenderId(msg) {
    return msg.key.participant || msg.key.remoteJid;
}

/**
 * Check if user is a WhatsApp group admin
 * @param {Object} sock - WhatsApp socket
 * @param {string} groupId - Group JID
 * @param {string} participantId - Participant JID
 * @returns {Promise<boolean>} True if user is group admin
 */
async function isGroupAdmin(sock, groupId, participantId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === participantId);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (err) {
        logger.error('Failed to check group admin status', err);
        return false;
    }
}

/**
 * Check if user can use group management commands (bot owner OR WhatsApp group admin)
 * @param {Object} sock - WhatsApp socket
 * @param {Object} msg - Message object
 * @returns {Promise<boolean>}
 */
async function canManageGroup(sock, msg) {
    const senderId = getSenderId(msg);
    const groupId = msg.key.remoteJid;

    // Bot owner can always manage
    if (security.isOwner(senderId)) {
        return true;
    }

    // Check if WhatsApp group admin
    if (groupId.includes('@g.us')) {
        return await isGroupAdmin(sock, groupId, senderId);
    }

    return false;
}

/**
 * Greeting patterns for multiple languages
 */
const GREETING_PATTERNS = [
    // English
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)$/i,
    // Urdu/Hindi
    /^(assalam|salam|salaam|aoa|السلام|السلام عليكم)$/i,
    // Arabic
    /^(مرحبا|أهلا|السلام عليكم)$/i,
    // General
    /^(hola|bonjour|namaste|namaskar)$/i
];

/**
 * VU Subject Code pattern - matches codes like CS101, ENG201, MTH302, PHY101, etc.
 * Format: 2-4 letters followed by 2-4 digits, optionally followed by "files" or "file"
 */
const SUBJECT_CODE_PATTERN = /^([A-Z]{2,4}\d{2,4})\s*(files?)?$/i;

/**
 * Check if message is a greeting
 * @param {string} message - Message text
 * @returns {boolean} True if greeting
 */
function isGreeting(message) {
    const trimmed = message.trim();
    return GREETING_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Extract VU subject code from message if present
 * @param {string} message - Message text
 * @returns {string|null} Subject code or null
 */
function extractSubjectCode(message) {
    const trimmed = message.trim();
    const match = trimmed.match(SUBJECT_CODE_PATTERN);
    if (match) {
        return match[1].toUpperCase();
    }
    return null;
}


/**
 * Get uptime string
 * @returns {string} Formatted uptime
 */
function getUptime() {
    const uptimeMs = Date.now() - stats.startTime;
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const seconds = Math.floor((uptimeMs % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Command handlers
 */
const commands = {
    /**
     * Help command - Show all available commands
     */
    help: async (sock, msg) => {
        const isUserAdmin = security.isAdmin(getSenderId(msg));

        let helpText = `🤖 *${config.BOT_NAME} v${config.BOT_VERSION}*\n\n`;
        helpText += `📋 *Available Commands:*\n\n`;
        helpText += `${config.BOT_PREFIX}help - Show this help message\n`;
        helpText += `${config.BOT_PREFIX}status - Check bot status\n`;
        helpText += `${config.BOT_PREFIX}ping - Test bot responsiveness\n`;

        if (config.FEATURE_FILE_SHARING) {
            helpText += `${config.BOT_PREFIX}files - List available files\n`;
        }

        helpText += `${config.BOT_PREFIX}contact - Contact information\n`;
        helpText += `${config.BOT_PREFIX}paid - Paid services info\n`;

        if (config.FEATURE_AI_ENABLED) {
            helpText += `\n🤖 *AI:* Ask any question and get instant answers!\n`;
        }

        if (isUserAdmin) {
            helpText += `\n👑 *Admin Commands:*\n\n`;
            helpText += `${config.BOT_PREFIX}tagall - Tag all group members\n`;
            helpText += `${config.BOT_PREFIX}open - Open group (all can chat)\n`;
            helpText += `${config.BOT_PREFIX}close - Close group (admins only)\n`;
            helpText += `${config.BOT_PREFIX}kick @user - Remove member\n`;
            helpText += `${config.BOT_PREFIX}mute @user [mins] - Mute member\n`;
            helpText += `${config.BOT_PREFIX}toggle [feature] - Toggle features\n`;
            helpText += `${config.BOT_PREFIX}block [number] - Block a user\n`;
            helpText += `${config.BOT_PREFIX}unblock [number] - Unblock a user\n\n`;
        }

        helpText += `_Type any greeting to get a friendly response!_`;

        await sock.sendMessage(msg.key.remoteJid, { text: helpText });
    },

    /**
     * Status command - Show bot status
     */
    status: async (sock, msg) => {
        const uptime = getUptime();
        const fileCount = fileManager.getFileCount();

        let statusText = `📊 *Bot Status*\n\n`;
        statusText += `⏰ Uptime: ${uptime}\n`;
        statusText += `📨 Messages Received: ${stats.messagesReceived}\n`;
        statusText += `⚡ Commands Executed: ${stats.commandsExecuted}\n`;
        statusText += `📁 Files Available: ${fileCount}\n`;
        statusText += `❌ Errors: ${stats.errors}\n\n`;
        statusText += `🔧 *Features:*\n`;
        statusText += `Bot: ${config.FEATURE_BOT_ENABLED ? '✅' : '❌'}\n`;
        statusText += `Auto Reply: ${config.FEATURE_AUTO_REPLY ? '✅' : '❌'}\n`;
        statusText += `File Sharing: ${config.FEATURE_FILE_SHARING ? '✅' : '❌'}\n`;
        statusText += `Email Reports: ${config.FEATURE_EMAIL_REPORTS ? '✅' : '❌'}\n`;
        statusText += `Welcome Messages: ${config.FEATURE_WELCOME_MESSAGE ? '✅' : '❌'}\n`;

        await sock.sendMessage(msg.key.remoteJid, { text: statusText });
    },

    /**
     * Ping command - Test responsiveness
     */
    ping: async (sock, msg) => {
        await sock.sendMessage(msg.key.remoteJid, { text: '🏓 Pong!' });
    },

    /**
     * Files command - List available files
     */
    files: async (sock, msg) => {
        if (!config.FEATURE_FILE_SHARING) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ File sharing is currently disabled.' });
            return;
        }

        const fileList = fileManager.getFormattedFileList();
        await sock.sendMessage(msg.key.remoteJid, { text: fileList });
    },

    /**
     * Contact command - Show contact information
     */
    contact: async (sock, msg) => {
        let contactText = `📞 *Contact Information*\n\n`;

        if (config.CONTACT_EMAIL) {
            contactText += `📧 Email: ${config.CONTACT_EMAIL}\n`;
        }
        if (config.CONTACT_PHONE) {
            contactText += `📱 Phone: ${config.CONTACT_PHONE}\n`;
        }
        if (config.CONTACT_WEBSITE) {
            contactText += `🌐 Website: ${config.CONTACT_WEBSITE}\n`;
        }

        if (!config.CONTACT_EMAIL && !config.CONTACT_PHONE && !config.CONTACT_WEBSITE) {
            contactText += `_No contact information configured_\n`;
        }

        contactText += `\n_Managed by ${config.BOT_OWNER}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: contactText });
    },

    /**
     * Paid command - Show paid services info
     */
    paid: async (sock, msg) => {
        let paidText = `💎 *Paid Services*\n\n`;

        if (config.PAID_SERVICES_INFO) {
            paidText += config.PAID_SERVICES_INFO + '\n\n';
        } else {
            paidText += `_No paid services information configured_\n\n`;
        }

        paidText += `For more information, use ${config.BOT_PREFIX}contact`;

        await sock.sendMessage(msg.key.remoteJid, { text: paidText });
    },

    /**
     * Toggle command - Toggle bot features (admin only)
     */
    toggle: async (sock, msg, args) => {
        if (!security.isOwner(getSenderId(msg))) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ This command is for bot owner only.' });
            return;
        }

        if (!args || args.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `Usage: ${config.BOT_PREFIX}toggle [feature]\n\nFeatures: bot, auto_reply, file_sharing, email_reports, welcome`
            });
            return;
        }

        const feature = args[0].toLowerCase();
        let toggleText = '';

        switch (feature) {
            case 'bot':
                config.FEATURE_BOT_ENABLED = !config.FEATURE_BOT_ENABLED;
                toggleText = `Bot is now ${config.FEATURE_BOT_ENABLED ? 'ENABLED ✅' : 'DISABLED ❌'}`;
                break;
            case 'auto_reply':
                config.FEATURE_AUTO_REPLY = !config.FEATURE_AUTO_REPLY;
                toggleText = `Auto Reply is now ${config.FEATURE_AUTO_REPLY ? 'ENABLED ✅' : 'DISABLED ❌'}`;
                break;
            case 'file_sharing':
                config.FEATURE_FILE_SHARING = !config.FEATURE_FILE_SHARING;
                toggleText = `File Sharing is now ${config.FEATURE_FILE_SHARING ? 'ENABLED ✅' : 'DISABLED ❌'}`;
                break;
            case 'email_reports':
                config.FEATURE_EMAIL_REPORTS = !config.FEATURE_EMAIL_REPORTS;
                toggleText = `Email Reports are now ${config.FEATURE_EMAIL_REPORTS ? 'ENABLED ✅' : 'DISABLED ❌'}`;
                break;
            case 'welcome':
                config.FEATURE_WELCOME_MESSAGE = !config.FEATURE_WELCOME_MESSAGE;
                toggleText = `Welcome Messages are now ${config.FEATURE_WELCOME_MESSAGE ? 'ENABLED ✅' : 'DISABLED ❌'}`;
                break;
            default:
                toggleText = `❌ Unknown feature: ${feature}\n\nAvailable: bot, auto_reply, file_sharing, email_reports, welcome`;
        }

        await sock.sendMessage(msg.key.remoteJid, { text: toggleText });
    },

    /**
     * Block command - Block a user (admin only)
     */
    block: async (sock, msg, args) => {
        if (!security.isAdmin(getSenderId(msg))) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ This command is admin only.' });
            return;
        }

        if (!args || args.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Usage: ${config.BOT_PREFIX}block [phone_number]` });
            return;
        }

        const userNumber = args[0].replace(/[^\d]/g, '');
        security.blockUser(userNumber + '@s.whatsapp.net');

        await sock.sendMessage(msg.key.remoteJid, { text: `✅ User ${userNumber} has been blocked.` });
    },

    /**
     * Unblock command - Unblock a user (admin only)
     */
    unblock: async (sock, msg, args) => {
        if (!security.isAdmin(getSenderId(msg))) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ This command is admin only.' });
            return;
        }

        if (!args || args.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: `Usage: ${config.BOT_PREFIX}unblock [phone_number]` });
            return;
        }

        const userNumber = args[0].replace(/[^\d]/g, '');
        security.unblockUser(userNumber + '@s.whatsapp.net');

        await sock.sendMessage(msg.key.remoteJid, { text: `✅ User ${userNumber} has been unblocked.` });
    },

    /**
     * Tag all command - Tag all group members (admin only)
     */
    tagall: async (sock, msg, args) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if admin
        if (!security.isAdmin(msg.key.participant || senderId)) {
            await sock.sendMessage(senderId, { text: '❌ This command is admin only.' });
            return;
        }

        try {
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(senderId);
            const participants = groupMetadata.participants;

            if (participants.length === 0) {
                await sock.sendMessage(senderId, { text: '❌ No members found in this group.' });
                return;
            }

            // Create mentions array
            const mentions = participants.map(p => p.id);

            // Create message with custom text or default
            const customMessage = args.length > 0 ? args.join(' ') : '📢 Attention everyone!';

            // Create mention text
            let mentionText = `${customMessage}\n\n`;
            participants.forEach(p => {
                mentionText += `@${p.id.split('@')[0]} `;
            });

            await sock.sendMessage(senderId, {
                text: mentionText.trim(),
                mentions: mentions
            });

            logger.info('Tag all executed', { group: senderId, count: participants.length });
        } catch (err) {
            logger.error('Failed to tag all', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to tag members. Please try again.' });
        }
    },

    /**
     * Open command - Allow all members to send messages (admin only)
     */
    open: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if user can manage group (bot owner OR WhatsApp group admin)
        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        try {
            await sock.groupSettingUpdate(senderId, 'not_announcement');
            await sock.sendMessage(senderId, { text: '🔓 Group is now OPEN. All members can send messages.' });
            logger.info('Group opened', { group: senderId });
        } catch (err) {
            logger.error('Failed to open group', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to open group. Bot may not be an admin.' });
        }
    },

    /**
     * Close command - Only admins can send messages (admin only)
     */
    close: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if user can manage group (bot owner OR WhatsApp group admin)
        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        try {
            await sock.groupSettingUpdate(senderId, 'announcement');
            await sock.sendMessage(senderId, { text: '🔒 Group is now CLOSED. Only admins can send messages.' });
            logger.info('Group closed', { group: senderId });
        } catch (err) {
            logger.error('Failed to close group', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to close group. Bot may not be an admin.' });
        }
    },

    /**
     * Kick command - Remove a member from the group (admin only)
     */
    kick: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if user can manage group (bot owner OR WhatsApp group admin)
        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        // Get mentioned users
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to kick.\nUsage: ${config.BOT_PREFIX}kick @user` });
            return;
        }

        try {
            for (const userJid of mentionedJid) {
                await sock.groupParticipantsUpdate(senderId, [userJid], 'remove');
                const userNum = userJid.split('@')[0];
                await sock.sendMessage(senderId, { text: `👢 User @${userNum} has been removed from the group.`, mentions: [userJid] });
                logger.info('User kicked', { user: userJid, group: senderId });
            }
        } catch (err) {
            logger.error('Failed to kick user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to kick user. Bot may not be an admin.' });
        }
    },

    /**
     * Mute command - Mute a member for specified duration (admin only)
     */
    mute: async (sock, msg, args) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if user can manage group (bot owner OR WhatsApp group admin)
        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        // Get mentioned users
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to mute.\nUsage: ${config.BOT_PREFIX}mute @user [minutes]` });
            return;
        }

        // Parse duration (default 10 minutes)
        let durationMinutes = 10;
        const durationArg = args.find(arg => !isNaN(parseInt(arg)));
        if (durationArg) {
            durationMinutes = Math.min(Math.max(parseInt(durationArg), 1), 1440); // 1 min to 24 hours
        }

        const muteEndTime = Date.now() + (durationMinutes * 60 * 1000);

        // Initialize group mute map if needed
        if (!mutedUsers.has(senderId)) {
            mutedUsers.set(senderId, new Map());
        }

        try {
            for (const userJid of mentionedJid) {
                mutedUsers.get(senderId).set(userJid, muteEndTime);
                const userNum = userJid.split('@')[0];
                await sock.sendMessage(senderId, {
                    text: `🔇 @${userNum} has been muted for ${durationMinutes} minute(s).\nMuted messages will be deleted.`,
                    mentions: [userJid]
                });
                logger.info('User muted', { user: userJid, group: senderId, duration: durationMinutes });
            }
        } catch (err) {
            logger.error('Failed to mute user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to mute user.' });
        }
    },

    /**
     * Unmute command - Unmute a muted member (admin only)
     */
    unmute: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        // Only works in groups
        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        // Check if user can manage group (bot owner OR WhatsApp group admin)
        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        // Get mentioned users
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to unmute.\nUsage: ${config.BOT_PREFIX}unmute @user` });
            return;
        }

        if (!mutedUsers.has(senderId)) {
            await sock.sendMessage(senderId, { text: '❌ No muted users in this group.' });
            return;
        }

        try {
            for (const userJid of mentionedJid) {
                if (mutedUsers.get(senderId).has(userJid)) {
                    mutedUsers.get(senderId).delete(userJid);
                    const userNum = userJid.split('@')[0];
                    await sock.sendMessage(senderId, {
                        text: `🔊 @${userNum} has been unmuted.`,
                        mentions: [userJid]
                    });
                    logger.info('User unmuted', { user: userJid, group: senderId });
                }
            }
        } catch (err) {
            logger.error('Failed to unmute user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to unmute user.' });
        }
    },

    /**
     * Warn command - Warn a user (3 warnings = auto kick)
     */
    warn: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to warn.\nUsage: ${config.BOT_PREFIX}warn @user` });
            return;
        }

        if (!warnings.has(senderId)) {
            warnings.set(senderId, new Map());
        }

        try {
            for (const userJid of mentionedJid) {
                const currentWarns = (warnings.get(senderId).get(userJid) || 0) + 1;
                warnings.get(senderId).set(userJid, currentWarns);
                const userNum = userJid.split('@')[0];

                if (currentWarns >= 3) {
                    await sock.groupParticipantsUpdate(senderId, [userJid], 'remove');
                    warnings.get(senderId).delete(userJid);
                    await sock.sendMessage(senderId, {
                        text: `🚨 @${userNum} has been KICKED for reaching 3 warnings!`,
                        mentions: [userJid]
                    });
                    logger.info('User auto-kicked for warnings', { user: userJid, group: senderId });
                } else {
                    await sock.sendMessage(senderId, {
                        text: `⚠️ @${userNum} has been warned!\n\n*Warnings: ${currentWarns}/3*\n\n_3 warnings = automatic kick!_`,
                        mentions: [userJid]
                    });
                    logger.info('User warned', { user: userJid, warnings: currentWarns, group: senderId });
                }
            }
        } catch (err) {
            logger.error('Failed to warn user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to warn user.' });
        }
    },

    /**
     * Reset warnings command
     */
    resetwarn: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user.\nUsage: ${config.BOT_PREFIX}resetwarn @user` });
            return;
        }

        if (!warnings.has(senderId)) {
            await sock.sendMessage(senderId, { text: '❌ No warnings recorded for this group.' });
            return;
        }

        for (const userJid of mentionedJid) {
            warnings.get(senderId).delete(userJid);
            const userNum = userJid.split('@')[0];
            await sock.sendMessage(senderId, {
                text: `✅ Warnings reset for @${userNum}`,
                mentions: [userJid]
            });
        }
    },

    /**
     * Promote command - Make user a group admin
     */
    promote: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to promote.\nUsage: ${config.BOT_PREFIX}promote @user` });
            return;
        }

        try {
            for (const userJid of mentionedJid) {
                await sock.groupParticipantsUpdate(senderId, [userJid], 'promote');
                const userNum = userJid.split('@')[0];
                await sock.sendMessage(senderId, {
                    text: `👑 @${userNum} is now a group admin!`,
                    mentions: [userJid]
                });
                logger.info('User promoted', { user: userJid, group: senderId });
            }
        } catch (err) {
            logger.error('Failed to promote user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to promote. Bot may not be a group admin.' });
        }
    },

    /**
     * Demote command - Remove admin from user
     */
    demote: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        if (!(await canManageGroup(sock, msg))) {
            await sock.sendMessage(senderId, { text: '❌ This command requires group admin rights.' });
            return;
        }

        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJid.length === 0) {
            await sock.sendMessage(senderId, { text: `❌ Please mention the user to demote.\nUsage: ${config.BOT_PREFIX}demote @user` });
            return;
        }

        try {
            for (const userJid of mentionedJid) {
                await sock.groupParticipantsUpdate(senderId, [userJid], 'demote');
                const userNum = userJid.split('@')[0];
                await sock.sendMessage(senderId, {
                    text: `📉 @${userNum} is no longer a group admin.`,
                    mentions: [userJid]
                });
                logger.info('User demoted', { user: userJid, group: senderId });
            }
        } catch (err) {
            logger.error('Failed to demote user', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to demote. Bot may not be a group admin.' });
        }
    },

    /**
     * Group info command
     */
    groupinfo: async (sock, msg) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        try {
            const metadata = await sock.groupMetadata(senderId);
            const admins = metadata.participants.filter(p => p.admin).length;
            const members = metadata.participants.length;
            const created = new Date(metadata.creation * 1000).toLocaleDateString();

            let info = `📊 *GROUP INFO*\n`;
            info += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            info += `📛 *Name:* ${metadata.subject}\n`;
            info += `📝 *Description:*\n${metadata.desc || '_No description_'}\n\n`;
            info += `👥 *Members:* ${members}\n`;
            info += `👑 *Admins:* ${admins}\n`;
            info += `📅 *Created:* ${created}\n`;
            info += `🆔 *ID:* ${senderId}\n`;
            info += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
            info += `_Powered by ${config.BOT_NAME}_ 🤖`;

            await sock.sendMessage(senderId, { text: info });
        } catch (err) {
            logger.error('Failed to get group info', err);
            await sock.sendMessage(senderId, { text: '❌ Failed to get group info.' });
        }
    },

    /**
     * Rules command - Show/set group rules
     */
    rules: async (sock, msg, args) => {
        const senderId = msg.key.remoteJid;

        if (!senderId.includes('@g.us')) {
            await sock.sendMessage(senderId, { text: '❌ This command only works in groups.' });
            return;
        }

        if (args.length > 0 && args[0] === 'set') {
            if (!(await canManageGroup(sock, msg))) {
                await sock.sendMessage(senderId, { text: '❌ Only admins can set rules.' });
                return;
            }
            const rulesText = args.slice(1).join(' ');
            if (!rulesText) {
                await sock.sendMessage(senderId, { text: `❌ Usage: ${config.BOT_PREFIX}rules set [your rules]` });
                return;
            }
            groupRules.set(senderId, rulesText);
            await sock.sendMessage(senderId, { text: '✅ Group rules have been updated!' });
            return;
        }

        const rules = groupRules.get(senderId);
        if (rules) {
            await sock.sendMessage(senderId, {
                text: `📜 *GROUP RULES*\n━━━━━━━━━━━━━━━━━━━━━\n\n${rules}\n\n━━━━━━━━━━━━━━━━━━━━━\n_Respect the rules or face consequences!_`
            });
        } else {
            await sock.sendMessage(senderId, {
                text: `📜 *DEFAULT RULES*\n━━━━━━━━━━━━━━━━━━━━━\n\n1️⃣ Be respectful to everyone\n2️⃣ No spam or flooding\n3️⃣ No adult/offensive content\n4️⃣ No promotional links\n5️⃣ Stay on topic\n\n━━━━━━━━━━━━━━━━━━━━━\n_Admins can set custom rules with ${config.BOT_PREFIX}rules set [text]_`
            });
        }
    },

    /**
     * Report command - Report issues to bot owner
     */
    report: async (sock, msg, args) => {
        if (args.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Usage: ${config.BOT_PREFIX}report [your message]` });
            return;
        }

        const reportText = args.join(' ');
        const reporterNumber = getSenderId(msg).split('@')[0];
        const groupId = msg.key.remoteJid;

        // Send to all bot owners
        for (const ownerNumber of config.adminNumbers) {
            try {
                const ownerJid = ownerNumber + '@s.whatsapp.net';
                let reportMsg = `📬 *NEW REPORT*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
                reportMsg += `👤 *From:* ${reporterNumber}\n`;
                reportMsg += `💬 *Message:*\n${reportText}\n`;
                reportMsg += groupId.includes('@g.us') ? `\n📍 *Group:* ${groupId}` : '\n📍 *Private Chat*';
                reportMsg += `\n⏰ *Time:* ${new Date().toLocaleString()}`;

                await sock.sendMessage(ownerJid, { text: reportMsg });
            } catch (err) {
                logger.error('Failed to send report', err);
            }
        }

        await sock.sendMessage(msg.key.remoteJid, { text: '✅ Your report has been sent to the bot owner. Thank you!' });
    },

    /**
     * Announce command - Send announcement (owner only)
     */
    announce: async (sock, msg, args) => {
        if (!security.isOwner(getSenderId(msg))) {
            await sock.sendMessage(msg.key.remoteJid, { text: '❌ This command is for bot owner only.' });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Usage: ${config.BOT_PREFIX}announce [message]` });
            return;
        }

        const announcement = args.join(' ');
        let announcementMsg = `📢 *ANNOUNCEMENT*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        announcementMsg += `${announcement}\n\n`;
        announcementMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        announcementMsg += `_From: ${config.BOT_OWNER}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: announcementMsg });
    },

    /**
     * Creator/Owner info command
     */
    owner: async (sock, msg) => {
        let ownerMsg = `👑 *BOT OWNER*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        ownerMsg += `📛 *Name:* ${config.BOT_OWNER}\n`;
        if (config.CONTACT_PHONE) ownerMsg += `📱 *Phone:* ${config.CONTACT_PHONE}\n`;
        if (config.CONTACT_EMAIL) ownerMsg += `📧 *Email:* ${config.CONTACT_EMAIL}\n`;
        if (config.CONTACT_WEBSITE) ownerMsg += `🌐 *Website:* ${config.CONTACT_WEBSITE}\n`;
        ownerMsg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        ownerMsg += `_Powered by ${config.BOT_NAME} v${config.BOT_VERSION}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: ownerMsg });
    },

    /**
     * Alive/online check command
     */
    alive: async (sock, msg) => {
        const uptime = getUptime();
        let aliveMsg = `🟢 *BOT IS ONLINE*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        aliveMsg += `🤖 *${config.BOT_NAME}*\n`;
        aliveMsg += `📊 *Version:* ${config.BOT_VERSION}\n`;
        aliveMsg += `⏰ *Uptime:* ${uptime}\n`;
        aliveMsg += `👑 *Owner:* ${config.BOT_OWNER}\n`;
        aliveMsg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
        aliveMsg += `_Type ${config.BOT_PREFIX}help for commands!_`;

        await sock.sendMessage(msg.key.remoteJid, { text: aliveMsg });
    },

    /**
     * Menu command - Better organized help
     */
    menu: async (sock, msg) => {
        const isUserOwner = security.isOwner(getSenderId(msg));

        let menu = `╔═══════════════════════╗\n`;
        menu += `║  🤖 *${config.BOT_NAME}*  ║\n`;
        menu += `║    v${config.BOT_VERSION}    ║\n`;
        menu += `╚═══════════════════════╝\n\n`;

        menu += `📋 *GENERAL COMMANDS*\n`;
        menu += `┌───────────────────\n`;
        menu += `│ ${config.BOT_PREFIX}help - All commands\n`;
        menu += `│ ${config.BOT_PREFIX}menu - This menu\n`;
        menu += `│ ${config.BOT_PREFIX}alive - Bot status\n`;
        menu += `│ ${config.BOT_PREFIX}ping - Test speed\n`;
        menu += `│ ${config.BOT_PREFIX}owner - Owner info\n`;
        menu += `└───────────────────\n\n`;

        menu += `👥 *GROUP COMMANDS*\n`;
        menu += `┌───────────────────\n`;
        menu += `│ ${config.BOT_PREFIX}groupinfo - Group stats\n`;
        menu += `│ ${config.BOT_PREFIX}rules - Show rules\n`;
        menu += `│ ${config.BOT_PREFIX}tagall - Tag everyone\n`;
        menu += `│ ${config.BOT_PREFIX}report - Report issue\n`;
        menu += `└───────────────────\n\n`;

        menu += `🛡️ *ADMIN COMMANDS*\n`;
        menu += `┌───────────────────\n`;
        menu += `│ ${config.BOT_PREFIX}open - Open group\n`;
        menu += `│ ${config.BOT_PREFIX}close - Close group\n`;
        menu += `│ ${config.BOT_PREFIX}kick @user - Remove\n`;
        menu += `│ ${config.BOT_PREFIX}warn @user - Warn (3=kick)\n`;
        menu += `│ ${config.BOT_PREFIX}mute @user - Mute\n`;
        menu += `│ ${config.BOT_PREFIX}promote @user - Make admin\n`;
        menu += `│ ${config.BOT_PREFIX}demote @user - Remove admin\n`;
        menu += `└───────────────────\n\n`;

        if (isUserOwner) {
            menu += `👑 *OWNER COMMANDS*\n`;
            menu += `┌───────────────────\n`;
            menu += `│ ${config.BOT_PREFIX}toggle - Toggle features\n`;
            menu += `│ ${config.BOT_PREFIX}announce - Broadcast\n`;
            menu += `│ ${config.BOT_PREFIX}block - Block user\n`;
            menu += `│ ${config.BOT_PREFIX}unblock - Unblock user\n`;
            menu += `└───────────────────\n\n`;
        }

        if (config.FEATURE_FILE_SHARING) {
            menu += `📁 *FILES*\n`;
            menu += `┌───────────────────\n`;
            menu += `│ ${config.BOT_PREFIX}files - List files\n`;
            menu += `│ Type subject code (e.g. CS101)\n`;
            menu += `└───────────────────\n\n`;
        }

        menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
        menu += `👑 _Owner: ${config.BOT_OWNER}_`;

        await sock.sendMessage(msg.key.remoteJid, { text: menu });
    }
};

/**
 * Handle incoming message
 * @param {Object} sock - WhatsApp socket
 * @param {Object} msg - Message object
 */
/**
 * Check if user is currently muted
 */
function isUserMuted(groupId, participantId) {
    if (!mutedUsers.has(groupId)) return false;
    const groupMutes = mutedUsers.get(groupId);
    if (!groupMutes.has(participantId)) return false;

    const muteEndTime = groupMutes.get(participantId);
    if (Date.now() > muteEndTime) {
        // Mute expired, remove it
        groupMutes.delete(participantId);
        return false;
    }
    return true;
}

/**
 * Handle incoming message
 * @param {Object} sock - WhatsApp socket
 * @param {Object} msg - Message object
 */
async function handleMessage(sock, msg) {
    try {
        // Ignore if no message text
        if (!msg.message || !msg.message.conversation && !msg.message.extendedTextMessage) {
            return;
        }

        // Get message text
        const messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const senderId = msg.key.remoteJid;

        // Sanitize input
        const sanitizedText = security.sanitizeInput(messageText);

        // Update stats
        stats.messagesReceived++;

        // Check if user is blocked
        if (security.isUserBlocked(senderId)) {
            logger.warn('Blocked user attempted to send message', { senderId });
            return;
        }

        // Check rate limiting
        if (!security.checkRateLimit(senderId)) {
            await sock.sendMessage(senderId, {
                text: '⚠️ You are sending messages too quickly. Please slow down.'
            });
            return;
        }

        // Check if bot is enabled
        if (!config.FEATURE_BOT_ENABLED) {
            return;
        }

        // Check if message is from group and group filtering is enabled
        if (config.FEATURE_GROUP_ONLY && !senderId.includes('@g.us')) {
            return;
        }

        // Check group whitelist
        if (senderId.includes('@g.us') && !security.isGroupWhitelisted(senderId)) {
            logger.warn('Message from non-whitelisted group', { groupId: senderId });
            return;
        }

        // Check if user is muted in this group
        if (senderId.includes('@g.us')) {
            const participantId = msg.key.participant;
            if (participantId && isUserMuted(senderId, participantId) && !security.isAdmin(participantId)) {
                try {
                    await sock.sendMessage(senderId, { delete: msg.key });
                    logger.info('Muted user message deleted', { user: participantId, group: senderId });
                } catch (delErr) {
                    logger.error('Failed to delete muted user message', delErr);
                }
                return;
            }
        }

        // Link moderation for groups
        if (senderId.includes('@g.us') && config.FEATURE_LINK_MODERATION) {
            // Check for status mentions
            if (linkModerator.hasStatusMention(sanitizedText)) {
                try {
                    // Delete the message
                    await sock.sendMessage(senderId, { delete: msg.key });

                    // Send warning
                    await sock.sendMessage(senderId, {
                        text: linkModerator.getStatusWarning()
                    });

                    logger.info('Status mention deleted', { sender: msg.key.participant });
                } catch (delErr) {
                    logger.error('Failed to delete status mention', delErr);
                }
                return;
            }

            // Check for restricted links
            const modResult = linkModerator.checkMessage(sanitizedText);

            if (modResult.hasViolation) {
                const senderNumber = msg.key.participant?.split('@')[0] || '';

                if (modResult.shouldDelete) {
                    try {
                        // Delete the message
                        await sock.sendMessage(senderId, { delete: msg.key });

                        // Send warning with mention
                        await sock.sendMessage(senderId, {
                            text: `@${senderNumber}\n\n${modResult.warningMessage}`,
                            mentions: [msg.key.participant]
                        });

                        logger.info('Restricted link deleted', {
                            type: modResult.violationType,
                            sender: msg.key.participant
                        });
                    } catch (delErr) {
                        logger.error('Failed to delete message', delErr);
                    }
                } else if (modResult.mentionSender) {
                    // For channel links - send clean message and notify sender
                    try {
                        await sock.sendMessage(senderId, { delete: msg.key });

                        // Send the clean message
                        await sock.sendMessage(senderId, {
                            text: `@${senderNumber} said:\n\n${modResult.cleanMessage}`,
                            mentions: [msg.key.participant]
                        });

                        // Send warning
                        await sock.sendMessage(senderId, {
                            text: `@${senderNumber}\n\n${modResult.warningMessage}`,
                            mentions: [msg.key.participant]
                        });

                        logger.info('Channel link removed', { sender: msg.key.participant });
                    } catch (delErr) {
                        logger.error('Failed to process channel link', delErr);
                    }
                }
                return;
            }
        }

        // Check if message is a command
        if (sanitizedText.startsWith(config.BOT_PREFIX)) {
            const commandText = sanitizedText.slice(config.BOT_PREFIX.length).trim();
            const [commandName, ...args] = commandText.split(' ');
            const command = commandName.toLowerCase();

            logger.info('Command received', { command, sender: senderId });

            // Execute command
            if (commands[command]) {
                stats.commandsExecuted++;
                stats.recentCommands.push(`${command} (${new Date().toLocaleTimeString()})`);
                if (stats.recentCommands.length > 10) {
                    stats.recentCommands.shift();
                }

                await commands[command](sock, msg, args);
            } else {
                await sock.sendMessage(senderId, {
                    text: `❌ Unknown command: ${command}\n\nType ${config.BOT_PREFIX}help for available commands.`
                });
            }
            return;
        }

        // Check for greetings
        if (isGreeting(sanitizedText)) {
            if (config.FEATURE_AUTO_REPLY) {
                const greetingResponse = `✨ *Wa Alaikum Assalam!* ✨

👋 Welcome! I'm *${config.BOT_NAME}*

🤖 Your intelligent assistant, here to help!

━━━━━━━━━━━━━━━━━━━━━
👑 _Powered by ${config.BOT_OWNER}_`;
                await sock.sendMessage(senderId, { text: greetingResponse });
            }
            return;
        }

        // Check for VU subject code (e.g., "CS101", "CS101 files", "MTH302")
        if (config.FEATURE_FILE_SHARING) {
            const subjectCode = extractSubjectCode(sanitizedText);
            if (subjectCode) {
                logger.info('Subject code request received', { subjectCode, sender: senderId });

                const matchingFiles = fileManager.getFilesBySubjectCode(subjectCode);

                if (matchingFiles.length === 0) {
                    await sock.sendMessage(senderId, {
                        text: `📁 No files found for *${subjectCode}*\n\nPlease check the subject code or contact admin to add files.`
                    });
                } else {
                    // Send info message first
                    await sock.sendMessage(senderId, {
                        text: `📚 Found *${matchingFiles.length}* file(s) for *${subjectCode}*\n\n_Sending files..._`
                    });

                    // Send each file
                    for (const file of matchingFiles) {
                        try {
                            const fs = require('fs');
                            const fileBuffer = fs.readFileSync(file.path);

                            await sock.sendMessage(senderId, {
                                document: fileBuffer,
                                fileName: file.name,
                                mimetype: file.mimeType || fileManager.getMimeType(file.name)
                            });

                            logger.info('File sent', { fileName: file.name, path: file.relativePath, to: senderId });
                        } catch (fileErr) {
                            logger.error('Failed to send file', fileErr, { fileName: file.name });
                            await sock.sendMessage(senderId, {
                                text: `❌ Failed to send: ${file.name}`
                            });
                        }
                    }
                }
                return;
            }
        }

        // AI Auto-response for questions
        if (config.FEATURE_AI_ENABLED && aiService.isAIEnabled()) {
            if (aiService.shouldUseAI(sanitizedText)) {
                logger.info('AI question detected', { question: sanitizedText.substring(0, 50), sender: senderId });

                try {
                    const aiResponse = await aiService.generateResponse(sanitizedText);

                    if (aiResponse) {
                        await sock.sendMessage(senderId, {
                            text: `🤖 *AI Response:*\n\n${aiResponse}`
                        });
                        return;
                    }
                } catch (aiErr) {
                    logger.error('AI response failed', aiErr);
                }
            }
        }

        // Auto-reply for private chats
        if (config.FEATURE_AUTO_REPLY && !senderId.includes('@g.us')) {
            const autoReply = `Thanks for your message! Type ${config.BOT_PREFIX}help to see available commands.`;
            await sock.sendMessage(senderId, { text: autoReply });
        }

    } catch (err) {
        logger.error('Error handling message', err);
        stats.errors++;
        stats.recentErrors.push(`${err.message} (${new Date().toLocaleTimeString()})`);
        if (stats.recentErrors.length > 10) {
            stats.recentErrors.shift();
        }

        try {
            const safeError = security.getSafeErrorMessage(err);
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ ${safeError}` });
        } catch (sendErr) {
            logger.error('Failed to send error message', sendErr);
        }
    }
}

/**
 * Get bot statistics
 * @returns {Object} Statistics object
 */
function getStats() {
    return {
        ...stats,
        uptime: getUptime()
    };
}

module.exports = {
    handleMessage,
    getStats
};
