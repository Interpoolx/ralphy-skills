import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface SkillManifestEntry {
    name?: string;
    url?: string;
    id?: string;
    version?: string;
}

interface SkillManifest {
    skills: SkillManifestEntry[];
    options?: {
        scope?: 'universal' | 'global' | 'project';
        force?: boolean;
    };
}

/**
 * Import skills from a manifest file.
 */
export async function importFromManifest(manifestPath?: string, options: { force?: boolean; yes?: boolean } = {}): Promise<void> {
    console.log(chalk.cyan.bold('\n📥 Import Skills from Manifest\n'));

    // Find manifest file
    const possiblePaths = manifestPath
        ? [manifestPath]
        : ['skills.json', 'ralphy-skills.json', '.ralphy/skills.json'];

    let foundPath: string | undefined;
    for (const p of possiblePaths) {
        const fullPath = path.resolve(p);
        if (fs.existsSync(fullPath)) {
            foundPath = fullPath;
            break;
        }
    }

    if (!foundPath) {
        console.log(chalk.red('❌ Manifest file not found.'));
        console.log(chalk.gray('Searched for: skills.json, ralphy-skills.json, .ralphy/skills.json'));
        console.log(chalk.gray('Or specify a path: npx ralphy-skills import <path>'));
        return;
    }

    console.log(chalk.gray(`Manifest: ${foundPath}\n`));

    // Parse manifest
    let manifest: SkillManifest;
    try {
        const content = fs.readFileSync(foundPath, 'utf-8');
        manifest = JSON.parse(content);
    } catch (err: any) {
        console.log(chalk.red(`❌ Invalid manifest: ${err.message}`));
        return;
    }

    if (!manifest.skills || !Array.isArray(manifest.skills)) {
        console.log(chalk.red('❌ Invalid manifest: skills array not found'));
        console.log(chalk.gray('Expected format: { "skills": [{ "url": "..." }, ...] }'));
        return;
    }

    console.log(chalk.bold(`📦 Skills to import: ${manifest.skills.length}\n`));
    manifest.skills.forEach((skill, i) => {
        const name = skill.name || skill.id || skill.url || 'Unknown';
        console.log(`  ${i + 1}. ${name}`);
    });
    console.log('');

    // Confirm
    if (!options.yes) {
        const { promptUser } = await import('../utils/prompt');
        const { confirm } = await promptUser([{
            type: 'confirm',
            name: 'confirm',
            message: `Import ${manifest.skills.length} skill(s)?`,
            default: true
        }]);

        if (!confirm) {
            console.log(chalk.yellow('\n❌ Import cancelled'));
            return;
        }
    }

    // Import skills
    const { installSkill } = await import('./install');

    let successCount = 0;
    let failCount = 0;

    console.log(chalk.cyan('\n🚀 Importing skills...\n'));

    for (const skill of manifest.skills) {
        const source = skill.url || skill.id || skill.name;
        if (!source) {
            console.log(chalk.yellow(`  ⚠️  Skipping invalid entry (no url/id/name)`));
            failCount++;
            continue;
        }

        const displayName = skill.name || skill.id || source;
        console.log(chalk.gray(`  Installing ${displayName}...`));

        try {
            await installSkill(source, {
                universal: true,
                yes: true,
                cursor: false
            });
            successCount++;
            console.log(chalk.green(`  ✅ ${displayName}`));
        } catch (err: any) {
            failCount++;
            console.log(chalk.red(`  ❌ ${displayName}: ${err.message}`));
        }
    }

    // Summary
    console.log('');
    console.log(chalk.green.bold('✨ Import complete!'));
    console.log(chalk.gray(`   Success: ${successCount}, Failed: ${failCount}`));

    if (successCount > 0) {
        console.log(chalk.gray('\n💡 Run `npx ralphy-skills sync` to update AGENTS.md'));
    }
}

/**
 * Generate a manifest from currently installed skills.
 */
export async function generateManifest(outputPath?: string): Promise<void> {
    console.log(chalk.cyan.bold('\n📤 Generate Skills Manifest\n'));

    const { getInstalledSkillsMetadata } = await import('../utils/registry');
    const skills = getInstalledSkillsMetadata();

    if (skills.length === 0) {
        console.log(chalk.yellow('⚠️  No skills installed.'));
        return;
    }

    const manifest: SkillManifest = {
        skills: skills.map(skill => ({
            name: skill.name,
            id: skill.id,
            // Include source URL if available
            ...(skill.source.includes('github.com') ? { url: skill.source } : {})
        })),
        options: {
            scope: 'universal'
        }
    };

    const targetPath = outputPath || 'skills.json';
    fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));

    console.log(chalk.green(`✅ Manifest generated: ${targetPath}`));
    console.log(chalk.gray(`   Contains ${manifest.skills.length} skill(s)`));
    console.log('');
    console.log(chalk.gray('💡 Share this file to let others install the same skills:'));
    console.log(chalk.gray('   npx ralphy-skills import skills.json'));
}

/**
 * Main import command handler.
 */
export async function manageImport(action?: string, targetPath?: string, options: any = {}): Promise<void> {
    if (action === 'generate') {
        await generateManifest(targetPath);
    } else {
        await importFromManifest(action || targetPath, options);
    }
}
