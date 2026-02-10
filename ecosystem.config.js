/**
 * PM2 Process Manager Configuration
 * For 24/7 uptime on AWS EC2/Lightsail
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
    apps: [{
        name: 'hsm-tech-bot',
        script: './bot.js',

        // Auto-restart configuration (optimized for 24/7 stability)
        autorestart: true,
        watch: false, // Don't watch for file changes in production
        max_memory_restart: '1G', // Restart only if memory exceeds 1GB (prevents unnecessary restarts)

        // Restart delay (prevents rapid restart loops)
        restart_delay: 5000, // Wait 5 seconds before restart

        // Exponential backoff restart delay
        exp_backoff_restart_delay: 100,
        max_restarts: 15, // Max 15 restarts in 15 minute window
        min_uptime: '120s', // Consider app started after 2 minutes (better stability)

        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },

        // Logging with rotation
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        log_type: 'json',
        max_log_size: '10M',
        log_rotate_count: 5,

        // Advanced features
        instance_var: 'INSTANCE_ID',

        // Graceful shutdown
        kill_timeout: 10000, // Wait 10 seconds for graceful shutdown
        wait_ready: true, // Wait for ready signal from bot
        listen_timeout: 30000, // Wait 30 seconds for listen (WhatsApp needs more time)

        // NO CRON RESTART - Keep bot online 24/7 without interruptions

        // Single instance mode (WhatsApp bots cannot run in cluster)
        instances: 1,
        exec_mode: 'fork'
    }]
};
