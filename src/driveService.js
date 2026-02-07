/**
 * Google Drive Service Module
 * Handles file search and download from public Google Drive folders
 * Uses Google Drive API v3 with API key (no OAuth required for public folders)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('./config');

// Download directory for temp files
const DOWNLOAD_DIR = path.join(__dirname, '..', 'temp_downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Cache for file listings (refresh every 30 minutes)
let fileCache = {
    files: [],
    lastUpdated: 0
};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Extract folder ID from Google Drive URL or return as-is if already an ID
 */
function extractFolderId(urlOrId) {
    if (!urlOrId) return null;

    // If it's already an ID (no slashes or dots)
    if (/^[a-zA-Z0-9_-]{20,50}$/.test(urlOrId)) {
        return urlOrId;
    }

    // Extract from URL patterns
    const patterns = [
        /\/folders\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Get configured folder IDs from environment or defaults
 */
function getFolderIds() {
    const folderLinks = config.GDRIVE_FOLDER_LINKS || '';
    const ids = [];

    if (folderLinks) {
        const links = folderLinks.split(',').map(s => s.trim()).filter(Boolean);
        for (const link of links) {
            const id = extractFolderId(link);
            if (id) ids.push(id);
        }
    }

    // Default folders if none configured
    if (ids.length === 0) {
        ids.push('11iCga1LlWk5EvpcZykWNr_glURgUeNeo');
    }

    return ids;
}

/**
 * Make HTTPS GET request
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpsGet(res.headers.location).then(resolve).catch(reject);
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Fetch files from a Google Drive folder using the public API
 * Works only for publicly shared folders
 */
async function fetchFolderFilesAPI(folderId, depth = 0, folderPath = '') {
    const MAX_DEPTH = 20; // Allow very deep folder traversal to find all files

    if (depth > MAX_DEPTH) {
        logger.warn(`Max depth ${MAX_DEPTH} reached for folder ${folderId}`);
        return [];
    }

    // Use Gemini API key for Drive API (same Google Cloud project)
    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey) {
        logger.warn('No GEMINI_API_KEY found. Google Drive integration requires an API Key.');
        return [];
    }

    try {
        let allApiFiles = [];
        let pageToken = null;

        // Handle pagination to get ALL files (not just first 1000)
        do {
            const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000${pageParam}`;

            const response = await httpsGet(url);

            if (response.error) {
                // Check for disabled API
                if (response.error.status === 'PERMISSION_DENIED' ||
                    response.error.message?.includes('disabled') ||
                    response.error.details?.some(d => d.reason === 'SERVICE_DISABLED')) {

                    logger.error('GOOGLE DRIVE API IS DISABLED. Please enable it here: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=748791292703');
                    return [];
                }

                logger.warn('Drive API error', { error: response.error.message });
                return [];
            }

            if (!response.files) {
                logger.warn('No files in API response');
                break;
            }

            allApiFiles.push(...response.files);
            pageToken = response.nextPageToken || null;

            if (pageToken) {
                logger.info(`Fetching next page for folder ${folderId}...`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } while (pageToken);

        const files = [];
        const subfolders = [];

        for (const item of allApiFiles) {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
                subfolders.push({
                    id: item.id,
                    name: item.name
                });
            } else {
                files.push({
                    id: item.id,
                    name: item.name,
                    path: folderPath ? `${folderPath}/${item.name}` : item.name,
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${item.id}`,
                    viewUrl: `https://drive.google.com/file/d/${item.id}/view`,
                    size: item.size,
                    source: 'drive'
                });
            }
        }

        logger.info(`Folder ${folderId} (depth ${depth}): Found ${files.length} files, ${subfolders.length} subfolders via API`);

        // Recursively scan ALL subfolders (no limit)
        for (const subfolder of subfolders) {
            try {
                await new Promise(resolve => setTimeout(resolve, 100));
                const newPath = folderPath ? `${folderPath}/${subfolder.name}` : subfolder.name;
                logger.info(`Scanning subfolder: ${newPath} (depth ${depth + 1})`);
                const subFiles = await fetchFolderFilesAPI(subfolder.id, depth + 1, newPath);
                files.push(...subFiles);
            } catch (subErr) {
                logger.warn(`Failed to scan subfolder ${subfolder.name}`, { error: subErr.message });
            }
        }

        return files;

    } catch (err) {
        logger.error('Drive API failed', err);
        return [];
    }
}

/**
 * Fallback: Fetch files using HTML parsing (less reliable)
 */
async function fetchFolderFilesHTML(folderId, depth = 0, folderPath = '') {
    const MAX_DEPTH = 2;

    if (depth > MAX_DEPTH) {
        return [];
    }

    try {
        // Use the main folder URL which contains the data in script tags
        const url = `https://drive.google.com/drive/folders/${folderId}`;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };

        const html = await new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                // If redirect (likely to auth page if private), follow once
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    https.get(res.headers.location, options, (res2) => {
                        let data = '';
                        res2.on('data', c => data += c);
                        res2.on('end', () => resolve(data));
                    }).on('error', reject);
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            }).on('error', reject);
        });

        const files = [];
        const subfolders = [];
        const seenIds = new Set();

        // Matches: ["FILE_ID","FILE_NAME", ... "MIME_TYPE" ...]
        // Broad regex to catch file/folder objects in the minified JSON
        const broadPattern = /\["([a-zA-Z0-9_-]{25,50})","([^"]{1,200})"(?:,[^,\]]*){3,},"([^"]*)"/g;

        let match;
        while ((match = broadPattern.exec(html)) !== null) {
            const id = match[1];
            let name = match[2];
            const mimeType = match[3] || '';

            if (seenIds.has(id)) continue;
            seenIds.add(id);

            // Cleanup name
            try {
                // Handle unicode escapes
                name = name.replace(/\\u([0-9a-fA-F]{4})/g, (m, cc) => String.fromCharCode(parseInt(cc, 16)));
                name = name.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            } catch (e) { }

            // Check if folder
            if (mimeType.includes('folder') || (!mimeType && isValidFolderName(name))) {
                subfolders.push({ id, name });
            }
            // Check if file
            else if (isValidFileName(name)) {
                files.push({
                    id: id,
                    name: name,
                    path: folderPath ? `${folderPath}/${name}` : name,
                    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
                    viewUrl: `https://drive.google.com/file/d/${id}/view`,
                    source: 'drive',
                    mimeType: mimeType
                });
            }
        }

        logger.info(`Folder ${folderId} (HTML): Found ${files.length} files, ${subfolders.length} subfolders`);

        // Recursively scan ALL subfolders (no limit)
        for (const subfolder of subfolders) {
            try {
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay
                const newPath = folderPath ? `${folderPath}/${subfolder.name}` : subfolder.name;
                const subFiles = await fetchFolderFilesHTML(subfolder.id, depth + 1, newPath);
                files.push(...subFiles);
            } catch (err) { }
        }

        return files;

    } catch (err) {
        logger.error('HTML parsing failed', err);
        return [];
    }
}

function isValidFileName(name) {
    return name &&
        name.length > 2 &&
        name !== '...' &&
        /\.(pdf|doc|docx|ppt|pptx|txt|xls|xlsx|zip|rar|7z|jpg|png|mp4|mkv)$/i.test(name);
}

function isValidFolderName(name) {
    return name &&
        name.length > 2 &&
        name !== '...' &&
        !/^[0-9]+$/.test(name) &&
        /^[A-Za-z0-9\s_\-\(\)]+$/.test(name) &&
        !name.includes('.');
}



/**
 * Fetch all files from all configured Drive folders
 */
async function fetchAllDriveFiles(forceRefresh = false) {
    const now = Date.now();

    // Return cached if still valid
    if (!forceRefresh && fileCache.files.length > 0 && (now - fileCache.lastUpdated) < CACHE_DURATION) {
        logger.info(`Returning ${fileCache.files.length} cached files`);
        return fileCache.files;
    }

    logger.info('Refreshing Google Drive file cache...');

    const allFiles = [];
    const folderIds = getFolderIds();

    logger.info(`Scanning ${folderIds.length} Drive folders`);

    for (const folderId of folderIds) {
        try {
            logger.info(`Scanning folder: ${folderId}`);
            const files = await fetchFolderFilesAPI(folderId, 0, '');
            allFiles.push(...files);

            // Rate limit between folders
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            logger.error(`Failed to fetch folder ${folderId}`, err);
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
 * Search for files by query
 * If no results found, refresh cache and try again
 */
async function searchDriveFiles(query) {
    if (!query || typeof query !== 'string') return [];

    const allFiles = await fetchAllDriveFiles();
    const lowerQuery = query.toLowerCase().trim();

    let results = allFiles.filter(file =>
        file.name.toLowerCase().includes(lowerQuery) ||
        (file.path && file.path.toLowerCase().includes(lowerQuery))
    );

    // If no results found, refresh cache and try again
    if (results.length === 0) {
        logger.info(`No results for "${query}", refreshing cache and searching again...`);
        const refreshedFiles = await fetchAllDriveFiles(true);
        results = refreshedFiles.filter(file =>
            file.name.toLowerCase().includes(lowerQuery) ||
            (file.path && file.path.toLowerCase().includes(lowerQuery))
        );
    }

    return results;
}

/**
 * Search by subject code (CS101, MTH302, etc.)
 * If no results found, refresh cache and try again
 */
async function searchBySubjectCode(subjectCode) {
    if (!subjectCode || typeof subjectCode !== 'string') return [];

    const allFiles = await fetchAllDriveFiles();
    const code = subjectCode.toUpperCase().trim();

    let results = allFiles.filter(file => {
        const nameMatch = file.name.toUpperCase().includes(code);
        const pathMatch = file.path && file.path.toUpperCase().includes(code);
        return nameMatch || pathMatch;
    });

    // If no results found, refresh cache and try again
    if (results.length === 0) {
        logger.info(`No results for subject "${subjectCode}", refreshing cache and searching again...`);
        const refreshedFiles = await fetchAllDriveFiles(true);
        results = refreshedFiles.filter(file => {
            const nameMatch = file.name.toUpperCase().includes(code);
            const pathMatch = file.path && file.path.toUpperCase().includes(code);
            return nameMatch || pathMatch;
        });
    }

    return results;
}

/**
 * Download file from Google Drive
 */
async function downloadDriveFile(file) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(DOWNLOAD_DIR, file.name);

        logger.info(`Downloading from Drive: ${file.name}`);

        const downloadWithRedirect = (currentUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                reject(new Error('Too many redirects'));
                return;
            }

            const options = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            https.get(currentUrl, options, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    downloadWithRedirect(res.headers.location, redirectCount + 1);
                    return;
                }

                // Check for Google's virus scan warning page
                if (res.statusCode === 200 && res.headers['content-type']?.includes('text/html')) {
                    let html = '';
                    res.on('data', chunk => html += chunk);
                    res.on('end', () => {
                        const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
                        if (confirmMatch) {
                            const confirmUrl = `${file.downloadUrl}&confirm=${confirmMatch[1]}`;
                            downloadWithRedirect(confirmUrl, redirectCount + 1);
                        } else {
                            // Might be an HTML error page
                            reject(new Error('Download returned HTML instead of file'));
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

        downloadWithRedirect(file.downloadUrl);
    });
}

/**
 * Get MIME type from file name
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
 * Cleanup old downloaded files
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

/**
 * Get file count from cache
 */
function getCachedFileCount() {
    return fileCache.files.length;
}

/**
 * Force refresh the cache
 */
async function refreshCache() {
    return await fetchAllDriveFiles(true);
}

module.exports = {
    searchDriveFiles,
    searchBySubjectCode,
    downloadDriveFile,
    fetchAllDriveFiles,
    getFolderIds,
    getCachedFileCount,
    refreshCache,
    DOWNLOAD_DIR
};
