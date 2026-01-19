import chalk from 'chalk';
import { getRegistry, getInstalledSkillsMetadata, isSkillInstalled } from '../utils/registry';

interface ListOptions {
    registry?: boolean;
}

/**
 * List skills (defaults to installed skills).
 */
export async function listSkills(options: ListOptions): Promise<void> {
    const installed = getInstalledSkillsMetadata();

    if (options.registry) {
        console.log(chalk.gray('Fetching registry...'));
        const registry = await getRegistry();
        console.clear(); // Clear loading message

        console.log(chalk.bold('📚 Registry Skills (Available to Install):\n'));

        registry.forEach((skill) => {
            const isInstalled = installed.some(s => s.id === skill.id || s.name === skill.name);
            const status = isInstalled ? chalk.green(' ✓') : '  ';
            const name = isInstalled ? chalk.green(skill.name) : chalk.white(skill.name);

            console.log(`${status} ${name}`);
            console.log(chalk.gray(`     ${skill.description}`));
            console.log(chalk.gray(`     ID: ${skill.id}\n`));
        });

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.cyan(`\n💡 Install with: npx ralphy-skills install <skill-id>\n`));
    } else {
        console.log(chalk.bold('📦 Installed Skills:\n'));

        if (installed.length === 0) {
            console.log(chalk.gray('  No skills installed yet.'));
            console.log(chalk.gray('  Use "ralphy-skills list --registry" to see available skills.'));
            console.log(chalk.gray('  Use "ralphy-skills install <skill>" to install one.\n'));
            return;
        }

        installed.forEach((skill) => {
            console.log(chalk.green(`  ✓ ${chalk.bold(skill.name)}`) + chalk.gray(` (${skill.source})`));
            console.log(chalk.gray(`    ${skill.description}`));
            if (skill.isSymlink) console.log(chalk.yellow(`    🔗 Symlinked from: ${skill.path}`));
            console.log('');
        });
    }
}

/**
 * Search skills by query.
 */
export async function searchSkills(query: string): Promise<void> {
    // Only fetch registry if looking for new skills
    const installed = getInstalledSkillsMetadata();
    const lowerQuery = query.toLowerCase();

    // Search installed first (instant)
    const installedMatches = installed.filter(
        (skill) =>
            skill.name.toLowerCase().includes(lowerQuery) ||
            skill.description.toLowerCase().includes(lowerQuery) ||
            skill.id.toLowerCase().includes(lowerQuery)
    );

    // Then search registry
    let registryMatches: any[] = [];
    try {
        const registry = await getRegistry();
        registryMatches = registry.filter(
            (skill) =>
                skill.name.toLowerCase().includes(lowerQuery) ||
                skill.description.toLowerCase().includes(lowerQuery) ||
                skill.id.toLowerCase().includes(lowerQuery)
        );
    } catch {
        // Ignore registry errors during search
    }

    if (registryMatches.length === 0 && installedMatches.length === 0) {
        console.log(chalk.yellow(`No skills found matching "${query}"\n`));
        return;
    }

    if (registryMatches.length > 0) {
        console.log(chalk.bold(`🔍 Registry Matches for "${query}":\n`));
        registryMatches.forEach((skill) => {
            const isInstalled = isSkillInstalled(skill.id);
            const status = isInstalled ? chalk.green(' ✓') : '  ';
            console.log(`${status} ${skill.name} (${skill.id})`);
            console.log(chalk.gray(`     ${skill.description}\n`));
        });
    }

    if (installedMatches.length > 0) {
        console.log(chalk.bold(`📦 Installed Matches for "${query}":\n`));
        installedMatches.forEach((skill) => {
            console.log(chalk.green(`  ✓ ${skill.name}`) + chalk.gray(` (${skill.source})`));
            console.log(chalk.gray(`    ${skill.description}\n`));
        });
    }
}
