import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { parseGitHubUrl } from './downloader';

/**
 * Git Authentication Manager for private repositories
 */
export interface GitAuthOptions {
    token?: string;
    sshKey?: string;
    sshPassphrase?: string;
    username?: string;
    password?: string;
}

export interface PrivateRepoConfig {
    auth: GitAuthOptions;
    keepAlive?: boolean;
    timeout?: number;
}

/**
 * Parse GitHub URL and determine authentication method
 */
export function parseGitHubAuthUrl(url: string, auth?: GitAuthOptions): {
    finalUrl: string;
    authMethod: 'ssh' | 'token' | 'basic' | 'none';
    authConfig?: PrivateRepoConfig;
} {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
        throw new Error('Invalid GitHub URL format');
    }

    // If it's a private repository format
    if (url.includes('github.com')) {
        const isPrivate = url.includes('.git') || url.includes('private') || url.includes('git@');

        if (auth?.sshKey) {
            // SSH authentication
            const sshUrl = `git@github.com:${parsed.owner}/${parsed.repo}.git`;
            return {
                finalUrl: sshUrl,
                authMethod: 'ssh',
                authConfig: {
                    auth,
                    keepAlive: true,
                    timeout: 30000
                }
            };
        } else if (auth?.token) {
            // Token authentication (HTTPS)
            const tokenUrl = `https://${auth.token}@github.com/${parsed.owner}/${parsed.repo}.git`;
            return {
                finalUrl: tokenUrl,
                authMethod: 'token',
                authConfig: {
                    auth
                }
            };
        } else if (auth?.username && auth?.password) {
            // Basic authentication
            const basicUrl = `https://${auth.username}:${auth.password}@github.com/${parsed.owner}/${parsed.repo}.git`;
            return {
                finalUrl: basicUrl,
                authMethod: 'basic',
                authConfig: {
                    auth
                }
            };
        }
    }

    return {
        finalUrl: url,
        authMethod: 'none'
    };
}

/**
 * Check for existing SSH keys
 */
export function checkForSSHKeys(): { hasKey: boolean; keys: string[] } {
    const sshDir = path.join(os.homedir(), '.ssh');
    const keys: string[] = [];

    if (!fs.existsSync(sshDir)) {
        return { hasKey: false, keys: [] };
    }

    const commonKeyNames = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'];

    for (const keyName of commonKeyNames) {
        const keyPath = path.join(sshDir, keyName);
        if (fs.existsSync(keyPath)) {
            keys.push(keyPath);
        }
    }

    return {
        hasKey: keys.length > 0,
        keys
    };
}

/**
 * Load GitHub token from various sources
 */
export function loadGitHubToken(): string | null {
    // 1. Environment variable
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }

    // 2. GitHub CLI config
    try {
        const ghConfigPath = path.join(os.homedir(), '.config', 'gh', 'hosts.yml');
        if (fs.existsSync(ghConfigPath)) {
            const ghConfig = fs.readFileSync(ghConfigPath, 'utf-8');
            const tokenMatch = ghConfig.match(/oauth_token:\s*(.+)/);
            if (tokenMatch) {
                return tokenMatch[1].trim();
            }
        }
    } catch (err) {
        // Ignore if gh CLI is not installed
    }

    // 3. Git credential store
    try {
        const gitConfigPath = path.join(os.homedir(), '.git-credentials');
        if (fs.existsSync(gitConfigPath)) {
            const credentials = fs.readFileSync(gitConfigPath, 'utf-8');
            const githubMatch = credentials.match(/https:\/\/([^:]+):(.+)@github\.com/);
            if (githubMatch) {
                return githubMatch[2];
            }
        }
    } catch (err) {
        // Ignore if no credentials file
    }

    return null;
}

/**
 * Interactive GitHub authentication prompt
 */
export async function promptForGitAuth(): Promise<GitAuthOptions | null> {
    const { promptUser } = await import('./prompt');

    const { authMethod } = await promptUser([
        {
            type: 'list',
            name: 'authMethod',
            message: 'Select authentication method for private repository:',
            choices: [
                { name: '🔑 GitHub Personal Access Token (Recommended)', value: 'token' },
                { name: '🔐 SSH Key', value: 'ssh' },
                { name: '👤 Username & Password', value: 'basic' },
                { name: '❌ Cancel', value: 'cancel' }
            ]
        }
    ]);

    if (authMethod === 'cancel') {
        return null;
    }

    switch (authMethod) {
        case 'token':
            const { token } = await promptUser([
                {
                    type: 'password',
                    name: 'token',
                    message: 'Enter your GitHub Personal Access Token:',
                    validate: (input: string) => {
                        if (!input || input.length < 40) {
                            return 'Token should be at least 40 characters long';
                        }
                        return true;
                    }
                }
            ]);

            // Save token to environment for this session
            process.env.GITHUB_TOKEN = token;
            return { token };

        case 'ssh':
            const { hasKey } = checkForSSHKeys();
            if (!hasKey) {
                console.log(chalk.yellow('\n⚠️  No SSH keys found in ~/.ssh/'));
                console.log(chalk.gray('Generate an SSH key with: ssh-keygen -t ed25519 -C "your-email@example.com"'));
                return null;
            }

            const { sshPassphrase } = await promptUser([
                {
                    type: 'password',
                    name: 'sshPassphrase',
                    message: 'Enter SSH key passphrase (leave empty if no passphrase):',
                    mask: '*'
                }
            ]);

            return { sshPassphrase: sshPassphrase || undefined };

        case 'basic':
            const { username, password } = await promptUser([
                {
                    type: 'input',
                    name: 'username',
                    message: 'Enter your GitHub username:',
                    validate: (input: string) => {
                        if (!input) return 'Username is required';
                        return true;
                    }
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'Enter your GitHub password (or personal access token):',
                    validate: (input: string) => {
                        if (!input) return 'Password/token is required';
                        return true;
                    }
                }
            ]);

            return { username, password };

        default:
            return null;
    }
}

/**
 * Setup Git environment for private repositories
 */
export function setupGitEnvironment(auth: GitAuthOptions): void {
    // Set Git environment variables
    if (auth.token) {
        process.env.GIT_ASKPASS = 'echo';
        process.env.GITHUB_TOKEN = auth.token;
    }

    if (auth.sshKey) {
        process.env.GIT_SSH_COMMAND = `ssh -i "${auth.sshKey}" -o StrictHostKeyChecking=no`;
    }

    // Configure Git to not prompt for credentials
    process.env.GIT_TERMINAL_PROMPT = '0';
}

/**
 * Validate private repository access
 */
export async function validatePrivateRepoAccess(url: string, auth: GitAuthOptions): Promise<boolean> {
    try {
        const { finalUrl } = parseGitHubAuthUrl(url, auth);
        setupGitEnvironment(auth);

        const { execSync } = require('child_process');

        // Test repository access
        execSync(`git ls-remote ${finalUrl}`, {
            stdio: 'pipe',
            timeout: 10000
        });

        return true;
    } catch (err) {
        console.log(chalk.red('\n❌ Failed to access private repository'));
        console.log(chalk.gray('Please check your credentials and repository access'));
        return false;
    }
}

/**
 * Get repository information from private repo
 */
export async function getPrivateRepoInfo(url: string, auth: GitAuthOptions): Promise<{
    name: string;
    description: string;
    private: boolean;
    defaultBranch: string;
} | null> {
    try {
        const { finalUrl } = parseGitHubAuthUrl(url, auth);
        setupGitEnvironment(auth);

        const { execSync } = require('child_process');

        // Clone to temporary directory to get info
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ralphy-'));
        const repoPath = path.join(tempDir, 'repo');

        execSync(`git clone ${finalUrl} ${repoPath}`, {
            stdio: 'pipe',
            timeout: 30000
        });

        // Read package.json or readme for info
        const packagePath = path.join(repoPath, 'package.json');
        const readmePath = path.join(repoPath, 'README.md');

        let name = path.basename(finalUrl, '.git');
        let description = '';
        let isPrivate = true;
        let defaultBranch = 'main';

        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            name = pkg.name || name;
            description = pkg.description || '';
        } else if (fs.existsSync(readmePath)) {
            const readme = fs.readFileSync(readmePath, 'utf-8');
            const lines = readme.split('\n');
            description = lines[0].replace(/^#\s*/, '').trim();
        }

        // Clean up
        fs.rmSync(repoPath, { recursive: true, force: true });
        fs.rmdirSync(tempDir);

        return {
            name,
            description,
            private: isPrivate,
            defaultBranch
        };
    } catch (err) {
        console.log(chalk.red('\n❌ Failed to get repository information'));
        return null;
    }
}
