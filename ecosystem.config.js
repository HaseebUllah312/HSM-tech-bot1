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

        // Auto-restart configuration
        autorestart: true,
        watch: false, // Don't watch for file changes in production
        max_memory_restart: '500M', // Restart if memory exceeds 500MB

        // Restart delay
        restart_delay: 4000, // Wait 4 seconds before restart

        // Exponential backoff restart delay
        exp_backoff_restart_delay: 100,
        max_restarts: 10, // Max 10 restarts in 1 minute window
        min_uptime: '10s', // Consider app started after 10 seconds

        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },

        // Logging
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Advanced features
        instance_var: 'INSTANCE_ID',

        // Graceful shutdown
        kill_timeout: 5000, // Wait 5 seconds for graceful shutdown
        wait_ready: true, // Wait for ready signal
        listen_timeout: 10000, // Wait 10 seconds for listen

        // Cron restart (optional - restart daily at 4 AM)
        // cron_restart: '0 4 * * *',

        // Cluster mode (optional - for scaling, usually not needed for WhatsApp bots)
        // instances: 1,
        // exec_mode: 'cluster'
    }]
};
