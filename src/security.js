/**
 * Enterprise Security Module
 * Input validation, rate limiting, user blocking, and sanitization
 */

const config = require('./config');
const logger = require('./logger');

// Rate limiting storage
const rateLimitMap = new Map();

// Blocked users set
let blockedUsersSet = new Set(config.blockedUsers);

/**
 * Sanitize user input
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > config.MAX_MESSAGE_LENGTH) {
        sanitized = sanitized.substring(0, config.MAX_MESSAGE_LENGTH);
    }

    return sanitized;
}

/**
 * Check rate limiting for a user
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is allowed, false if rate limited
 */
function checkRateLimit(userId) {
    const now = Date.now();
    const userKey = userId.replace('@s.whatsapp.net', '');

    // Get user's message history
    if (!rateLimitMap.has(userKey)) {
        rateLimitMap.set(userKey, []);
    }

    const messageHistory = rateLimitMap.get(userKey);

    // Remove messages older than 1 minute
    const oneMinuteAgo = now - 60000;
    const recentMessages = messageHistory.filter(timestamp => timestamp > oneMinuteAgo);

    // Update history
    rateLimitMap.set(userKey, recentMessages);

    // Check if user exceeded limit
    if (recentMessages.length >= config.MAX_MESSAGES_PER_MINUTE) {
        logger.warn(`Rate limit exceeded for user: ${userKey}`, {
            messageCount: recentMessages.length,
            limit: config.MAX_MESSAGES_PER_MINUTE
        });
        return false;
    }

    // Add current message timestamp
    recentMessages.push(now);
    rateLimitMap.set(userKey, recentMessages);

    return true;
}

/**
 * Check if user is blocked
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is blocked
 */
function isUserBlocked(userId) {
    const userNumber = userId.replace('@s.whatsapp.net', '');
    return blockedUsersSet.has(userNumber);
}

/**
 * Block a user
 * @param {string} userId - User ID to block
 */
function blockUser(userId) {
    const userNumber = userId.replace('@s.whatsapp.net', '');
    blockedUsersSet.add(userNumber);
    logger.info(`User blocked: ${userNumber}`);
}

/**
 * Unblock a user
 * @param {string} userId - User ID to unblock
 */
function unblockUser(userId) {
    const userNumber = userId.replace('@s.whatsapp.net', '');
    blockedUsersSet.delete(userNumber);
    logger.info(`User unblocked: ${userNumber}`);
}

/**
 * Validate file path to prevent directory traversal
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is safe
 */
function isValidFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') return false;

    // Check for directory traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
        return false;
    }

    // Check for absolute paths
    if (filePath.startsWith('/') || filePath.match(/^[a-zA-Z]:\\/)) {
        return false;
    }

    return true;
}

/**
 * Check if user is an admin/owner (defined in .env ADMIN_NUMBERS)
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is admin/owner
 */
function isAdmin(userId) {
    if (!userId) return false;

    // Extract phone number from any format:
    // - 923177180123@s.whatsapp.net
    // - 923177180123@lid.whatsapp.net  
    // - 923177180123:12@s.whatsapp.net (linked device format)
    let userNumber = userId.split('@')[0]; // Get part before @
    userNumber = userNumber.split(':')[0]; // Remove device suffix if present

    // Handle Pakistani numbers that start with 0 - convert to 92
    if (userNumber.startsWith('0')) {
        userNumber = '92' + userNumber.substring(1);
    }

    const isAdminUser = config.adminNumbers.includes(userNumber);

    // Debug logging
    logger.info('Owner check', {
        userId,
        extractedNumber: userNumber,
        configuredOwners: config.adminNumbers,
        isOwner: isAdminUser
    });

    return isAdminUser;
}

/**
 * Alias for isAdmin - Check if user is bot owner
 */
function isOwner(userId) {
    return isAdmin(userId);
}

/**
 * Check if group is whitelisted
 * @param {string} groupId - Group ID to check
 * @returns {boolean} True if group is allowed
 */
function isGroupWhitelisted(groupId) {
    // If no whitelist configured, allow all groups
    if (config.groupWhitelist.length === 0) return true;

    return config.groupWhitelist.includes(groupId);
}

/**
 * Generate safe error message (don't expose internal details)
 * @param {Error} error - Original error
 * @returns {string} Safe error message
 */
function getSafeErrorMessage(error) {
    if (config.NODE_ENV === 'development') {
        return error.message;
    }
    return 'An error occurred. Please try again later.';
}

/**
 * Clean rate limit map (remove old entries)
 */
function cleanRateLimitMap() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [userId, timestamps] of rateLimitMap.entries()) {
        const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
        if (recentTimestamps.length === 0) {
            rateLimitMap.delete(userId);
        } else {
            rateLimitMap.set(userId, recentTimestamps);
        }
    }
}

// Clean rate limit map every hour
setInterval(cleanRateLimitMap, 3600000);

module.exports = {
    sanitizeInput,
    checkRateLimit,
    isUserBlocked,
    blockUser,
    unblockUser,
    isValidFilePath,
    isAdmin,
    isOwner,
    isGroupWhitelisted,
    getSafeErrorMessage
};
