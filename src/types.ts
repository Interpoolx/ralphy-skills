/**
 * Represents a skill in the registry.
 */
export interface SkillDefinition {
    id: string;
    name: string;
    url: string;
    description: string;
    folder_name: string;
    category?: string;
    source?: 'registry' | 'github' | 'local';
}

export interface SkillMetadata {
    id: string;
    name: string;
    description: string;
    path: string;
    source: string;
    installedAt: string;
    isSymlink?: boolean;
}

export interface Registry {
    skills: SkillDefinition[];
}

/**
 * Parsed GitHub URL components.
 */
export interface ParsedGitHubUrl {
    owner: string;
    repo: string;
    branch: string;
    pathInRepo: string;
    apiUrl: string;
}

/**
 * GitHub API file/directory entry.
 */
export interface GitHubEntry {
    name: string;
    path: string;
    type: 'file' | 'dir';
    download_url: string | null;
    url: string;
}

/**
 * Result of a skill installation.
 */
export interface InstallResult {
    success: boolean;
    skillName: string;
    filesInstalled: number;
    targetDir: string;
    error?: string;
}
