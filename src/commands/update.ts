import chalk from 'chalk';
import { loadRegistry, getInstalledSkillsMetadata } from '../utils/registry';
import { installSkillFromUrl } from '../utils/downloader';

interface UpdateOptions {
    skill?: string;
}

/**
 * Update installed skills to latest versions.
 */
export async function updateSkills(options: UpdateOptions): Promise<void> {
    const registry = loadRegistry();
    const installed = getInstalledSkillsMetadata();

    if (installed.length === 0) {
        console.log(chalk.yellow('No skills installed yet.'));
        console.log(chalk.gray('Use "ralphy-skills install <skill>" to install one.\n'));
        return;
    }

    // Filter to specific skill if provided
    let toUpdate = installed;
    if (options.skill) {
        const found = installed.find(
            (s) =>
                s.id.toLowerCase() === options.skill!.toLowerCase() ||
                s.name.toLowerCase() === options.skill!.toLowerCase()
        );
        if (!found) {
            console.log(chalk.red(`Skill "${options.skill}" is not installed.`));
            process.exit(1);
        }
        toUpdate = [found];
    }

    console.log(chalk.bold(`🔄 Updating ${toUpdate.length} skill(s)...\n`));

    let successCount = 0;
    let failCount = 0;

    for (const skillMeta of toUpdate) {
        // Find in registry to get latest URL
        const registrySkill = registry.find((s) => s.id === skillMeta.id || s.name === skillMeta.name);
        if (!registrySkill) {
            console.log(chalk.gray(`  ⏭ ${skillMeta.name} - Not in registry (custom skill), skipping`));
            continue;
        }

        console.log(chalk.gray(`  ↻ Updating ${registrySkill.name}...`));

        try {
            await installSkillFromUrl(registrySkill.url, registrySkill.folder_name, '.', {
                onFile: () => { }, // Silent
            });
            console.log(chalk.green(`  ✓ ${registrySkill.name} updated`));
            successCount++;
        } catch (error: any) {
            console.log(chalk.red(`  ✗ ${registrySkill.name} - ${error.message}`));
            failCount++;
        }
    }

    console.log('');
    if (failCount === 0) {
        console.log(chalk.green(`✓ Successfully updated ${successCount} skill(s)`));
    } else {
        console.log(chalk.yellow(`Updated ${successCount}, failed ${failCount}`));
    }
}
