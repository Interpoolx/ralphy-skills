import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import fetch from 'cross-fetch';
import matter from 'gray-matter';
import { SkillDefinition, SkillMetadata } from '../types';

// Registry Configuration
const REGISTRY_FILENAME = 'marketplace.json';
const REGISTRY_API_URL = 'https://ralphy-skills-api.rajeshkumarlawyer007.workers.dev/api'; // Production Worker URL
const REGISTRY_FALLBACK_URL = 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json';
const CACHE_FILE = path.join(os.homedir(), '.ralphy', 'registry_cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the path to the bundled skills registry (fallback).
 * Single source of truth: root recommended_skills.json
 */
function getBundledRegistryPath(): string {
    const repoPath = path.join(__dirname, '..', '..', REGISTRY_FILENAME);
    if (fs.existsSync(repoPath)) return repoPath;

    return '';
}

/**
 * Fetch the registry (Remote -> Cache -> Bundled).
 */
/**
 * Fetch the registry (Remote -> Cache -> Bundled).
 * Internal helper to avoid circular export reference issues.
 */
async function _getRegistry(): Promise<SkillDefinition[]> {
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
 * Public accessor for the registry.
 */
export async function getRegistry(): Promise<SkillDefinition[]> {
    return _getRegistry();
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
        https.get(REGISTRY_FALLBACK_URL, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch registry: ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Handle both array and { skills: [...] } formats
                    const skills = Array.isArray(parsed) ? parsed : (parsed.skills || []);
                    resolve(skills as SkillDefinition[]);
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
/**
 * Find a skill by ID or name (case-insensitive).
 * 1. Try Remote API
 * 2. Fallback to full registry (Cache/Bundled)
 */
export async function findSkill(query: string): Promise<SkillDefinition | undefined> {
    const lowerQuery = query.toLowerCase();

    // 1. Try API specific lookup
    try {
        const res = await fetch(`${REGISTRY_API_URL}/skills/${lowerQuery}`);
        if (res.ok) {
            return await res.json() as SkillDefinition;
        }
        // If 404, might be a search query not an ID, proceed to search or local
    } catch (e) {
        // API failed, fallback
    }

    // 2. Fallback to Full Registry (Cache/Bundled)
    const registry = await _getRegistry();
    return registry.find(
        (skill) =>
            skill.id.toLowerCase() === lowerQuery ||
            skill.name.toLowerCase() === lowerQuery ||
            skill.folder_name.toLowerCase() === lowerQuery
    );
}

/**
 * Search skills by query.
 * 1. Try Remote API Search
 * 2. Fallback to full registry filter
 */
export async function searchRegistry(query: string): Promise<SkillDefinition[]> {
    // 1. Try API Search
    try {
        // limit=50 for CLI search
        const res = await fetch(`${REGISTRY_API_URL}/search?q=${encodeURIComponent(query)}&limit=50`);
        if (res.ok) {
            const data = (await res.json()) as { skills?: SkillDefinition[] };
            if (data.skills) {
                return data.skills as SkillDefinition[];
            }
        }
    } catch (e) {
        // API failed, fallback
    }

    // 2. Fallback: Filter local/cached registry
    const registry = await _getRegistry();
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
