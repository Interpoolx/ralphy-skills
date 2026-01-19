import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';
import { SkillMetadata } from '../types';
import { promptUser } from '../utils/prompt';

interface ToggleOptions {
    list?: boolean;
}

const prompt = promptUser;

/**
 * Implementation of skill enable/disable functionality.
 * Allows toggling skills on/off without removing them.
 */
export async function toggleSkill(skillName: string, enable: boolean): Promise<void> {
    console.log(chalk.cyan.bold(`\n${enable ? '✅' : '🔇'} ${enable ? 'Enable' : 'Disable'} Skill\n`));

    const skills = getInstalledSkillsMetadata();

    // Find the skill (check both enabled and disabled)
    let skill: { name: string; path: string; id: string; isSymlink?: boolean } | undefined = skills.find(s =>
        s.name.toLowerCase() === skillName.toLowerCase() ||
        s.id.toLowerCase() === skillName.toLowerCase()
    );

    // If not found in active skills, search for disabled skills
    if (!skill) {
        const disabled = await findDisabledSkill(skillName);
        if (disabled) {
            skill = disabled;
        }
    }

    if (!skill) {
        console.log(chalk.red(`❌ Skill not found: ${skillName}`));
        console.log(chalk.gray('\nAvailable skills:'));
        skills.forEach(s => console.log(chalk.gray(`  • ${s.name}`)));

        const disabled = await getDisabledSkills();
        if (disabled.length > 0) {
            console.log(chalk.gray('\nDisabled skills:'));
            disabled.forEach(s => console.log(chalk.gray(`  • ${s.name} (disabled)`)));
        }
        return;
    }

    const skillMdPath = path.join(skill.path, 'SKILL.md');
    const disabledPath = path.join(skill.path, 'SKILL.md.disabled');

    if (enable) {
        // Enable: Rename SKILL.md.disabled to SKILL.md
        if (fs.existsSync(disabledPath)) {
            fs.renameSync(disabledPath, skillMdPath);
            console.log(chalk.green(`✅ Enabled: ${skill.name}`));
            console.log(chalk.gray(`   The skill will now be discovered by AI agents.`));
        } else if (fs.existsSync(skillMdPath)) {
            console.log(chalk.yellow(`⚠️  Skill is already enabled: ${skill.name}`));
        } else {
            console.log(chalk.red(`❌ Cannot enable: SKILL.md not found`));
        }
    } else {
        // Disable: Rename SKILL.md to SKILL.md.disabled
        if (fs.existsSync(skillMdPath)) {
            fs.renameSync(skillMdPath, disabledPath);
            console.log(chalk.yellow(`🔇 Disabled: ${skill.name}`));
            console.log(chalk.gray(`   The skill will not be discovered by AI agents.`));
            console.log(chalk.gray(`   Re-enable with: npx ralphy-skills enable ${skill.name}`));
        } else if (fs.existsSync(disabledPath)) {
            console.log(chalk.yellow(`⚠️  Skill is already disabled: ${skill.name}`));
        } else {
            console.log(chalk.red(`❌ Cannot disable: SKILL.md not found`));
        }
    }
}

/**
 * List all disabled skills.
 */
export async function listDisabledSkills(): Promise<void> {
    console.log(chalk.cyan.bold('\n🔇 Disabled Skills\n'));

    const disabled = await getDisabledSkills();

    if (disabled.length === 0) {
        console.log(chalk.gray('  No disabled skills found.'));
        console.log(chalk.gray('  All installed skills are currently enabled.\n'));
        return;
    }

    console.log(chalk.bold(`Found ${disabled.length} disabled skill(s):\n`));

    disabled.forEach(skill => {
        console.log(`  🔇 ${chalk.yellow(skill.name)}`);
        console.log(chalk.gray(`     Path: ${skill.path}`));
        console.log(chalk.gray(`     Enable: npx ralphy-skills enable ${skill.name}`));
        console.log('');
    });
}

/**
 * Toggle multiple skills interactively.
 */
export async function interactiveToggle(): Promise<void> {
    console.log(chalk.cyan.bold('\n🔄 Skill Toggle Manager\n'));

    const enabled = getInstalledSkillsMetadata();
    const disabled = await getDisabledSkills();

    if (enabled.length === 0 && disabled.length === 0) {
        console.log(chalk.yellow('⚠️  No skills installed.'));
        console.log(chalk.gray('Install skills with: npx ralphy-skills install <skill-name>'));
        return;
    }

    // Create choices with current status
    const choices = [
        ...enabled.map(s => ({
            name: `${chalk.green('✅')} ${s.name} ${chalk.gray('(enabled)')}`,
            value: { skill: s, enabled: true },
            short: s.name
        })),
        ...disabled.map(s => ({
            name: `${chalk.yellow('🔇')} ${s.name} ${chalk.gray('(disabled)')}`,
            value: { skill: s, enabled: false },
            short: s.name
        }))
    ];

    const { selected } = await prompt([{
        type: 'checkbox',
        name: 'selected',
        message: 'Select skills to toggle:',
        choices,
        pageSize: 15
    }]);

    if (selected.length === 0) {
        console.log(chalk.yellow('\nNo skills selected.'));
        return;
    }

    // Toggle selected skills
    console.log(chalk.cyan('\n🔄 Toggling selected skills...\n'));

    for (const { skill, enabled } of selected) {
        const newState = !enabled;
        const skillMdPath = path.join(skill.path, 'SKILL.md');
        const disabledPath = path.join(skill.path, 'SKILL.md.disabled');

        try {
            if (newState) {
                // Enable
                if (fs.existsSync(disabledPath)) {
                    fs.renameSync(disabledPath, skillMdPath);
                    console.log(chalk.green(`  ✅ Enabled: ${skill.name}`));
                }
            } else {
                // Disable
                if (fs.existsSync(skillMdPath)) {
                    fs.renameSync(skillMdPath, disabledPath);
                    console.log(chalk.yellow(`  🔇 Disabled: ${skill.name}`));
                }
            }
        } catch (error: any) {
            console.log(chalk.red(`  ❌ Error: ${skill.name} - ${error.message}`));
        }
    }

    console.log(chalk.green.bold('\n✨ Toggle complete!'));
    console.log(chalk.gray('Run `npx ralphy-skills sync` to update AGENTS.md\n'));
}

/**
 * Get all disabled skills (skills with SKILL.md.disabled).
 */
async function getDisabledSkills(): Promise<{ name: string; path: string; id: string }[]> {
    const disabledSkills: { name: string; path: string; id: string }[] = [];

    // Check common skill locations
    const locations = [
        path.resolve('.agent', 'skills'),
        path.resolve('.claude', 'skills'),
        path.resolve('.cursor', 'rules'),
    ];

    for (const location of locations) {
        if (!fs.existsSync(location)) continue;

        try {
            const folders = fs.readdirSync(location);
            for (const folder of folders) {
                const folderPath = path.join(location, folder);
                const disabledPath = path.join(folderPath, 'SKILL.md.disabled');

                const stats = fs.statSync(folderPath);
                if ((stats.isDirectory() || stats.isSymbolicLink()) && fs.existsSync(disabledPath)) {
                    // Try to extract name from disabled file
                    let name = folder;
                    try {
                        const content = fs.readFileSync(disabledPath, 'utf-8');
                        const nameMatch = content.match(/^name:\s*(.+)$/m);
                        if (nameMatch) {
                            name = nameMatch[1].trim();
                        }
                    } catch (e) {
                        // Use folder name
                    }

                    disabledSkills.push({
                        name,
                        path: folderPath,
                        id: folder
                    });
                }
            }
        } catch (e) {
            // Ignore errors for this location
        }
    }

    return disabledSkills;
}

/**
 * Find a disabled skill by name.
 */
async function findDisabledSkill(name: string): Promise<{ name: string; path: string; id: string } | null> {
    const disabled = await getDisabledSkills();
    return disabled.find(s =>
        s.name.toLowerCase() === name.toLowerCase() ||
        s.id.toLowerCase() === name.toLowerCase()
    ) || null;
}
