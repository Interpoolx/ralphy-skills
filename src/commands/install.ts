import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import { findSkill, loadRegistry, isSkillInstalled } from '../utils/registry';
import { installSkillFromUrl, parseGitHubUrl } from '../utils/downloader';
import { 
    parseGitHubAuthUrl, 
    loadGitHubToken, 
    promptForGitAuth, 
    setupGitEnvironment,
    GitAuthOptions,
    PrivateRepoConfig
} from '../utils/git-auth';

interface InstallOptions {
    dir?: string;
    cursor?: boolean;
    universal?: boolean;
    global?: boolean;
    symlink?: boolean;
    yes?: boolean;
    token?: string;
    sshKey?: string;
    private?: boolean;
}

/**
 * Install a skill by name, GitHub URL, or local path.
 */
export async function installSkill(skillNameOrUrl: string, options: InstallOptions): Promise<void> {
    const isUrl = skillNameOrUrl.includes('github.com') || skillNameOrUrl.startsWith('http');
    const isLocalPath = !isUrl && (skillNameOrUrl.startsWith('.') || skillNameOrUrl.startsWith('/') || skillNameOrUrl.includes('\\'));

    // Determine target directory
    let targetBaseDir = '.';
    if (options.global) {
        targetBaseDir = path.join(os.homedir(), '.ralphy');
    } else if (options.universal) {
        targetBaseDir = path.resolve('.agent');
    } else {
        // Default to project-local (.claude/skills or .agent/skills)
        targetBaseDir = fs.existsSync('.agent') ? '.agent' : '.claude';
    }

    const skillsDir = options.global ? path.join(targetBaseDir, 'skills') : path.join(targetBaseDir, 'skills');

    if (isLocalPath) {
        await installFromLocal(skillNameOrUrl, skillsDir, options);
    } else if (isUrl) {
        await installFromUrl(skillNameOrUrl, skillsDir, options);
    } else {
        await installFromRegistry(skillNameOrUrl, skillsDir, options);
    }
}

async function installFromLocal(localPath: string, skillsDir: string, options: InstallOptions) {
    const sourcePath = path.resolve(localPath);
    if (!fs.existsSync(sourcePath)) {
        console.error(chalk.red(`\n❌ Local path not found: ${localPath}`));
        process.exit(1);
    }

    const folderName = path.basename(sourcePath);
    const targetPath = path.join(skillsDir, folderName);

    if (!fs.existsSync(skillsDir)) fs.mkdirSync(skillsDir, { recursive: true });

    console.log(chalk.gray(`Installing from: ${localPath}`));

    if (options.symlink) {
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        fs.symlinkSync(sourcePath, targetPath, 'junction');
        console.log(chalk.green(`\n✅ Symlinked: ${folderName}`));
    } else {
        fs.cpSync(sourcePath, targetPath, { recursive: true });
        console.log(chalk.green(`\n✅ Copied: ${folderName}`));
    }
}

async function installFromUrl(url: string, skillsDir: string, options: InstallOptions) {
    let auth: GitAuthOptions | undefined;
    
    // Check if this is a private repository
    const isPrivateRepo = options.private || 
                          url.includes('.git') || 
                          url.includes('private') || 
                          url.includes('git@') ||
                          !loadGitHubToken(); // No public token available

    if (isPrivateRepo) {
        // Get authentication credentials
        const credentials = await getAuthCredentials(url, options);
        if (!credentials) {
            console.log(chalk.red('\n❌ Authentication required for private repository'));
            process.exit(1);
        }
        auth = credentials;
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
        console.log(chalk.red('✗ Invalid GitHub URL'));
        process.exit(1);
    }
    
    const folderName = generateFolderName(parsed.owner, parsed.repo, parsed.pathInRepo);

    console.log(chalk.gray(`Installing from URL: ${url}`));

    // Setup authentication if provided
    if (auth) {
        setupGitEnvironment(auth);
    }

    const result = await installSkillFromUrl(url, folderName, path.dirname(skillsDir), {
        cursor: options.cursor,
        onFile: (filename) => console.log(chalk.gray(`  └─ ${filename}`)),
    });

    console.log(chalk.green(`\n✅ Installed: ${folderName}`));
}

async function installFromRegistry(name: string, skillsDir: string, options: InstallOptions) {
    console.log(chalk.gray(`Searching registry for: ${name}...`));
    const skill = await findSkill(name);

    if (!skill) {
        console.log(chalk.red(`✗ Skill "${name}" not found in registry`));
        console.log(chalk.gray('Try searching with: npx ralphy-skills search <query>'));
        process.exit(1);
    }

    console.log(chalk.gray(`Found: ${skill.name}`));
    console.log(chalk.gray(`Installing from: ${skill.url}`));

    // Check if the registry skill URL requires authentication
    let auth: GitAuthOptions | undefined;
    if (skill.url.includes('github.com') && (skill.url.includes('.git') || skill.url.includes('private'))) {
        const credentials = await getAuthCredentials(skill.url, options);
        auth = credentials || undefined;
    }

    if (auth) {
        setupGitEnvironment(auth);
    }

    await installSkillFromUrl(skill.url, skill.folder_name, path.dirname(skillsDir), {
        cursor: options.cursor,
        onFile: (filename) => console.log(chalk.gray(`  └─ ${filename}`)),
    });

    console.log(chalk.green(`\n✅ Installed: ${skill.name}`));
}

async function getAuthCredentials(url: string, options: InstallOptions): Promise<GitAuthOptions | null> {
    // If credentials provided via options, use them
    if (options.token || options.sshKey) {
        return {
            token: options.token,
            sshKey: options.sshKey
        };
    }

    // Try to load existing GitHub token
    const existingToken = loadGitHubToken();
    if (existingToken && !options.private) {
        return { token: existingToken };
    }

    // Prompt user for credentials
    console.log(chalk.yellow('\n🔐 Private repository detected - authentication required'));
    return await promptForGitAuth();
}

/**
 * Generate a folder name from GitHub URL components.
 */
function generateFolderName(owner: string, repo: string, pathInRepo: string): string {
    const allParts = [repo, ...pathInRepo.split('/').filter((p) => p && p.length > 0)];
    const skillsPatternMatch = allParts.find((part) => /^[\w]+-skills$/i.test(part));
    if (skillsPatternMatch) return skillsPatternMatch.toLowerCase();

    const rulesPatternMatch = allParts.find((part) => /^[\w]+-rules$/i.test(part));
    if (rulesPatternMatch) return rulesPatternMatch.toLowerCase().replace(/-rules$/, '-skills');

    return `${owner.toLowerCase()}-${repo.toLowerCase()}`.replace(/\//g, '-');
}
