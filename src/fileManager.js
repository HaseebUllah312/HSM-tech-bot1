/**
 * File Manager Module
 * Handle file operations for VU_Files directory with subfolder support
 * Falls back to Google Drive search when files not found locally
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { isValidFilePath } = require('./security');
const driveService = require('./driveService');

const FILES_DIR = path.join(__dirname, '..', 'VU_Files');

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
}

/**
 * MIME type mapping for common file extensions
 */
const MIME_TYPES = {
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',

    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',

    // Videos
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',

    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',

    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',

    // Code
    '.js': 'text/javascript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++src',
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml'
};

/**
 * Get MIME type for a file based on extension
 * @param {string} fileName - File name
 * @returns {string} MIME type
 */
function getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Recursively get all files in a directory and its subdirectories
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array} Array of file objects
 */
function getAllFilesRecursive(dir, baseDir = dir) {
    let results = [];

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // Recursively scan subdirectories
                results = results.concat(getAllFilesRecursive(fullPath, baseDir));
            } else if (stats.isFile()) {
                // Skip README files and hidden files
                if (item.toLowerCase() === 'readme.md' || item.startsWith('.')) {
                    continue;
                }

                const relativePath = path.relative(baseDir, fullPath);
                results.push({
                    name: item,
                    relativePath: relativePath,
                    size: formatFileSize(stats.size),
                    sizeBytes: stats.size,
                    modified: stats.mtime.toLocaleDateString(),
                    path: fullPath,
                    mimeType: getMimeType(item)
                });
            }
        }
    } catch (err) {
        logger.error('Failed to scan directory', err, { dir });
    }

    return results;
}

/**
 * Get all files in VU_Files directory (including subfolders)
 * @returns {Array} Array of file objects
 */
function listFiles() {
    try {
        const files = getAllFilesRecursive(FILES_DIR);
        return files.map((file, index) => ({
            ...file,
            index: index + 1
        }));
    } catch (err) {
        logger.error('Failed to list files', err);
        return [];
    }
}

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Search files by name (searches in subfolders too)
 * @param {string} query - Search query
 * @returns {Array} Matching files
 */
function searchFiles(query) {
    const allFiles = listFiles();
    const lowerQuery = query.toLowerCase();

    return allFiles.filter(file =>
        file.name.toLowerCase().includes(lowerQuery) ||
        file.relativePath.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get file by name
 * @param {string} fileName - File name
 * @returns {Object|null} File object or null
 */
function getFile(fileName) {
    if (!isValidFilePath(fileName)) {
        logger.warn('Invalid file path attempted', { fileName });
        return null;
    }

    // Search in all files including subfolders
    const allFiles = listFiles();
    const file = allFiles.find(f =>
        f.name.toLowerCase() === fileName.toLowerCase() ||
        f.relativePath.toLowerCase() === fileName.toLowerCase()
    );

    return file || null;
}

/**
 * Get formatted file list as text
 * @returns {string} Formatted file list
 */
function getFormattedFileList() {
    const files = listFiles();

    if (files.length === 0) {
        return '📁 *No files available*\n\nAdd files to the VU_Files directory to share them.';
    }

    let message = '📁 *Available Files*\n\n';

    files.forEach(file => {
        message += `${file.index}. *${file.name}*\n`;
        if (file.relativePath !== file.name) {
            message += `   📂 Path: ${file.relativePath}\n`;
        }
        message += `   📊 Size: ${file.size}\n\n`;
    });

    message += `_Total: ${files.length} file(s)_`;

    return message;
}

/**
 * Get file count
 * @returns {number} Number of files
 */
function getFileCount() {
    const files = listFiles();
    return files.length;
}

/**
 * Get files matching a VU subject code (e.g., CS101, ENG201, MTH302)
 * Searches in file names AND folder names (e.g., VU_Files/CS101/code/file.js)
 * @param {string} subjectCode - Subject code to search for
 * @returns {Array} Array of matching file objects
 */
function getFilesBySubjectCode(subjectCode) {
    if (!subjectCode || typeof subjectCode !== 'string') return [];

    const allFiles = listFiles();
    const code = subjectCode.toUpperCase().trim();

    // Match files where:
    // 1. File name contains the code OR
    // 2. Any folder in the path contains the code
    return allFiles.filter(file => {
        const nameMatch = file.name.toUpperCase().includes(code);
        const pathMatch = file.relativePath.toUpperCase().includes(code);
        return nameMatch || pathMatch;
    });
}

/**
 * Search for files by subject code - local first, then Google Drive
 * @param {string} subjectCode - Subject code like CS101, MTH302
 * @returns {Promise<Object>} Object with local and drive files
 */
async function searchWithDriveFallback(subjectCode) {
    if (!subjectCode || typeof subjectCode !== 'string') {
        return { local: [], drive: [], source: 'none' };
    }

    // First search locally
    const localFiles = getFilesBySubjectCode(subjectCode);

    if (localFiles.length > 0) {
        logger.info(`Found ${localFiles.length} local files for ${subjectCode}`);
        return {
            local: localFiles,
            drive: [],
            source: 'local'
        };
    }

    // Not found locally, search Google Drive
    logger.info(`No local files for ${subjectCode}, searching Google Drive...`);

    try {
        const driveFiles = await driveService.searchBySubjectCode(subjectCode);

        if (driveFiles.length > 0) {
            logger.info(`Found ${driveFiles.length} Drive files for ${subjectCode}`);
            return {
                local: [],
                drive: driveFiles,
                source: 'drive'
            };
        }
    } catch (err) {
        logger.error('Failed to search Google Drive', err);
    }

    return { local: [], drive: [], source: 'none' };
}

/**
 * Download a file from Google Drive
 * @param {Object} file - Drive file object
 * @returns {Promise<Object>} Downloaded file info
 */
async function downloadFromDrive(file) {
    return await driveService.downloadDriveFile(file);
}

/**
 * Search files by query - local first, then Drive fallback
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results with source
 */
async function searchFilesWithDrive(query) {
    if (!query || typeof query !== 'string') {
        return { local: [], drive: [], source: 'none' };
    }

    // First search locally
    const localFiles = searchFiles(query);

    if (localFiles.length > 0) {
        return {
            local: localFiles,
            drive: [],
            source: 'local'
        };
    }

    // Not found locally, search Drive
    try {
        const driveFiles = await driveService.searchDriveFiles(query);
        if (driveFiles.length > 0) {
            return {
                local: [],
                drive: driveFiles,
                source: 'drive'
            };
        }
    } catch (err) {
        logger.error('Failed to search Drive', err);
    }

    return { local: [], drive: [], source: 'none' };
}

module.exports = {
    listFiles,
    searchFiles,
    getFile,
    getFormattedFileList,
    getFileCount,
    getFilesBySubjectCode,
    getMimeType,
    FILES_DIR,
    // New Drive integration
    searchWithDriveFallback,
    searchFilesWithDrive,
    downloadFromDrive
};

