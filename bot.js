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

// Create pino logger for Baileys (it requires pino's trace/child methods)
const baileysLogger = pino({ level: 'silent' });

// Authentication directory
const AUTH_DIR = path.join(__dirname, 'auth');

// Connection retry configuration
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000; // 60 seconds max
const BASE_RECONNECT_DELAY = 2000; // Start with 2 seconds

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
 * Start WhatsApp bot
 */
async function startBot() {
    try {
        logger.info('Starting HSM TECH BOT v3.0...');
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
                    logger.error('Logged out! Delete auth folder and restart to reconnect.');
                    await emailService.sendErrorAlert(
                        'Bot logged out - authentication required',
                        new Error('WhatsApp session was logged out')
                    );
                }
            } else if (connection === 'open') {
                resetReconnectAttempts();
                logger.info('✅ WhatsApp connection established successfully!');
                logger.info(`Bot Name: ${config.BOT_NAME}`);
                logger.info(`Command Prefix: ${config.BOT_PREFIX}`);
                logger.info(`Admin Numbers: ${config.adminNumbers.length > 0 ? config.adminNumbers.join(', ') : 'None'}`);
                logger.info('Bot is ready to receive messages!');

                // Send startup notification
                await emailService.sendStartupNotification();
            } else if (connection === 'connecting') {
                logger.info('Connecting to WhatsApp...');
            }
        });

        // Message handler
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (type !== 'notify') return;

                for (const msg of messages) {
                    // Ignore messages from self
                    if (msg.key.fromMe) continue;

                    // Handle message
                    await messageHandler.handleMessage(sock, msg);
                }
            } catch (err) {
                logger.error('Error in message handler', err);
            }
        });

        // Group participant updates
        sock.ev.on('group-participants.update', async (update) => {
            try {
                if (!config.FEATURE_WELCOME_MESSAGE) return;

                const { id, participants, action } = update;

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
                            logger.error('Failed to send goodbye message', err);
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

// Start the bot
startBot();
