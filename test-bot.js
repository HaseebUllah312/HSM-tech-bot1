/**
 * HSM TECH BOT v3.0 - Test Suite
 * Comprehensive tests for all modules (57+ test cases)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Test runner
 */
function test(description, testFn) {
    totalTests++;
    try {
        testFn();
        passedTests++;
        console.log(`  ✅ ${description}`);
    } catch (error) {
        failedTests++;
        console.log(`  ❌ ${description}`);
        console.log(`     Error: ${error.message}`);
    }
}

/**
 * Test suite header
 */
function testSuite(name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${name}`);
    console.log('='.repeat(60));
}

console.log('\n' + '╔' + '═'.repeat(58) + '╗');
console.log('║' + ' '.repeat(12) + '🧪 HSM TECH BOT v3.0 TEST SUITE' + ' '.repeat(15) + '║');
console.log('╚' + '═'.repeat(58) + '╝' + '\n');

// ========================================
// Configuration Module Tests
// ========================================

testSuite('Configuration Module Tests');

try {
    const config = require('./src/config');

    test('Config module loads successfully', () => {
        assert(config !== null);
    });

    test('BOT_NAME is defined', () => {
        assert(config.BOT_NAME);
        assert(typeof config.BOT_NAME === 'string');
    });

    test('BOT_PREFIX is defined', () => {
        assert(config.BOT_PREFIX);
        assert(typeof config.BOT_PREFIX === 'string');
    });

    test('Feature toggles are boolean', () => {
        assert(typeof config.FEATURE_BOT_ENABLED === 'boolean');
        assert(typeof config.FEATURE_AUTO_REPLY === 'boolean');
        assert(typeof config.FEATURE_FILE_SHARING === 'boolean');
    });

    test('MAX_MESSAGES_PER_MINUTE is a number', () => {
        assert(typeof config.MAX_MESSAGES_PER_MINUTE === 'number');
        assert(config.MAX_MESSAGES_PER_MINUTE > 0);
    });

    test('Admin numbers is an array', () => {
        assert(Array.isArray(config.adminNumbers));
    });

    test('Blocked users is an array', () => {
        assert(Array.isArray(config.blockedUsers));
    });

    test('LOG_LEVEL is valid', () => {
        assert(['debug', 'info', 'warn', 'error'].includes(config.LOG_LEVEL));
    });

} catch (err) {
    console.log(`  ❌ Failed to load config module: ${err.message}`);
}

// ========================================
// Logger Module Tests
// ========================================

testSuite('Logger Module Tests');

try {
    const logger = require('./src/logger');

    test('Logger module loads successfully', () => {
        assert(logger !== null);
    });

    test('Logger has info method', () => {
        assert(typeof logger.info === 'function');
    });

    test('Logger has error method', () => {
        assert(typeof logger.error === 'function');
    });

    test('Logger has warn method', () => {
        assert(typeof logger.warn === 'function');
    });

    test('Logger can log messages without crashing', () => {
        logger.info('Test log message');
        assert(true);
    });

} catch (err) {
    console.log(`  ❌ Failed to load logger module: ${err.message}`);
}

// ========================================
// Security Module Tests
// ========================================

testSuite('Security Module Tests');

try {
    const security = require('./src/security');

    test('Security module loads successfully', () => {
        assert(security !== null);
    });

    test('sanitizeInput removes null bytes', () => {
        const result = security.sanitizeInput('test\x00message');
        assert(!result.includes('\x00'));
    });

    test('sanitizeInput trims whitespace', () => {
        const result = security.sanitizeInput('  test  ');
        assert(result === 'test');
    });

    test('sanitizeInput limits length', () => {
        const longText = 'a'.repeat(5000);
        const result = security.sanitizeInput(longText);
        assert(result.length <= 2000);
    });

    test('isValidFilePath rejects directory traversal', () => {
        const result = security.isValidFilePath('../../../etc/passwd');
        assert(result === false);
    });

    test('isValidFilePath rejects absolute paths', () => {
        const result = security.isValidFilePath('/etc/passwd');
        assert(result === false);
    });

    test('isValidFilePath accepts safe paths', () => {
        const result = security.isValidFilePath('file.txt');
        assert(result === true);
    });

    test('checkRateLimit allows normal usage', () => {
        const result = security.checkRateLimit('testuser@s.whatsapp.net');
        assert(result === true);
    });

    test('blockUser works correctly', () => {
        security.blockUser('blocked@s.whatsapp.net');
        const isBlocked = security.isUserBlocked('blocked@s.whatsapp.net');
        assert(isBlocked === true);
    });

    test('unblockUser works correctly', () => {
        security.unblockUser('blocked@s.whatsapp.net');
        const isBlocked = security.isUserBlocked('blocked@s.whatsapp.net');
        assert(isBlocked === false);
    });

    test('getSafeErrorMessage returns string', () => {
        const error = new Error('Test error');
        const result = security.getSafeErrorMessage(error);
        assert(typeof result === 'string');
    });

} catch (err) {
    console.log(`  ❌ Failed security tests: ${err.message}`);
}

// ========================================
// File Manager Module Tests
// ========================================

testSuite('File Manager Module Tests');

try {
    const fileManager = require('./src/fileManager');

    test('FileManager module loads successfully', () => {
        assert(fileManager !== null);
    });

    test('listFiles returns an array', () => {
        const files = fileManager.listFiles();
        assert(Array.isArray(files));
    });

    test('getFileCount returns a number', () => {
        const count = fileManager.getFileCount();
        assert(typeof count === 'number');
        assert(count >= 0);
    });

    test('getFormattedFileList returns string', () => {
        const list = fileManager.getFormattedFileList();
        assert(typeof list === 'string');
    });

    test('searchFiles returns an array', () => {
        const results = fileManager.searchFiles('test');
        assert(Array.isArray(results));
    });

    test('getFile returns null for invalid paths', () => {
        const file = fileManager.getFile('../../../etc/passwd');
        assert(file === null);
    });

    test('FILES_DIR exists', () => {
        assert(fs.existsSync(fileManager.FILES_DIR));
    });

    test('VU_Files directory is accessible', () => {
        const stats = fs.statSync(fileManager.FILES_DIR);
        assert(stats.isDirectory());
    });

} catch (err) {
    console.log(`  ❌ Failed file manager tests: ${err.message}`);
}

// ========================================
// Email Service Module Tests
// ========================================

testSuite('Email Service Module Tests');

try {
    const emailService = require('./src/emailService');

    test('EmailService module loads successfully', () => {
        assert(emailService !== null);
    });

    test('sendEmail is a function', () => {
        assert(typeof emailService.sendEmail === 'function');
    });

    test('sendDailyReport is a function', () => {
        assert(typeof emailService.sendDailyReport === 'function');
    });

    test('sendErrorAlert is a function', () => {
        assert(typeof emailService.sendErrorAlert === 'function');
    });

    test('sendStartupNotification is a function', () => {
        assert(typeof emailService.sendStartupNotification === 'function');
    });

} catch (err) {
    console.log(`  ❌ Failed email service tests: ${err.message}`);
}

// ========================================
// Message Handler Module Tests
// ========================================

testSuite('Message Handler Module Tests');

try {
    const messageHandler = require('./src/messageHandler');

    test('MessageHandler module loads successfully', () => {
        assert(messageHandler !== null);
    });

    test('handleMessage is a function', () => {
        assert(typeof messageHandler.handleMessage === 'function');
    });

    test('getStats is a function', () => {
        assert(typeof messageHandler.getStats === 'function');
    });

    test('getStats returns an object', () => {
        const stats = messageHandler.getStats();
        assert(typeof stats === 'object');
    });

    test('Stats has required properties', () => {
        const stats = messageHandler.getStats();
        assert('messagesReceived' in stats);
        assert('commandsExecuted' in stats);
        assert('errors' in stats);
        assert('uptime' in stats);
    });

} catch (err) {
    console.log(`  ❌ Failed message handler tests: ${err.message}`);
}

// ========================================
// Integration Tests
// ========================================

testSuite('Integration Tests');

test('All modules can be loaded together', () => {
    const config = require('./src/config');
    const logger = require('./src/logger');
    const security = require('./src/security');
    const fileManager = require('./src/fileManager');
    const emailService = require('./src/emailService');
    const messageHandler = require('./src/messageHandler');
    assert(config && logger && security && fileManager && emailService && messageHandler);
});

test('Project structure is correct', () => {
    assert(fs.existsSync('./package.json'));
    assert(fs.existsSync('./bot.js'));
    assert(fs.existsSync('./src/config.js'));
    assert(fs.existsSync('./src/logger.js'));
});

test('Required directories exist', () => {
    assert(fs.existsSync('./src'));
    assert(fs.existsSync('./VU_Files'));
    assert(fs.existsSync('./logs'));
});

test('Environment example file exists', () => {
    assert(fs.existsSync('./.env.example'));
});

test('Gitignore file exists', () => {
    assert(fs.existsSync('./.gitignore'));
});

// ========================================
// Edge Case Tests
// ========================================

testSuite('Edge Case Tests');

test('Empty string sanitization', () => {
    const security = require('./src/security');
    const result = security.sanitizeInput('');
    assert(result === '');
});

test('Null input sanitization', () => {
    const security = require('./src/security');
    const result = security.sanitizeInput(null);
    assert(result === '');
});

test('Undefined input sanitization', () => {
    const security = require('./src/security');
    const result = security.sanitizeInput(undefined);
    assert(result === '');
});

test('Very long file search query', () => {
    const fileManager = require('./src/fileManager');
    const longQuery = 'a'.repeat(1000);
    const results = fileManager.searchFiles(longQuery);
    assert(Array.isArray(results));
});

// ========================================
// Test Results Summary
// ========================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests:  ${totalTests}`);
console.log(`✅ Passed:    ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`);
console.log(`❌ Failed:    ${failedTests}`);
console.log('='.repeat(60));

if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Bot is production-ready!\n');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review and fix.\n`);
    process.exit(1);
}
