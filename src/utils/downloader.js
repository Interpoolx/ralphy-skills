"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGitHubUrl = parseGitHubUrl;
exports.downloadFromGitHub = downloadFromGitHub;
exports.installSkillFromUrl = installSkillFromUrl;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse a GitHub URL into its components.
 * Supports: https://github.com/owner/repo/tree/branch/path
 */
function parseGitHubUrl(url) {
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }
    const regex = /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(?:\/(.+))?)?/;
    const match = normalizedUrl.match(regex);
    if (!match) {
        return null;
    }
    const [, owner, repo, branch = 'main', pathInRepo = ''] = match;
    let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    if (pathInRepo) {
        apiUrl += `/${pathInRepo}`;
    }
    if (branch !== 'main') {
        apiUrl += `?ref=${branch}`;
    }
    return {
        owner,
        repo: repo.replace(/\.git$/, ''),
        branch,
        pathInRepo,
        apiUrl,
    };
}
/**
 * Make an HTTPS GET request and return JSON.
 */
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'ralphy-skills-cli/1.0',
                Accept: 'application/vnd.github.v3+json',
            },
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (err) {
                    reject(new Error(`Failed to parse JSON from ${url}`));
                }
            });
        }).on('error', reject);
    });
}
/**
 * Download a file from a URL.
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const file = fs.createWriteStream(destPath);
        https.get(url, { headers: { 'User-Agent': 'ralphy-skills-cli/1.0' } }, (res) => {
            // Handle redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = res.headers.location;
                if (redirectUrl) {
                    downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
                    return;
                }
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Clean up
            reject(err);
        });
    });
}
/**
 * Recursively download all files from a GitHub directory.
 */
async function downloadFromGitHub(apiUrl, targetDir, onFile) {
    const entries = await fetchJson(apiUrl);
    let filesDownloaded = 0;
    if (!Array.isArray(entries)) {
        // Single file, not a directory
        const entry = entries;
        if (entry.download_url) {
            const destPath = path.join(targetDir, entry.name);
            await downloadFile(entry.download_url, destPath);
            onFile?.(entry.name);
            return 1;
        }
        return 0;
    }
    for (const entry of entries) {
        if (entry.type === 'file' && entry.download_url) {
            const destPath = path.join(targetDir, entry.name);
            await downloadFile(entry.download_url, destPath);
            onFile?.(entry.name);
            filesDownloaded++;
        }
        else if (entry.type === 'dir') {
            // Recursively download subdirectory
            const subDir = path.join(targetDir, entry.name);
            const subCount = await downloadFromGitHub(entry.url, subDir, onFile);
            filesDownloaded += subCount;
        }
    }
    return filesDownloaded;
}
/**
 * Install a skill from a GitHub URL to a local directory.
 */
async function installSkillFromUrl(githubUrl, folderName, baseDir = '.', options) {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
        throw new Error(`Invalid GitHub URL: ${githubUrl}`);
    }
    // Install to .agent/skills/
    const agentSkillsDir = path.join(baseDir, '.agent', 'skills', folderName);
    const filesInstalled = await downloadFromGitHub(parsed.apiUrl, agentSkillsDir, options?.onFile);
    // Optionally also install to .cursor/rules/
    if (options?.cursor) {
        const cursorDir = path.join(baseDir, '.cursor', 'rules', folderName);
        await downloadFromGitHub(parsed.apiUrl, cursorDir);
    }
    return {
        success: true,
        filesInstalled,
        targetDir: agentSkillsDir,
    };
}
//# sourceMappingURL=downloader.js.map