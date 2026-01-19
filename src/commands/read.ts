import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

/**
 * Implementation of the 'read' command.
 * Outputs skill content to stdout for agents.
 */
export async function readSkills(skillNames: string[]): Promise<void> {
    const installedSkills = getInstalledSkillsMetadata();

    for (const name of skillNames) {
        const skill = installedSkills.find(s =>
            s.name.toLowerCase() === name.toLowerCase() ||
            s.id.toLowerCase() === name.toLowerCase()
        );

        if (!skill) {
            console.error(chalk.red(`\n❌ Skill not found: ${name}`));
            console.error(chalk.gray(`Run 'ralphy-skills list' to see installed skills.`));
            continue;
        }

        const skillFile = path.join(skill.path, 'SKILL.md');
        if (!fs.existsSync(skillFile)) {
            console.error(chalk.red(`\n❌ SKILL.md not found for: ${name}`));
            continue;
        }

        const content = fs.readFileSync(skillFile, 'utf8');

        console.log(`\nReading: ${skill.name}`);
        console.log(`Base directory: ${skill.path}\n`);
        console.log(content);
        console.log(`\nSkill read: ${skill.name}`);
    }
}
