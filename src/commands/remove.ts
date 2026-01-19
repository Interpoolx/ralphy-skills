import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

/**
 * Implementation of the 'remove' command.
 */
export async function removeSkill(skillName: string): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    const skill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase() || s.id.toLowerCase() === skillName.toLowerCase());

    if (!skill) {
        console.error(chalk.red(`\n❌ Skill not found: ${skillName}`));
        return;
    }

    try {
        if (skill.isSymlink) {
            fs.unlinkSync(skill.path);
        } else {
            fs.rmSync(skill.path, { recursive: true, force: true });
        }
        console.log(chalk.green(`\n✅ Removed: ${skill.name}`));
    } catch (err: any) {
        console.error(chalk.red(`\n❌ Error removing skill: ${err.message}`));
    }
}

/**
 * Implementation of the 'manage' command (Interactive).
 */
export async function manageSkills(): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    if (skills.length === 0) {
        console.log(chalk.yellow('\nNo skills installed.'));
        return;
    }

    console.log(chalk.bold('\n🛠️  Manage Installed Skills:'));
    skills.forEach((s, i) => {
        console.log(`${i + 1}. ${chalk.cyan(s.name)} ${chalk.gray(`(${s.source})`)}`);
    });

    console.log(chalk.gray('\nRun \'ralphy-skills remove <name>\' to delete a skill.'));
}
