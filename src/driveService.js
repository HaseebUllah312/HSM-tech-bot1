/**
 * Google Drive Service Module
 * Handles file search and download from public Google Drive folders
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Google Drive folder IDs (public folders)
const DRIVE_FOLDERS = [
    {
        id: '18niAM0uqjbqSt8sLdp153jPkoDYwPlbi',
        name: 'VU Files 1'
    },
    {
        id: '1gn9vOlBosa4sco-W_NvgGWgCV432sLdu',
        name: 'VU Files 2'
    },
    {
        id: '11iCga1LlWk5EvpcZykWNr_glURgUeNeo',
        name: 'VU Files 3'
    }
];

// Cache for file listings (refresh every 30 minutes)
let fileCache = {
    files: [],
    lastUpdated: 0
};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Download directory for temp files
const DOWNLOAD_DIR = path.join(__dirname, '..', 'temp_downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

/**
 * Make HTTPS request and return response data
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} Response body
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        https.get(url, options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpsGet(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Parse Google Drive folder page to extract file info
 * Note: This is a simplified approach for public folders
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Array>} Array of file objects
 */
async function fetchFolderFiles(folderId) {
    try {
        // Use Google Drive's embed view which is more parseable
        const url = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
        const html = await httpsGet(url);

        const files = [];

        // Extract file entries using regex patterns
        // Pattern for file IDs and names in the embedded view
        const filePattern = /\["([a-zA-Z0-9_-]{25,})","([^"]+)"/g;
        let match;

        while ((match = filePattern.exec(html)) !== null) {
            const fileId = match[1];
            const fileName = match[2];

            // Skip if it looks like a folder ID (based on context)
            if (fileName && !fileName.includes('/')) {
                files.push({
                    id: fileId,
                    name: decodeURIComponent(fileName.replace(/\\u0026/g, '&')),
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
                    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
                    source: 'drive'
                });
            }
        }

        // Alternative pattern for different Drive page formats
        const altPattern = /"([a-zA-Z0-9_-]{28,45})","([^"]+\.(?:pdf|doc|docx|txt|ppt|pptx|zip|rar|xlsx|xls|jpg|png|mp4)[^"]*)"/gi;
        while ((match = altPattern.exec(html)) !== null) {
            const fileId = match[1];
            const fileName = match[2];

            // Check if not already added
            if (!files.find(f => f.id === fileId)) {
                files.push({
                    id: fileId,
                    name: decodeURIComponent(fileName.replace(/\\u0026/g, '&')),
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
                    viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
                    source: 'drive'
                });
            }
        }

        logger.info(`Fetched ${files.length} files from folder ${folderId}`);
        return files;

    } catch (err) {
        logger.error(`Failed to fetch folder ${folderId}`, err);
        return [];
    }
}

/**
 * Fetch all files from all configured Drive folders
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Array>} All files from all folders
 */
async function fetchAllDriveFiles(forceRefresh = false) {
    const now = Date.now();

    // Return cached if still valid
    if (!forceRefresh && fileCache.files.length > 0 && (now - fileCache.lastUpdated) < CACHE_DURATION) {
        return fileCache.files;
    }

    logger.info('Refreshing Google Drive file cache...');

    const allFiles = [];

    for (const folder of DRIVE_FOLDERS) {
        try {
            const files = await fetchFolderFiles(folder.id);
            files.forEach(file => {
                file.folderName = folder.name;
            });
            allFiles.push(...files);
        } catch (err) {
            logger.error(`Failed to fetch folder ${folder.name}`, err);
        }
    }

    // Update cache
    fileCache = {
        files: allFiles,
        lastUpdated: now
    };

    logger.info(`Drive cache updated: ${allFiles.length} files total`);
    return allFiles;
}

/**
 * Search for files in Google Drive by query
 * @param {string} query - Search query (file name or subject code)
 * @returns {Promise<Array>} Matching files
 */
async function searchDriveFiles(query) {
    if (!query || typeof query !== 'string') return [];

    const allFiles = await fetchAllDriveFiles();
    const lowerQuery = query.toLowerCase().trim();

    return allFiles.filter(file =>
        file.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Search Drive files by VU subject code
 * @param {string} subjectCode - Subject code like CS101, MTH302
 * @returns {Promise<Array>} Matching files
 */
async function searchBySubjectCode(subjectCode) {
    if (!subjectCode || typeof subjectCode !== 'string') return [];

    const allFiles = await fetchAllDriveFiles();
    const code = subjectCode.toUpperCase().trim();

    return allFiles.filter(file =>
        file.name.toUpperCase().includes(code)
    );
}

/**
 * Download file from Google Drive
 * @param {Object} file - File object with downloadUrl
 * @returns {Promise<Object>} Object with path and buffer
 */
async function downloadDriveFile(file) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(DOWNLOAD_DIR, file.name);

        logger.info(`Downloading from Drive: ${file.name}`);

        // Direct download URL
        let url = file.downloadUrl;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const downloadWithRedirect = (currentUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                reject(new Error('Too many redirects'));
                return;
            }

            https.get(currentUrl, options, (res) => {
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    downloadWithRedirect(res.headers.location, redirectCount + 1);
                    return;
                }

                // Check for Google's virus scan warning page
                if (res.statusCode === 200 && res.headers['content-type']?.includes('text/html')) {
                    // Need to parse the confirm download link
                    let html = '';
                    res.on('data', chunk => html += chunk);
                    res.on('end', () => {
                        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
                        if (confirmMatch) {
                            const confirmUrl = `${file.downloadUrl}&confirm=${confirmMatch[1]}`;
                            downloadWithRedirect(confirmUrl, redirectCount + 1);
                        } else {
                            // It's actually the file, save it
                            fs.writeFileSync(filePath, html);
                            resolve({
                                path: filePath,
                                buffer: Buffer.from(html),
                                name: file.name,
                                mimeType: getMimeTypeFromName(file.name)
                            });
                        }
                    });
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`Download failed: HTTP ${res.statusCode}`));
                    return;
                }

                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    fs.writeFileSync(filePath, buffer);

                    logger.info(`Downloaded: ${file.name} (${buffer.length} bytes)`);

                    resolve({
                        path: filePath,
                        buffer: buffer,
                        name: file.name,
                        mimeType: getMimeTypeFromName(file.name)
                    });
                });
                res.on('error', reject);
            }).on('error', reject);
        };

        downloadWithRedirect(url);
    });
}

/**
 * Get MIME type from file name
 * @param {string} fileName - File name
 * @returns {string} MIME type
 */
function getMimeTypeFromName(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const types = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.zip': 'application/zip',
        '.rar': 'application/vnd.rar',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.mp4': 'video/mp4'
    };
    return types[ext] || 'application/octet-stream';
}

/**
 * Clean up old downloaded files (older than 1 hour)
 */
function cleanupOldDownloads() {
    try {
        const files = fs.readdirSync(DOWNLOAD_DIR);
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        for (const file of files) {
            const filePath = path.join(DOWNLOAD_DIR, file);
            const stats = fs.statSync(filePath);

            if (stats.mtime.getTime() < oneHourAgo) {
                fs.unlinkSync(filePath);
                logger.info(`Cleaned up old download: ${file}`);
            }
        }
    } catch (err) {
        logger.error('Failed to cleanup downloads', err);
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldDownloads, 30 * 60 * 1000);

module.exports = {
    searchDriveFiles,
    searchBySubjectCode,
    downloadDriveFile,
    fetchAllDriveFiles,
    DRIVE_FOLDERS,
    DOWNLOAD_DIR
};
