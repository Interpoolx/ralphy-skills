import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

/**
 * Implementation of the 'read' command.
 * Outputs skill content to stdout for agents.
 */
export async function readSkills(skillNames: string[]): Promise<void> {
    // Support comma-separated input from single string
    let names: string[] = [];
    for (const name of skillNames) {
        if (name.includes(',')) {
            names.push(...name.split(',').map(n => n.trim()).filter(n => n.length > 0));
        } else {
            names.push(name);
        }
    }

    if (names.length === 0) {
        console.error(chalk.red('\n❌ No skill names provided'));
        console.error(chalk.gray('Usage: npx ralphy-skills read <skill-name> [skill-name-2...]'));
        console.error(chalk.gray('   or: npx ralphy-skills read "skill-one,skill-two"'));
        process.exit(1);
    }

    const installedSkills = getInstalledSkillsMetadata();
    const results: {
        found: any[];
        notFound: string[];
        errors: { name: string; error: string }[];
    } = {
        found: [],
        notFound: [],
        errors: []
    };

    for (const name of names) {
        const skill = installedSkills.find(s =>
            s.name.toLowerCase() === name.toLowerCase() ||
            s.id.toLowerCase() === name.toLowerCase()
        );

        if (!skill) {
            results.notFound.push(name);
            continue;
        }

        const skillFile = path.join(skill.path, 'SKILL.md');
        if (!fs.existsSync(skillFile)) {
            results.errors.push({ name, error: 'SKILL.md not found' });
            continue;
        }

        results.found.push({ skill, skillFile });
    }

    // Output results
    if (results.found.length > 0) {
        console.log(chalk.cyan.bold(`\n📖 Reading ${results.found.length} skill(s):`));
        
        for (let i = 0; i < results.found.length; i++) {
            const { skill, skillFile } = results.found[i];
            const content = fs.readFileSync(skillFile, 'utf8');

            console.log(chalk.gray(`\n--- Skill ${i + 1}/${results.found.length}: ${skill.name} ---`));
            console.log(`Base directory: ${skill.path}`);
            console.log(`\n${content}`);
        }
        
        console.log(chalk.gray(`\n--- End of ${results.found.length} skill(s) ---`));
    }

    if (results.notFound.length > 0) {
        console.log(chalk.yellow(`\n⚠️  ${results.notFound.length} skill(s) not found:`));
        results.notFound.forEach(name => {
            console.log(chalk.gray(`  • ${name}`));
        });
        console.log(chalk.gray(`Run 'npx ralphy-skills list' to see installed skills.`));
    }

    if (results.errors.length > 0) {
        console.log(chalk.red(`\n❌ ${results.errors.length} error(s) reading skills:`));
        results.errors.forEach(({ name, error }) => {
            console.log(chalk.red(`  • ${name}: ${error}`));
        });
    }

    // Exit with error code if nothing was read
    if (results.found.length === 0) {
        process.exit(1);
    }
}
