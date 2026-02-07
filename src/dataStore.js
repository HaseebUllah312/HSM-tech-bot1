/**
 * Data Persistence Layer
 * Simple JSON-based storage for bot settings, warnings, and other dynamic data.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DataStore {
    constructor(filename) {
        this.filename = filename;
        this.filePath = path.join(DATA_DIR, `${filename}.json`);
        this.data = {};
        this.load();
    }

    /**
     * Load data from disk
     */
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const fileContent = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(fileContent);
            } else {
                this.data = {};
                this.save();
            }
        } catch (err) {
            logger.error(`Failed to load data for ${this.filename}`, err);
            this.data = {};
        }
    }

    /**
     * Save data to disk
     */
    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (err) {
            logger.error(`Failed to save data for ${this.filename}`, err);
        }
    }

    /**
     * Get a value
     * @param {string} key - Key to retrieve
     * @param {any} defaultValue - Default value if key not found
     */
    get(key, defaultValue = undefined) {
        return this.data[key] !== undefined ? this.data[key] : defaultValue;
    }

    /**
     * Set a value and save
     * @param {string} key - Key to set
     * @param {any} value - Value to set
     */
    set(key, value) {
        this.data[key] = value;
        this.save();
    }

    /**
     * Delete a key
     * @param {string} key - Key to delete
     */
    delete(key) {
        delete this.data[key];
        this.save();
    }

    /**
     * Check if key exists
     * @param {string} key - Key to check
     */
    has(key) {
        return Object.prototype.hasOwnProperty.call(this.data, key);
    }

    /**
     * Get all data
     */
    getAll() {
        return { ...this.data };
    }
}

// Singleton instances for different data types
const stores = {
    settings: new DataStore('settings'), // Group specific settings (antilink, etc.)
    warnings: new DataStore('warnings'), // User warnings
    vip: new DataStore('vip')            // Locked users, etc.
};

module.exports = stores;
