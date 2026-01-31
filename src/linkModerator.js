/**
 * Link Moderator Module
 * Detect and moderate links in group messages
 */

const config = require('./config');
const logger = require('./logger');

/**
 * Link patterns for moderation
 */
const LINK_PATTERNS = {
    // WhatsApp Links (BLOCKED)
    whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]+/gi,
    whatsappChannel: /whatsapp\.com\/channel\/[A-Za-z0-9_-]+/gi,

    // Social Media Links (BLOCKED)
    facebook: /(facebook\.com|fb\.com|fb\.me|m\.facebook\.com)\/[^\s]*/gi,
    instagram: /(instagram\.com|instagr\.am)\/[^\s]*/gi,
    tiktok: /(tiktok\.com|vm\.tiktok\.com)\/[^\s]*/gi,
    twitter: /(twitter\.com|x\.com|t\.co)\/[^\s]*/gi,
    telegram: /(t\.me|telegram\.me)\/[^\s]*/gi,
    snapchat: /snapchat\.com\/[^\s]*/gi,

    // YouTube (ALLOWED)
    youtube: /(youtube\.com|youtu\.be)\/[^\s]*/gi,

    // General URLs
    anyUrl: /https?:\/\/[^\s]+/gi
};

/**
 * Check message for restricted links
 * @param {string} message - Message text
 * @returns {Object} Moderation result
 */
function checkMessage(message) {
    if (!message || typeof message !== 'string') {
        return { hasViolation: false };
    }

    const result = {
        hasViolation: false,
        violationType: null,
        shouldDelete: false,
        shouldWarn: false,
        cleanMessage: message,
        mentionSender: false,
        warningMessage: null
    };

    // Check WhatsApp Group Links
    if (LINK_PATTERNS.whatsappGroup.test(message)) {
        result.hasViolation = true;
        result.violationType = 'whatsapp_group';
        result.shouldDelete = true;
        result.shouldWarn = true;
        result.warningMessage = '⚠️ *WhatsApp Group links are not allowed!*\n\n🚫 Your message was deleted.\n📌 Please follow group rules.';
        return result;
    }

    // Check WhatsApp Channel Links
    const channelMatch = message.match(LINK_PATTERNS.whatsappChannel);
    if (channelMatch) {
        result.hasViolation = true;
        result.violationType = 'whatsapp_channel';
        result.shouldDelete = false; // Don't delete, just remove link
        result.mentionSender = true;
        result.cleanMessage = message.replace(LINK_PATTERNS.whatsappChannel, '[Channel Link Removed]');
        result.warningMessage = '⚠️ *WhatsApp Channel links are restricted!*\n\n📝 Your message was sent without the channel link.\n💡 Please share content directly instead of channel links.';
        return result;
    }

    // Check Social Media Links
    const socialPatterns = [
        { pattern: LINK_PATTERNS.facebook, name: 'Facebook' },
        { pattern: LINK_PATTERNS.instagram, name: 'Instagram' },
        { pattern: LINK_PATTERNS.tiktok, name: 'TikTok' },
        { pattern: LINK_PATTERNS.twitter, name: 'Twitter/X' },
        { pattern: LINK_PATTERNS.telegram, name: 'Telegram' },
        { pattern: LINK_PATTERNS.snapchat, name: 'Snapchat' }
    ];

    for (const social of socialPatterns) {
        // Reset regex
        social.pattern.lastIndex = 0;
        if (social.pattern.test(message)) {
            result.hasViolation = true;
            result.violationType = 'social_media';
            result.shouldDelete = true;
            result.shouldWarn = true;
            result.warningMessage = `⚠️ *${social.name} links are not allowed!*\n\n🚫 Your message was deleted.\n📌 Only YouTube links are permitted.`;
            return result;
        }
    }

    // YouTube is allowed - no action needed
    // Reset regex and check
    LINK_PATTERNS.youtube.lastIndex = 0;
    if (LINK_PATTERNS.youtube.test(message)) {
        // YouTube is allowed
        return { hasViolation: false };
    }

    return result;
}

/**
 * Check if message contains WhatsApp status mention
 * @param {string} message - Message text
 * @returns {boolean} True if contains status mention
 */
function hasStatusMention(message) {
    if (!message) return false;

    const statusPatterns = [
        /check\s*(my|out)?\s*status/i,
        /see\s*(my)?\s*status/i,
        /view\s*(my)?\s*status/i,
        /dekho\s*(mera)?\s*status/i,      // Urdu/Hindi
        /status\s*dekho/i,
        /status\s*lagaya/i,
        /dp\s*(dekho|check)/i
    ];

    return statusPatterns.some(pattern => pattern.test(message));
}

/**
 * Get warning message for status mention
 * @returns {string} Warning message
 */
function getStatusWarning() {
    return '⚠️ *Status mentions are not allowed!*\n\n🚫 Please don\'t ask people to check your status.\n📌 Share content directly in the group if needed.';
}

module.exports = {
    checkMessage,
    hasStatusMention,
    getStatusWarning,
    LINK_PATTERNS
};
