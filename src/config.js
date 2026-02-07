/**
 * Configuration Management Module
 * Loads and validates environment variables with Joi schema
 */

require('dotenv').config();
const Joi = require('joi');

// Configuration schema
const configSchema = Joi.object({
    // Bot settings
    BOT_NAME: Joi.string().default('HSM Tech Bot'),
    BOT_PREFIX: Joi.string().default('!'),
    BOT_OWNER: Joi.string().default('Admin'),
    BOT_VERSION: Joi.string().default('1.0.0'),

    // Feature toggles
    FEATURE_BOT_ENABLED: Joi.boolean().default(true),
    FEATURE_AUTO_REPLY: Joi.boolean().default(true),
    FEATURE_FILE_SHARING: Joi.boolean().default(true),
    FEATURE_EMAIL_REPORTS: Joi.boolean().default(true),
    FEATURE_WELCOME_MESSAGE: Joi.boolean().default(true),
    FEATURE_GROUP_ONLY: Joi.boolean().default(false),
    FEATURE_AI_ENABLED: Joi.boolean().default(true),
    FEATURE_LINK_MODERATION: Joi.boolean().default(true),
    // Enable Anti-Sticker by default as requested ("all setting on")
    FEATURE_ANTISTICKER: Joi.boolean().default(true),

    // AI Configuration
    GEMINI_API_KEY: Joi.string().allow('').default(''),
    GROQ_API_KEY: Joi.string().allow('').default(''),  // FREE! Get at https://console.groq.com/keys
    FEATURE_AI_INBOX: Joi.boolean().default(true),
    FEATURE_AI_GROUP: Joi.boolean().default(true),
    AUTO_REPLY_EXCLUDE: Joi.string().allow('').default(''),

    // Auto File Sending
    FEATURE_AUTO_FILES: Joi.boolean().default(true),
    GDRIVE_FOLDER_LINKS: Joi.string().allow('').default(''),
    OWNER_HELP_NUMBER: Joi.string().default('923177180123'),

    // Email configuration
    EMAIL_ENABLED: Joi.boolean().default(true), // Enabled by default
    EMAIL_USER: Joi.string().email().allow('').default(''),
    EMAIL_PASSWORD: Joi.string().allow('').default(''),
    EMAIL_RECIPIENT: Joi.string().email().allow('').default(''),
    EMAIL_REPORT_TIME: Joi.string().pattern(/^\d{2}:\d{2}$/).default('09:00'),

    // Security settings
    MAX_MESSAGES_PER_MINUTE: Joi.number().integer().min(1).max(100).default(20),
    MAX_MESSAGE_LENGTH: Joi.number().integer().min(100).max(10000).default(2000),
    BLOCKED_USERS: Joi.string().allow('').default(''),

    // Admin settings
    // Add known owner numbers to default to prevent lockout
    ADMIN_NUMBERS: Joi.string().allow('').default('923177180123,219086348923028'),
    GROUP_WHITELIST: Joi.string().allow('').default(''),

    // Logging
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
    LOG_TO_FILE: Joi.boolean().default(true),

    // Timezone for scheduled tasks
    TIMEZONE: Joi.string().default('Asia/Karachi'),
    LOG_RETENTION_DAYS: Joi.number().integer().min(1).max(30).default(7),

    // Contact info
    CONTACT_EMAIL: Joi.string().email().allow('').default(''),
    CONTACT_PHONE: Joi.string().allow('').default(''),
    CONTACT_WEBSITE: Joi.string().uri().allow('').default(''),

    // Paid services
    PAID_SERVICES_INFO: Joi.string().allow('').default(''),

    // Environment
    NODE_ENV: Joi.string().valid('development', 'production').default('production'),

    // Moderation
    DEFAULT_WARNING_LIMIT: Joi.number().integer().min(1).max(10).default(3)
}).unknown(true);

/**
 * Parse environment variable to boolean
 */
function parseBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
    }
    return false;
}

/**
 * Load and validate configuration
 */
function loadConfig() {
    const rawConfig = {
        BOT_NAME: process.env.BOT_NAME,
        BOT_PREFIX: process.env.BOT_PREFIX,
        BOT_OWNER: process.env.BOT_OWNER,
        BOT_VERSION: process.env.BOT_VERSION,

        FEATURE_BOT_ENABLED: parseBoolean(process.env.FEATURE_BOT_ENABLED),
        FEATURE_AUTO_REPLY: parseBoolean(process.env.FEATURE_AUTO_REPLY),
        FEATURE_FILE_SHARING: parseBoolean(process.env.FEATURE_FILE_SHARING),
        FEATURE_EMAIL_REPORTS: parseBoolean(process.env.FEATURE_EMAIL_REPORTS),
        FEATURE_WELCOME_MESSAGE: parseBoolean(process.env.FEATURE_WELCOME_MESSAGE),
        FEATURE_GROUP_ONLY: parseBoolean(process.env.FEATURE_GROUP_ONLY),
        FEATURE_AI_ENABLED: parseBoolean(process.env.FEATURE_AI_ENABLED ?? 'true'),
        FEATURE_AI_INBOX: parseBoolean(process.env.FEATURE_AI_INBOX ?? 'true'),
        FEATURE_AI_GROUP: parseBoolean(process.env.FEATURE_AI_GROUP ?? 'true'),
        FEATURE_LINK_MODERATION: parseBoolean(process.env.FEATURE_LINK_MODERATION ?? 'true'),
        FEATURE_AUTO_FILES: parseBoolean(process.env.FEATURE_AUTO_FILES ?? 'true'),

        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,  // FREE! https://console.groq.com/keys
        AUTO_REPLY_EXCLUDE: process.env.AUTO_REPLY_EXCLUDE,
        GDRIVE_FOLDER_LINKS: process.env.GDRIVE_FOLDER_LINKS,
        OWNER_HELP_NUMBER: process.env.OWNER_HELP_NUMBER || '923177180123',

        EMAIL_ENABLED: parseBoolean(process.env.EMAIL_ENABLED),
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
        EMAIL_RECIPIENT: process.env.EMAIL_RECIPIENT,
        EMAIL_REPORT_TIME: process.env.EMAIL_REPORT_TIME,

        MAX_MESSAGES_PER_MINUTE: parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || 20,
        MAX_MESSAGE_LENGTH: parseInt(process.env.MAX_MESSAGE_LENGTH) || 2000,
        BLOCKED_USERS: process.env.BLOCKED_USERS,

        ADMIN_NUMBERS: process.env.ADMIN_NUMBERS,
        GROUP_WHITELIST: process.env.GROUP_WHITELIST,

        LOG_LEVEL: process.env.LOG_LEVEL,
        LOG_TO_FILE: parseBoolean(process.env.LOG_TO_FILE),
        TIMEZONE: process.env.TIMEZONE || 'Asia/Karachi',
        LOG_RETENTION_DAYS: parseInt(process.env.LOG_RETENTION_DAYS) || 7,

        CONTACT_EMAIL: process.env.CONTACT_EMAIL,
        CONTACT_PHONE: process.env.CONTACT_PHONE,
        CONTACT_WEBSITE: process.env.CONTACT_WEBSITE,

        PAID_SERVICES_INFO: process.env.PAID_SERVICES_INFO,

        NODE_ENV: process.env.NODE_ENV,
        DEFAULT_WARNING_LIMIT: parseInt(process.env.DEFAULT_WARNING_LIMIT) || 3
    };

    // Validate configuration
    const { error, value } = configSchema.validate(rawConfig, { abortEarly: false });

    if (error) {
        console.error('Configuration validation error:');
        error.details.forEach(detail => {
            console.error(`  - ${detail.message}`);
        });
        process.exit(1);
    }

    // Parse comma-separated lists
    value.adminNumbers = value.ADMIN_NUMBERS
        ? value.ADMIN_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    value.blockedUsers = value.BLOCKED_USERS
        ? value.BLOCKED_USERS.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    value.groupWhitelist = value.GROUP_WHITELIST
        ? value.GROUP_WHITELIST.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    value.autoReplyExclude = value.AUTO_REPLY_EXCLUDE
        ? value.AUTO_REPLY_EXCLUDE.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    value.gdriveFolderLinks = value.GDRIVE_FOLDER_LINKS
        ? value.GDRIVE_FOLDER_LINKS.split(',').map(n => n.trim()).filter(Boolean)
        : [];

    return value;
}

// Export singleton config
const config = loadConfig();

module.exports = config;
