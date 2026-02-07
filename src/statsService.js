/**
 * Stats Service Module
 * Centralized statistics and activity logging
 */

const logger = require('./logger');

class StatsService {
    constructor() {
        this.stats = {
            startTime: Date.now(),
            messagesReceived: 0,
            commandsExecuted: 0,
            errors: 0,
            activeGroups: 0
        };

        // Activity Logs (In-Memory, limited size)
        this.commandLog = []; // { time, command, user, group, args }
        this.fileShareLog = []; // { time, fileName, user, group, status }
        this.errorLog = []; // { time, error, context }

        this.MAX_LOG_SIZE = 100;
    }

    /**
     * Increment message counter
     */
    incrementMessageCount() {
        this.stats.messagesReceived++;
    }

    /**
     * Log a command execution
     */
    logCommand(command, user, group, args = []) {
        this.stats.commandsExecuted++;

        const entry = {
            time: new Date(),
            command: command,
            user: user ? user.split('@')[0] : 'Unknown', // Store number only
            group: group || 'DM',
            args: args.join(' ')
        };

        this.commandLog.unshift(entry);
        if (this.commandLog.length > this.MAX_LOG_SIZE) {
            this.commandLog.pop();
        }
    }

    /**
     * Log a file share event
     */
    logFileShare(fileName, user, group, status = 'Sent') {
        const entry = {
            time: new Date(),
            fileName: fileName,
            user: user ? user.split('@')[0] : 'Unknown',
            group: group || 'DM',
            status: status
        };

        this.fileShareLog.unshift(entry);
        if (this.fileShareLog.length > this.MAX_LOG_SIZE) {
            this.fileShareLog.pop();
        }
    }

    /**
     * Log an error
     */
    logError(error, context = '') {
        this.stats.errors++;

        const entry = {
            time: new Date(),
            error: error.message || error.toString(),
            context: context
        };

        this.errorLog.unshift(entry);
        if (this.errorLog.length > this.MAX_LOG_SIZE) {
            this.errorLog.pop();
        }
    }

    /**
     * Get uptime string
     */
    getUptime() {
        const seconds = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${secs}s`);

        return parts.join(' ');
    }

    /**
     * Get full stats object for reporting
     */
    getStats() {
        return {
            ...this.stats,
            uptime: this.getUptime(),
            recentCommands: this.commandLog,
            recentFileShares: this.fileShareLog,
            recentErrors: this.errorLog
        };
    }
}

// Singleton instance
const statsService = new StatsService();
module.exports = statsService;
