import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import matter from 'gray-matter';
import { SkillDefinition, SkillMetadata } from '../types';

// Registry Configuration
const REGISTRY_FILENAME = 'recommended_skills.json';
const REGISTRY_URL = 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/recommended_skills.json';
const CACHE_FILE = path.join(os.homedir(), '.ralphy', 'registry_cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the path to the bundled skills registry (fallback).
 */
function getBundledRegistryPath(): string {
    const bundledPath = path.join(__dirname, '..', '..', 'data', REGISTRY_FILENAME);
    if (fs.existsSync(bundledPath)) return bundledPath;

    const repoPath = path.join(__dirname, '..', '..', '..', REGISTRY_FILENAME);
    if (fs.existsSync(repoPath)) return repoPath;

    return '';
}

/**
 * Fetch the registry (Remote -> Cache -> Bundled).
 */
export async function getRegistry(): Promise<SkillDefinition[]> {
    // 1. Try to fetch from remote if cache is old or missing
    try {
        if (shouldRefreshCache()) {
            const remoteSkills = await fetchRemoteRegistry();
            saveToCache(remoteSkills);
            return remoteSkills;
        }
    } catch (error) {
        // Silently fail remote fetch and fall back to cache/bundled
    }

    // 2. Try to load from cache
    if (fs.existsSync(CACHE_FILE)) {
        try {
            const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            return cache.skills;
        } catch (e) {
            // Corrupt cache, ignore
        }
    }

    // 3. Fallback to bundled
    return loadBundledRegistry();
}

/**
 * Synchronous load for legacy support or strictly local needs.
 * Prefers cache if available, otherwise bundled.
 */
export function loadRegistry(): SkillDefinition[] {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
            return cache.skills;
        } catch (e) {
            // Ignore
        }
    }
    return loadBundledRegistry();
}

function loadBundledRegistry(): SkillDefinition[] {
    const registryPath = getBundledRegistryPath();
    if (registryPath && fs.existsSync(registryPath)) {
        const content = fs.readFileSync(registryPath, 'utf8');
        return JSON.parse(content) as SkillDefinition[];
    }
    return [];
}

/**
 * Check if cache needs refreshing.
 */
function shouldRefreshCache(): boolean {
    if (!fs.existsSync(CACHE_FILE)) return true;
    try {
        const stats = fs.statSync(CACHE_FILE);
        const age = Date.now() - stats.mtimeMs;
        return age > CACHE_TTL_MS;
    } catch (e) {
        return true;
    }
}

/**
 * Save skills to local cache.
 */
function saveToCache(skills: SkillDefinition[]) {
    const cacheDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ skills, timestamp: Date.now() }, null, 2));
}

/**
 * Fetch registry from GitHub.
 */
function fetchRemoteRegistry(): Promise<SkillDefinition[]> {
    return new Promise((resolve, reject) => {
        https.get(REGISTRY_URL, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch registry: ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const skills = JSON.parse(data) as SkillDefinition[];
                    resolve(skills);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => reject(e));
    });
}

/**
 * Find a skill by ID or name (case-insensitive).
 */
export async function findSkill(query: string): Promise<SkillDefinition | undefined> {
    const registry = await getRegistry();
    const lowerQuery = query.toLowerCase();

    return registry.find(
        (skill) =>
            skill.id.toLowerCase() === lowerQuery ||
            skill.name.toLowerCase() === lowerQuery ||
            skill.folder_name.toLowerCase() === lowerQuery
    );
}

/**
 * Search skills by query (matches name or description).
 */
export async function searchRegistry(query: string): Promise<SkillDefinition[]> {
    const registry = await getRegistry();
    const lowerQuery = query.toLowerCase();

    return registry.filter(
        (skill) =>
            skill.name.toLowerCase().includes(lowerQuery) ||
            skill.description.toLowerCase().includes(lowerQuery) ||
            skill.id.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get all possible skill locations.
 */
export function getSkillLocations(baseDir: string = '.'): { name: string; path: string }[] {
    return [
        { name: 'Universal', path: path.resolve(baseDir, '.agent', 'skills') },
        { name: 'Claude', path: path.resolve(baseDir, '.claude', 'skills') },
        { name: 'Global', path: path.resolve(os.homedir(), '.ralphy', 'skills') }
    ];
}

/**
 * Get detailed metadata for all installed skills.
 */
export function getInstalledSkillsMetadata(baseDir: string = '.'): SkillMetadata[] {
    const locations = getSkillLocations(baseDir);
    const skills: SkillMetadata[] = [];
    const seenNames = new Set<string>();

    for (const location of locations) {
        if (!fs.existsSync(location.path)) continue;

        const folders = fs.readdirSync(location.path);
        for (const folder of folders) {
            const skillPath = path.join(location.path, folder);
            const stats = fs.lstatSync(skillPath);

            if (stats.isDirectory() || stats.isSymbolicLink()) {
                const skillFile = path.join(skillPath, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    try {
                        const content = fs.readFileSync(skillFile, 'utf8');
                        const parsed = matter(content);
                        const data = parsed.data;

                        const name = data.name || folder;
                        if (seenNames.has(name)) continue;
                        seenNames.add(name);

                        skills.push({
                            id: data.id || folder,
                            name: name,
                            description: data.description || '',
                            path: skillPath,
                            source: location.name,
                            installedAt: stats.birthtime.toISOString(),
                            isSymlink: stats.isSymbolicLink()
                        });
                    } catch (e) {
                        // Skip invalid skill files
                    }
                }
            }
        }
    }

    return skills;
}

/**
 * Check if a skill is installed.
 */
export function isSkillInstalled(skillFolderName: string, baseDir: string = '.'): boolean {
    const metadata = getInstalledSkillsMetadata(baseDir);
    return metadata.some(s => s.id === skillFolderName || s.name === skillFolderName);
}
