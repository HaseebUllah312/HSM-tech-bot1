/**
 * Professional Logging Module
 * Multi-level logging with file rotation and retention
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log levels
 */
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

/**
 * Get current log level from config
 */
function getCurrentLevel() {
    return LOG_LEVELS[config.LOG_LEVEL] || LOG_LEVELS.info;
}

/**
 * Format log message with timestamp
 */
function formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0
        ? ' ' + JSON.stringify(context)
        : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Write to log file
 */
function writeToFile(formattedMessage) {
    if (!config.LOG_TO_FILE) return;

    try {
        fs.appendFileSync(LOG_FILE, formattedMessage + '\n');
    } catch (err) {
        console.error('Failed to write to log file:', err.message);
    }
}

/**
 * Clean old log files based on retention policy
 */
function cleanOldLogs() {
    try {
        const files = fs.readdirSync(LOG_DIR);
        const now = Date.now();
        const retentionMs = config.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(LOG_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > retentionMs) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old log file: ${file}`);
            }
        });
    } catch (err) {
        console.error('Failed to clean old logs:', err.message);
    }
}

/**
 * Logger object
 */
const logger = {
    /**
     * Log debug message
     */
    debug(message, context = {}) {
        if (getCurrentLevel() > LOG_LEVELS.debug) return;
        const formatted = formatMessage('debug', message, context);
        console.log('\x1b[36m%s\x1b[0m', formatted); // Cyan
        writeToFile(formatted);
    },

    /**
     * Log info message
     */
    info(message, context = {}) {
        if (getCurrentLevel() > LOG_LEVELS.info) return;
        const formatted = formatMessage('info', message, context);
        console.log(formatted);
        writeToFile(formatted);
    },

    /**
     * Log warning message
     */
    warn(message, context = {}) {
        if (getCurrentLevel() > LOG_LEVELS.warn) return;
        const formatted = formatMessage('warn', message, context);
        console.log('\x1b[33m%s\x1b[0m', formatted); // Yellow
        writeToFile(formatted);
    },

    /**
     * Log error message
     */
    error(message, error = null, context = {}) {
        if (getCurrentLevel() > LOG_LEVELS.error) return;
        const errorContext = error ? {
            ...context,
            error: error.message,
            stack: error.stack
        } : context;
        const formatted = formatMessage('error', message, errorContext);
        console.error('\x1b[31m%s\x1b[0m', formatted); // Red
        writeToFile(formatted);
    },

    /**
     * Clean old logs
     */
    cleanOldLogs
};

// Clean old logs on startup
cleanOldLogs();

module.exports = logger;
