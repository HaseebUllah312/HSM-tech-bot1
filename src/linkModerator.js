/**
 * Link Moderator Module
 * Professional Channel Alert styled link moderation
 * Detect and moderate links in group messages with warning tracking
 */

const config = require('./config');
const logger = require('./logger');

// Use shared DataStore for warnings instead of in-memory Map
const { warnings } = require('./dataStore');

// Warning tracker: Removed in-memory Map to use DataStore
// const linkWarnings = new Map();

const LINK_PATTERNS = {
    // Specific Services
    whatsappGroup: /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}/gi,
    whatsappChannel: /(?:whatsapp\.com\/channel\/)[a-zA-Z0-9_-]+/gi,

    // Social Media
    facebook: /(?:facebook\.com|fb\.watch|fb\.com|fb\.me)/gi,
    instagram: /(?:instagram\.com|instagr\.am)/gi,
    tiktok: /(?:tiktok\.com|vm\.tiktok\.com)/gi,
    twitter: /(?:twitter\.com|x\.com)/gi,
    telegram: /(?:t\.me|telegram\.me)/gi,
    snapchat: /(?:snapchat\.com)/gi,
    discord: /(?:discord\.gg|discord\.com\/invite)/gi,
    linkedin: /(?:linkedin\.com)/gi,
    pinterest: /(?:pinterest\.com|pin\.it)/gi,
    youtube: /(?:youtube\.com|youtu\.be)/gi,

    // Shorteners
    bitly: /(?:bit\.ly)/gi,
    tinyurl: /(?:tinyurl\.com)/gi,
    shortLinks: /(?:goo\.gl|ow\.ly|buff\.ly|is\.gd|bl\.ink|tr\.im)/gi,

    // General
    anyUrl: /https?:\/\/[^\s]+/gi,
    wwwUrl: /www\.[^\s]+/gi,
    domainUrl: /[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi,
    waChannel: /whatsapp\.com\/channel\//gi,

    // Cleanup
    allLinks: /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/[^\s]*)?/gi
};

/**
 * Get or create warning data for a user in a group
 * @param {string} groupId - Group JID
 * @param {string} participantId - Participant JID
 * @returns {Object} Warning data
 */
function getWarningData(groupId, participantId) {
    const key = `${groupId}.${participantId}`;
    const data = warnings.get(key) || { count: 0, lastWarn: 0 };
    return data;
}

/**
 * Increment warning and return current count
 * @param {string} groupId - Group JID
 * @param {string} participantId - Participant JID
 * @returns {number} Current warning count (1-3)
 */
function incrementWarning(groupId, participantId) {
    const key = `${groupId}.${participantId}`;
    const data = getWarningData(groupId, participantId);

    // Reset warnings if over 24 hours since last warning
    if (Date.now() - data.lastWarn > 24 * 60 * 60 * 1000) {
        data.count = 0;
    }

    data.count = Math.min(data.count + 1, 4);
    data.lastWarn = Date.now();

    // Save to store
    warnings.set(key, data);

    return data.count;
}

/**
 * Reset warnings for a user
 * @param {string} groupId - Group JID
 * @param {string} participantId - Participant JID
 */
function resetWarnings(groupId, participantId) {
    const key = `${groupId}.${participantId}`;
    warnings.delete(key);
}

/**
 * Get link type name for display
 * @param {string} violationType - Violation type
 * @returns {string} Human readable type
 */
function getLinkTypeName(violationType) {
    const names = {
        'whatsapp_group': 'WhatsApp Group Link',
        'whatsapp_channel': 'Channel Post',
        'facebook': 'Facebook Link',
        'instagram': 'Instagram Link',
        'tiktok': 'TikTok Link',
        'twitter': 'Twitter/X Link',
        'telegram': 'Telegram Link',
        'snapchat': 'Snapchat Link',
        'discord': 'Discord Link',
        'linkedin': 'LinkedIn Link',
        'pinterest': 'Pinterest Link',
        'youtube': 'YouTube Link',
        'short_url': 'Short URL',
        'unknown_link': 'External Link',
        'social_media': 'Social Media Link'
    };
    return names[violationType] || 'External Link';
}

/**
 * Generate professional Channel Alert styled warning message
 * Generate professional compact warning message
 * @param {string} senderNumber - Sender's phone number
 * @param {string} violationType - Type of violation
 * @param {number} warningCount - Current warning count (1-3)
 * @returns {string} Formatted warning message
 */
function generateChannelAlert(senderNumber, violationType, warningCount) {
    const linkTypeName = getLinkTypeName(violationType);
    const botName = config.BOT_NAME || 'HSM Tech Bot';
    const ownerName = "𝕴𝖙'𝖘 𝕸𝖚𝖌𝖍𝖆𝖑."; // Custom font as requested

    // Determine action text
    let actionText = '*𝐀𝐂𝐓𝐈𝐎𝐍 𝐓𝐀𝐊𝐄𝐍*';

    // Reason map
    const reasonMap = {
        'whatsapp_group': 'Group links are not allowed.',
        'whatsapp_channel': 'Channel links/posts are not allowed.',
        'status_mention': 'Do not mention this group in your status.',
        'unknown_link': 'Links are not allowed here.'
    };

    const reason = reasonMap[violationType] || `${linkTypeName}s are not allowed.`;

    // Compact Design
    return `🤖 *${botName}*
⛔ ${actionText}
👤 @${senderNumber} | ⚠️ Warn: ${warningCount}/3
🔗 Type: ${linkTypeName}
🚫 ${reason}
👑 Owner: ${ownerName}`;
}

/**
 * Generate extended warning message with more details
 * @param {string} violationType - Type of violation  
 * @param {number} warningCount - Current warning count
 * @returns {string} Extended warning details
 */
function generateExtendedWarning(violationType, warningCount) {
    const botName = config.BOT_NAME || 'HSM Tech Bot';

    const messages = {
        1: `\n🚫 _First warning! Links are not allowed._\n📌 _Follow group rules to avoid removal._`,
        2: `\n⚠️ _Second warning! Be careful._\n📌 _2 more warnings = removal!_`,
        3: `\n🟠 _Third warning! Last chance!_\n📌 _One more = removal from group!_`,
        4: `\n🔴 _FINAL WARNING EXCEEDED!_\n💀 _You will be removed from this group._`
    };

    return messages[warningCount] || messages[1];
}

/**
 * Check message for restricted links
 * @param {Object} msg - Full message object (required for metadata check)
 * @param {string} messageContent - Message text content
 * @param {string} groupId - Group JID (optional, for warning tracking)
 * @param {string} participantId - Participant JID (optional, for warning tracking)
 * @returns {Object} Moderation result
 */
function checkMessage(msg, messageContent, groupId = null, participantId = null) {
    if (!messageContent || typeof messageContent !== 'string') {
        return { hasViolation: false };
    }

    const result = {
        hasViolation: false,
        violationType: null,
        shouldDelete: true,
        shouldWarn: true,
        shouldKick: false,
        shouldKick: false,
        cleanMessage: messageContent,
        mentionSender: true,
        warningMessage: null,
        warningCount: 0,
        isChannelForward: false,  // Special flag for channel posts
        strippedContent: null     // Content without links for channel posts
    };

    // Reset all regex lastIndex
    Object.values(LINK_PATTERNS).forEach(pattern => {
        if (pattern && pattern.lastIndex !== undefined) {
            pattern.lastIndex = 0;
        }
    });

    // YouTube is ALLOWED - check first and skip if ONLY YouTube
    LINK_PATTERNS.youtube.lastIndex = 0;
    LINK_PATTERNS.youtube.lastIndex = 0;
    if (LINK_PATTERNS.youtube.test(messageContent)) {
        // Check if there are OTHER links besides YouTube
        LINK_PATTERNS.youtube.lastIndex = 0;
        let messageWithoutYT = messageContent.replace(LINK_PATTERNS.youtube, '[YT_ALLOWED]');

        // Reset and check for other links
        LINK_PATTERNS.anyUrl.lastIndex = 0;
        LINK_PATTERNS.wwwUrl.lastIndex = 0;

        // If only YouTube links, allow the message
        if (!LINK_PATTERNS.anyUrl.test(messageWithoutYT) && !LINK_PATTERNS.wwwUrl.test(messageWithoutYT)) {
            logger.info('YouTube link allowed', { message: message.substring(0, 50) });
            return { hasViolation: false };
        }
    }

    // Check WhatsApp Group Links (highest priority - always delete)
    LINK_PATTERNS.whatsappGroup.lastIndex = 0;
    if (LINK_PATTERNS.whatsappGroup.test(messageContent)) {
        result.hasViolation = true;
        result.violationType = 'whatsapp_group';
        result.shouldDelete = true;
        result.shouldWarn = true;

        if (groupId && participantId) {
            result.warningCount = incrementWarning(groupId, participantId);
            result.shouldKick = result.warningCount >= 4;
        } else {
            result.warningCount = 1;
        }

        return result;
    }

    // Check WhatsApp Channel Links (Metadata & URL)

    /** 
     * Helper to extract context info from ANY message type 
     * (Text, Image, Video, Document, etc.)
     */
    const getContextInfo = (m) => {
        if (!m.message) return null;
        const msgType = Object.keys(m.message)[0];
        const content = m.message[msgType];

        // Handle ephemeral/viewOnce wrappers
        if (msgType === 'ephemeralMessage' || msgType === 'viewOnceMessage' || msgType === 'viewOnceMessageV2') {
            const innerType = Object.keys(content.message)[0];
            return content.message[innerType]?.contextInfo;
        }

        return content?.contextInfo;
    };

    const contextInfo = getContextInfo(msg);
    // 1. Metadata Check (Robust: Detects forwarded channel posts in ALL media types)
    const isChannelMetadata = contextInfo?.forwardedNewsletterMessageInfo;

    // 2. URL Check
    LINK_PATTERNS.whatsappChannel.lastIndex = 0;
    const isChannelUrl = LINK_PATTERNS.whatsappChannel.test(messageContent);

    // --- WHITELIST CHECK ---
    const { settings } = require('./dataStore'); // Lazy load to avoid cycle if any

    if (isChannelMetadata || isChannelUrl) {
        // Check Whitelist
        if (groupId) {
            const whitelist = settings.get(`${groupId}.whitelist`) || [];
            const channelJid = isChannelMetadata?.newsletterJid;
            const channelName = isChannelMetadata?.newsletterName; // Fallback? 

            // Check by JID (Best)
            if (channelJid && whitelist.includes(channelJid)) {
                logger.info('Allowed whitelisted channel post', { groupId, channelJid });
                return { hasViolation: false };
            }

            // Check by link in text (Fallback for verify)
            if (isChannelUrl && !isChannelMetadata) {
                // Extract Code from text content
                const matches = messageContent.match(/(?:whatsapp\.com\/channel\/|chat\.whatsapp\.com\/)([a-zA-Z0-9_-]+)/);
                if (matches && matches[1]) {
                    const code = matches[1];
                    if (whitelist.includes(code)) {
                        logger.info('Allowed whitelisted channel link', { groupId, code });
                        return { hasViolation: false };
                    }
                }
            }
        }

        result.hasViolation = true;
        result.violationType = 'whatsapp_channel';
        result.shouldDelete = true;
        result.isChannelForward = true;

        // Strip ALL links from the message and save clean content
        LINK_PATTERNS.allLinks.lastIndex = 0;
        result.strippedContent = messageContent.replace(LINK_PATTERNS.allLinks, '').replace(/\s+/g, ' ').trim();
        result.cleanMessage = result.strippedContent;

        if (groupId && participantId) {
            result.warningCount = incrementWarning(groupId, participantId);
            result.shouldKick = result.warningCount >= 4;
        } else {
            result.warningCount = 1;
        }

        return result;
    }

    // Check Social Media Links
    const socialPatterns = [
        { pattern: LINK_PATTERNS.facebook, name: 'facebook' },
        { pattern: LINK_PATTERNS.instagram, name: 'instagram' },
        { pattern: LINK_PATTERNS.tiktok, name: 'tiktok' },
        { pattern: LINK_PATTERNS.twitter, name: 'twitter' },
        { pattern: LINK_PATTERNS.telegram, name: 'telegram' },
        { pattern: LINK_PATTERNS.snapchat, name: 'snapchat' },
        { pattern: LINK_PATTERNS.discord, name: 'discord' },
        { pattern: LINK_PATTERNS.linkedin, name: 'linkedin' },
        { pattern: LINK_PATTERNS.pinterest, name: 'pinterest' }
    ];

    for (const social of socialPatterns) {
        social.pattern.lastIndex = 0;
        if (social.pattern.test(messageContent)) {
            result.hasViolation = true;
            result.violationType = social.name;
            result.shouldDelete = true;

            if (groupId && participantId) {
                result.warningCount = incrementWarning(groupId, participantId);
                result.shouldKick = result.warningCount >= 4;
            } else {
                result.warningCount = 1;
            }

            return result;
        }
    }

    // Check short URL services
    const shortPatterns = [LINK_PATTERNS.bitly, LINK_PATTERNS.tinyurl, LINK_PATTERNS.shortLinks];
    for (const pattern of shortPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(messageContent)) {
            result.hasViolation = true;
            result.violationType = 'short_url';
            result.shouldDelete = true;

            if (groupId && participantId) {
                result.warningCount = incrementWarning(groupId, participantId);
                result.shouldKick = result.warningCount >= 4;
            } else {
                result.warningCount = 1;
            }

            return result;
        }
    }

    // Check general URLs (catches anything else)
    LINK_PATTERNS.anyUrl.lastIndex = 0;
    LINK_PATTERNS.wwwUrl.lastIndex = 0;
    LINK_PATTERNS.domainUrl.lastIndex = 0;
    LINK_PATTERNS.waChannel.lastIndex = 0;

    if (LINK_PATTERNS.anyUrl.test(messageContent) ||
        LINK_PATTERNS.wwwUrl.test(messageContent) ||
        LINK_PATTERNS.domainUrl.test(messageContent) ||
        LINK_PATTERNS.waChannel.test(messageContent)) {

        result.hasViolation = true;
        result.violationType = 'unknown_link';
        result.shouldDelete = true;

        if (groupId && participantId) {
            result.warningCount = incrementWarning(groupId, participantId);
            result.shouldKick = result.warningCount >= 4;
        } else {
            result.warningCount = 1;
        }

        return result;
    }

    return result;
}

function hasStatusMention(message) {
    if (!message) return false;

    // 1. System Message: "@ This group was mentioned." (Automatic)
    // 2. Manual: "Check my status", "123's status"
    const statusPatterns = [
        /@\s*This group was mentioned/i,   // System message when group is tagged
        /\d+'s\s*status/i,                 // "92300...'s status" (System/Forward)
        /check\s*(my|out)?\s*status/i,
        /see\s*(my)?\s*status/i,
        /view\s*(my)?\s*status/i,
        /dekho\s*(mera)?\s*status/i,
        /status\s*dekho/i,
        /status\s*lagaya/i,
        /dp\s*(dekho|check)/i,
        /send\s*(my)?\s*status/i,
        /share\s*(my)?\s*status/i
    ];

    return statusPatterns.some(pattern => pattern.test(message));
}

function getStatusWarning(senderNumber, warningCount) {
    return generateChannelAlert(senderNumber, 'status_mention', warningCount);
}

/**
 * Get formatted channel alert warning
 * @param {string} senderNumber - Sender number without @s.whatsapp.net
 * @param {Object} modResult - Moderation result from checkMessage
 * @returns {string} Formatted warning
 */
function getFormattedWarning(senderNumber, modResult) {
    // Return ONLY the compact Channel Alert (User requested "edit all warning ;like these text")
    return generateChannelAlert(senderNumber, modResult.violationType, modResult.warningCount);
}

module.exports = {
    checkMessage,
    hasStatusMention,
    getStatusWarning,
    getFormattedWarning,
    generateChannelAlert,
    resetWarnings,
    getWarningData,
    incrementWarningForUser: incrementWarning,
    LINK_PATTERNS
};

