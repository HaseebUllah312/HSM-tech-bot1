/**
 * PM2 Process Manager Configuration
 * Optimized for AWS t3.micro (Free Tier) - 1GB RAM
 */

module.exports = {
    apps: [{
        name: 'hsm-tech-bot',
        script: './bot.js',

        // 🟢 CRITICAL OPTIMIZATION FOR FREE TIER (1GB RAM)
        // Limit Node.js memory usage to 800MB to prevent server freezing
        node_args: '--max-old-space-size=800',
        max_memory_restart: '800M', // Restart if it exceeds 800MB

        // 🟢 SINGLE INSTANCE MODE
        // WhatsApp bots cannot run in cluster mode
        instances: 1,
        exec_mode: 'fork',

        // Auto-restart configuration
        autorestart: true,
        watch: false,

        // Restart delay (prevents rapid restart loops)
        restart_delay: 5000, // Wait 5 seconds before restart

        // Exponential backoff restart delay
        exp_backoff_restart_delay: 100,
        max_restarts: 15,
        min_uptime: '120s', // Consider app started after 2 minutes

        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },

        // Logging
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true
    }]
};
