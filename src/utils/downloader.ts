import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { ParsedGitHubUrl, GitHubEntry } from '../types';

/**
 * Parse a GitHub URL into its components.
 * Supports: https://github.com/owner/repo/tree/branch/path
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
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
function fetchJson<T>(url: string): Promise<T> {
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
                } catch (err) {
                    reject(new Error(`Failed to parse JSON from ${url}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Download a file from a URL.
 */
function downloadFile(url: string, destPath: string): Promise<void> {
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
export async function downloadFromGitHub(
    apiUrl: string,
    targetDir: string,
    onFile?: (filename: string) => void
): Promise<number> {
    const entries = await fetchJson<GitHubEntry[]>(apiUrl);
    let filesDownloaded = 0;

    if (!Array.isArray(entries)) {
        // Single file, not a directory
        const entry = entries as unknown as GitHubEntry;
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
        } else if (entry.type === 'dir') {
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
export async function installSkillFromUrl(
    githubUrl: string,
    folderName: string,
    baseDir: string = '.',
    options?: { cursor?: boolean; onFile?: (filename: string) => void }
): Promise<{ success: boolean; filesInstalled: number; targetDir: string }> {
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
