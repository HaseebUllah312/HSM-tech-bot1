/**
 * HSM TECH BOT v1.0
 * Professional WhatsApp Bot for Termux
 * 
 * Main Application Entry Point
 */

const makeWASocket = require('@whiskeysockets/baileys').default;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const path = require('path');

// Import modules
const config = require('./src/config');
const logger = require('./src/logger');
const messageHandler = require('./src/messageHandler');
const emailService = require('./src/emailService');
const driveService = require('./src/driveService');
const { settings } = require('./src/dataStore');

// Create pino logger for Baileys with custom filtering
const baileysLogger = pino({
    level: 'error',
    transport: {
        target: 'pino/file',
        options: {
            destination: 1, // stdout
        },
        level: 'error'
    }
}).child({});

// Wrap the logger to filter decryption errors
const originalError = baileysLogger.error.bind(baileysLogger);
baileysLogger.error = function (...args) {
    const message = JSON.stringify(args);
    // Suppress common decryption errors that are expected during reconnection
    if (message.includes('Bad MAC') ||
        message.includes('MessageCounterError') ||
        message.includes('failed to decrypt')) {
        return; // Silently ignore these
    }
    originalError(...args);
};

// Authentication directory
const AUTH_DIR = path.join(__dirname, 'auth');

// Connection retry configuration
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max (reduced for faster recovery)
const BASE_RECONNECT_DELAY = 2000; // Start with 2 seconds

// Connection state tracking (prevent multiple simultaneous reconnection attempts)
let isConnecting = false;
let isConnected = false;

/**
 * Calculate exponential backoff delay
 */
function getReconnectDelay() {
    const delay = Math.min(
        BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY
    );
    reconnectAttempts++;
    return delay;
}

/**
 * Reset reconnect attempts on successful connection
 */
function resetReconnectAttempts() {
    reconnectAttempts = 0;
}

/**
 * Check if a message should be processed during catch-up
 * @param {Object} msg - Message object
 * @returns {boolean} True if should process
 */
function shouldProcessCatchupMessage(msg) {
    try {
        // Skip if bot sent it
        if (msg.key.fromMe) return false;

        // Skip if no message content
        if (!msg.message) return false;

        // Skip broadcast/status
        if (msg.key.remoteJid === 'status@broadcast') return false;

        // Skip if too old (>24 hours)
        const msgTime = msg.messageTimestamp * 1000;
        const age = Date.now() - msgTime;
        if (age > 24 * 60 * 60 * 1000) return false;

        // Only process if less than 6 hours old for better relevance
        if (age > 6 * 60 * 60 * 1000) return false;

        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Process missed messages from when bot was offline
 * DISABLED: This function slows down startup significantly.
 * WhatsApp will automatically sync messages, and the bot will respond to new ones.
 * @param {Object} sock - WhatsApp socket
 */
async function processMissedMessages(sock) {
    // DISABLED FOR FASTER STARTUP
    // The bot will respond to new messages automatically.
    // Old messages will be ignored to prevent slow startup and restart loops.
    logger.info('✅ Missed message processing disabled for faster startup');
    logger.info('   Bot will respond to new messages only');
    return;
}


/**
 * Start WhatsApp bot
 */
async function startBot() {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        logger.warn('Connection already in progress, skipping duplicate attempt');
        return;
    }

    isConnecting = true;

    try {
        logger.info('Starting HSM TECH BOT v1.0...');
        logger.info('Loading authentication state...');

        // Load auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

        // Fetch latest Baileys version
        const { version } = await fetchLatestBaileysVersion();
        logger.info(`Using Baileys version: ${version.join('.')}`);

        // Create WhatsApp socket
        const sock = makeWASocket({
            version,
            logger: baileysLogger,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
            },
            printQRInTerminal: false, // We'll handle QR ourselves
            browser: ['HSM Tech Bot', 'Chrome', '3.0.0'],
            getMessage: async (key) => {
                return { conversation: '' };
            }
        });

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Connection update handler
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Display QR code
            if (qr) {
                logger.info('QR Code received! Scan with your WhatsApp:');
                console.log('\n');
                qrcode.generate(qr, { small: true });
                console.log('\n');
                logger.info('Open WhatsApp → Settings → Linked Devices → Link a Device');
                logger.info('Then scan the QR code above');
            }

            // Handle connection state
            if (connection === 'close') {
                isConnected = false;
                isConnecting = false;

                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                const errorCode = lastDisconnect?.error?.output?.statusCode;

                logger.warn('Connection closed', {
                    shouldReconnect,
                    errorCode,
                    reason: DisconnectReason[errorCode] || 'Unknown'
                });

                if (shouldReconnect) {
                    const delay = getReconnectDelay();
                    logger.info(`Reconnecting in ${delay / 1000} seconds...`);

                    setTimeout(() => {
                        startBot();
                    }, delay);
                } else {
                    logger.error('Connection closed permanently. This might be due to a session conflict or seeing "Logged out".');
                    logger.error('Reason:', DisconnectReason[errorCode] || errorCode || 'Unknown');

                    if (errorCode === DisconnectReason.loggedOut || errorCode === 403) {
                        logger.error('CRITICAL: Bot was logged out! You must delete the "auth" folder and re-scan the QR code.');
                        await emailService.sendErrorAlert(
                            'Bot Logged Out',
                            new Error('WhatsApp session was logged out. Manual re-authentication required.')
                        );
                    }
                }
            } else if (connection === 'open') {
                isConnected = true;
                isConnecting = false;
                resetReconnectAttempts();

                logger.info('✅ WhatsApp connection established successfully!');
                logger.info(`Bot Name: ${config.BOT_NAME}`);
                logger.info(`Command Prefix: ${config.BOT_PREFIX}`);
                logger.info(`Admin Numbers: ${config.adminNumbers.length > 0 ? config.adminNumbers.join(', ') : 'None'}`);
                logger.info('Bot is ready to receive messages!');

                // Send startup notification
                await emailService.sendStartupNotification();

                // Initialize Drive Cache in background (don't block ready signal)
                driveService.refreshCache().catch(err => logger.error('Failed to refresh Drive cache', err));

                // Initialize Automation (Restore Timers)
                try {
                    const automation = require('./src/commands/automation');
                    automation.initAutomation(sock);
                    logger.info('✅ Automation schedules restored.');
                } catch (err) {
                    logger.error('Failed to restore automation schedules', err);
                }

                // Signal PM2 that bot is ready (important for stability)
                if (process.send) {
                    process.send('ready');
                    logger.info('✅ PM2 ready signal sent');
                }

                logger.info('Waiting for new messages...');
            } else if (connection === 'connecting') {
                isConnecting = true;
                logger.info('Connecting to WhatsApp...');
            }
        });

        // Track decryption errors to avoid log spam
        let decryptionErrorCount = 0;
        let lastDecryptionErrorTime = 0;
        const DECRYPTION_ERROR_RESET_MS = 60000; // Reset counter after 1 minute

        // Message handler
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (type !== 'notify') return;

                for (const msg of messages) {
                    // Ignore messages from self
                    if (msg.key.fromMe) continue;

                    // Handle message
                    try {
                        await messageHandler.handleMessage(sock, msg);
                    } catch (msgErr) {
                        const errorMessage = msgErr.toString();

                        // Handle decryption errors gracefully
                        if (errorMessage.includes('Bad MAC') ||
                            errorMessage.includes('MessageCounterError') ||
                            errorMessage.includes('SessionError')) {

                            const now = Date.now();

                            // Reset counter if enough time has passed
                            if (now - lastDecryptionErrorTime > DECRYPTION_ERROR_RESET_MS) {
                                decryptionErrorCount = 0;
                            }

                            lastDecryptionErrorTime = now;
                            decryptionErrorCount++;

                            // Only log first occurrence or every 10th error
                            if (decryptionErrorCount === 1) {
                                logger.warn('⚠️ Decryption errors detected for old messages. This is normal during reconnection.');
                                logger.warn('   These messages were encrypted with a previous session and will be skipped.');
                            } else if (decryptionErrorCount % 10 === 0) {
                                logger.warn(`⚠️ ${decryptionErrorCount} decryption errors (old messages being skipped)`);
                            }

                            // If too many errors, suggest re-authentication
                            if (decryptionErrorCount === 50) {
                                logger.error('NOTICE: Many decryption errors detected.');
                                logger.error('If this persists with NEW messages, delete the "auth" folder and re-scan QR code.');
                            }
                        } else {
                            // Log other errors normally
                            logger.error('Error processing message', msgErr);
                        }
                    }
                }
            } catch (err) {
                logger.error('Error in messages.upsert handler', err);
            }
        });

        // Group participant updates
        sock.ev.on('group-participants.update', async (update) => {
            try {
                const { id, participants, action } = update;

                // Check dynamic setting (default to config if not set)
                // Note: 'welcome' is the key used in moderation.js for this feature
                const isWelcomeEnabled = settings.get(`${id}.welcome`, config.FEATURE_WELCOME_MESSAGE);

                if (!isWelcomeEnabled) return;

                if (action === 'add') {
                    for (const participant of participants) {
                        const memberNumber = participant.split('@')[0];

                        const welcomeMsg = `✨ *WELCOME TO THE GROUP!* ✨

👋 @${memberNumber}
We're happy to have you here! 😎

📚 Feel free to chat & study 💬
🚫 No personal inbox messages
🔗 No promotional links
📝 Please introduce yourself!

━━━━━━━━━━━━━━━━━━━━━
👑 *Powered by ${config.BOT_OWNER}*`;

                        try {
                            await sock.sendMessage(id, {
                                text: welcomeMsg,
                                mentions: [participant]
                            });
                            logger.info('Welcome message sent', { member: memberNumber, group: id });
                        } catch (err) {
                            logger.error('Failed to send welcome message', err);
                        }
                    }
                }

                // Goodbye message when members leave
                if (action === 'remove') {
                    for (const participant of participants) {
                        const memberNumber = participant.split('@')[0];

                        const goodbyeMsg = `👋 *GOODBYE!*

@${memberNumber} has left the group.

━━━━━━━━━━━━━━━━━━━━━
_We'll miss you! Take care_ 💙`;

                        try {
                            await sock.sendMessage(id, {
                                text: goodbyeMsg,
                                mentions: [participant]
                            });
                            logger.info('Goodbye message sent', { member: memberNumber, group: id });
                        } catch (err) {
                            // Ignore forbidden errors (bot might have been removed)
                            const errorMessage = err.toString().toLowerCase();
                            if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
                                logger.warn('Cannot send goodbye message: Bot removed or forbidden', { group: id });
                            } else {
                                logger.error('Failed to send goodbye message', err);
                            }
                        }
                    }
                }
            } catch (err) {
                logger.error('Error handling group update', err);
            }
        });

        // Schedule daily reports
        if (config.FEATURE_EMAIL_REPORTS && config.EMAIL_ENABLED) {
            const [hour, minute] = config.EMAIL_REPORT_TIME.split(':').map(Number);

            // Schedule daily at configured time
            schedule.scheduleJob({ hour, minute }, async () => {
                logger.info('Generating daily report...');
                const stats = messageHandler.getStats();
                await emailService.sendDailyReport(stats);
            });

            logger.info(`Daily reports scheduled for ${config.EMAIL_REPORT_TIME}`);
        }

        // Initialize email service
        if (config.EMAIL_ENABLED) {
            emailService.initializeTransporter();
        }

        // Graceful shutdown handler
        const shutdown = async () => {
            logger.info('Shutting down gracefully...');

            try {
                // Send final stats email
                if (config.EMAIL_ENABLED) {
                    const stats = messageHandler.getStats();
                    await emailService.sendEmail(
                        `${config.BOT_NAME} - Shutdown`,
                        `<p>Bot has been shut down.</p><p>Final uptime: ${stats.uptime}</p>`
                    );
                }

                // Close socket
                if (sock) {
                    sock.end();
                }

                logger.info('Shutdown complete');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', err);
                process.exit(1);
            }
        };

        // Register shutdown handlers
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (err) {
        isConnecting = false;
        logger.error('Fatal error starting bot', err);

        // Send error alert
        await emailService.sendErrorAlert('Failed to start bot', err);

        // Retry with exponential backoff
        const delay = getReconnectDelay();
        logger.info(`Retrying in ${delay / 1000} seconds...`);

        setTimeout(() => {
            startBot();
        }, delay);
    }
}

// Display banner
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║         🤖  HSM TECH BOT v1.0  🤖                        ║
║         Professional WhatsApp Automation                  ║
║                                                           ║
║         Google Drive • AI Powered • Termux Ready          ║
║         File Sharing • Spam Protection                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

logger.info('HSM TECH BOT v1.0 - Termux Edition');
logger.info('Environment: ' + config.NODE_ENV);
logger.info('Logging to file: ' + (config.LOG_TO_FILE ? 'enabled' : 'disabled'));

// KEEP-ALIVE SERVER (Native Node.js - No Dependencies)
const http = require('http');
const PORT = process.env.PORT || 3000;

const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('HSM Tech Bot is Active! 🤖');
}).listen(PORT, () => {
    logger.info(`Keep-Alive Server running on port ${PORT}`);

    // Self-ping mechanism to prevent sleeping (reduced to 3 minutes for better health monitoring)
    setInterval(() => {
        http.get(appUrl, (res) => {
            // Connection is healthy
        }).on('error', (err) => {
            logger.error('Self-ping failed', err.message);
        });
    }, 3 * 60 * 1000); // Ping every 3 minutes
});

// GLOBAL ERROR HANDLERS (Prevent silent crashes)
process.on('uncaughtException', (err) => {
    logger.error('CRITICAL: Uncaught Exception:', err);
    // Keep process alive if possible, or exit cleanly. 
    // For a bot, usually better to catch and log than crash 24/7.
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('CRITICAL: Unhandled Rejection:', reason);
});

// Start the bot
startBot();
