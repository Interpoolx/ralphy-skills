import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

interface LockFileEntry {
    id: string;
    name: string;
    version: string;
    source: 'registry' | 'github' | 'local';
    url?: string;
    commit?: string;
    installedAt: string;
    checksum?: string;
}

interface LockFile {
    version: '1.0.0';
    generatedAt: string;
    skills: LockFileEntry[];
}

const LOCK_FILE_NAME = 'skills-lock.json';

/**
 * Generate lock file from installed skills.
 */
export async function generateLockFile(options: { output?: string } = {}): Promise<void> {
    console.log(chalk.cyan.bold('\n🔒 Generate Skills Lock File\n'));

    const skills = getInstalledSkillsMetadata();

    if (skills.length === 0) {
        console.log(chalk.yellow('⚠️  No skills installed.'));
        console.log(chalk.gray('Install skills first with: npx ralphy-skills install <skill-name>'));
        return;
    }

    const lockFile: LockFile = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        skills: skills.map(skill => ({
            id: skill.id,
            name: skill.name,
            version: '1.0.0', // TODO: Get actual version from skill metadata
            source: determineSource(skill.source),
            url: skill.source.startsWith('http') ? skill.source : undefined,
            installedAt: skill.installedAt
        }))
    };

    const outputPath = options.output || path.join(process.cwd(), LOCK_FILE_NAME);
    fs.writeFileSync(outputPath, JSON.stringify(lockFile, null, 2));

    console.log(chalk.green(`✅ Lock file generated: ${outputPath}`));
    console.log(chalk.gray(`   Contains ${lockFile.skills.length} skill(s)`));
    console.log('');
    console.log(chalk.bold('Skills locked:'));
    lockFile.skills.forEach(skill => {
        console.log(`  📦 ${skill.name} (${skill.source})`);
    });
    console.log('');
    console.log(chalk.gray('💡 Commit this file to version control for reproducible installations.'));
}

function determineSource(source: string): 'registry' | 'github' | 'local' {
    if (source.includes('github.com')) return 'github';
    if (source.startsWith('/') || source.startsWith('.')) return 'local';
    return 'registry';
}

/**
 * Restore skills from lock file.
 */
export async function restoreFromLockFile(lockFilePath?: string): Promise<void> {
    console.log(chalk.cyan.bold('\n🔓 Restore Skills from Lock File\n'));

    const targetPath = lockFilePath || path.join(process.cwd(), LOCK_FILE_NAME);

    if (!fs.existsSync(targetPath)) {
        console.log(chalk.red(`❌ Lock file not found: ${targetPath}`));
        console.log(chalk.gray('Generate one with: npx ralphy-skills lock'));
        return;
    }

    let lockFile: LockFile;
    try {
        const content = fs.readFileSync(targetPath, 'utf-8');
        lockFile = JSON.parse(content);
    } catch (err: any) {
        console.log(chalk.red(`❌ Invalid lock file: ${err.message}`));
        return;
    }

    console.log(chalk.gray(`Lock file generated: ${lockFile.generatedAt}`));
    console.log(chalk.gray(`Skills to restore: ${lockFile.skills.length}\n`));

    const { installSkill } = await import('./install');

    let successCount = 0;
    let failCount = 0;

    for (const skill of lockFile.skills) {
        console.log(chalk.gray(`  Installing ${skill.name}...`));
        try {
            const installSource = skill.url || skill.id;
            await installSkill(installSource, { universal: true, yes: true });
            successCount++;
            console.log(chalk.green(`  ✅ ${skill.name}`));
        } catch (err: any) {
            failCount++;
            console.log(chalk.red(`  ❌ ${skill.name}: ${err.message}`));
        }
    }

    console.log('');
    console.log(chalk.green.bold(`✨ Restore complete!`));
    console.log(chalk.gray(`   Success: ${successCount}, Failed: ${failCount}`));
}

/**
 * Check if lock file needs updating.
 */
export async function checkLockFile(): Promise<void> {
    console.log(chalk.cyan.bold('\n🔍 Check Lock File Status\n'));

    const lockPath = path.join(process.cwd(), LOCK_FILE_NAME);

    if (!fs.existsSync(lockPath)) {
        console.log(chalk.yellow('⚠️  No lock file found.'));
        console.log(chalk.gray('Generate one with: npx ralphy-skills lock'));
        return;
    }

    let lockFile: LockFile;
    try {
        const content = fs.readFileSync(lockPath, 'utf-8');
        lockFile = JSON.parse(content);
    } catch (err: any) {
        console.log(chalk.red(`❌ Invalid lock file: ${err.message}`));
        return;
    }

    const installed = getInstalledSkillsMetadata();
    const lockedIds = new Set(lockFile.skills.map(s => s.id));
    const installedIds = new Set(installed.map(s => s.id));

    // Find differences
    const added = installed.filter(s => !lockedIds.has(s.id));
    const removed = lockFile.skills.filter(s => !installedIds.has(s.id));

    if (added.length === 0 && removed.length === 0) {
        console.log(chalk.green('✅ Lock file is up to date!'));
        console.log(chalk.gray(`   ${lockFile.skills.length} skill(s) in sync`));
    } else {
        console.log(chalk.yellow('⚠️  Lock file is out of sync:\n'));

        if (added.length > 0) {
            console.log(chalk.green('  + New skills (not in lock file):'));
            added.forEach(s => console.log(chalk.green(`    + ${s.name}`)));
        }

        if (removed.length > 0) {
            console.log(chalk.red('  - Removed skills (in lock file but not installed):'));
            removed.forEach(s => console.log(chalk.red(`    - ${s.name}`)));
        }

        console.log('');
        console.log(chalk.gray('Run `npx ralphy-skills lock` to update the lock file.'));
    }
}

/**
 * Main lock command handler.
 */
export async function manageLock(action?: string, lockPath?: string): Promise<void> {
    switch (action) {
        case 'generate':
        case undefined:
            await generateLockFile();
            break;
        case 'restore':
            await restoreFromLockFile(lockPath);
            break;
        case 'check':
            await checkLockFile();
            break;
        default:
            console.log(chalk.cyan.bold('\n🔒 Ralphy Skills Lock\n'));
            console.log(chalk.bold('Usage:'));
            console.log(chalk.gray('  npx ralphy-skills lock            Generate lock file'));
            console.log(chalk.gray('  npx ralphy-skills lock restore    Restore from lock file'));
            console.log(chalk.gray('  npx ralphy-skills lock check      Check lock file status'));
            console.log('');
    }
}
