import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getRegistry } from '../utils/registry';
import { SkillDefinition } from '../types';

interface SearchOptions {
    client?: string;
    sort?: 'relevance' | 'name' | 'category';
    limit?: number;
    json?: boolean;
}

/**
 * Interactive search command - beautiful UI using @clack/prompts
 * Uses our own marketplace.json as the source of truth
 */
export async function interactiveSearch(initialQuery?: string, options: SearchOptions = {}): Promise<void> {
    p.intro(pc.cyan(pc.bold('ralphy-skills search')));

    let query = initialQuery;

    // If no query provided, prompt for one
    if (!query) {
        const input = await p.text({
            message: 'Search for skills:',
            placeholder: 'e.g., frontend, python, testing...',
            validate: (value) => {
                if (!value) return 'Please enter a search query';
                return undefined;
            }
        });

        if (p.isCancel(input)) {
            p.cancel('Search cancelled');
            return;
        }

        query = input as string;
    }

    // Search for skills in our registry
    const spinner = p.spinner();
    spinner.start(`Searching for "${query}"...`);

    let results: SkillDefinition[] = [];

    try {
        const registry = await getRegistry();
        const searchLower = query.toLowerCase();

        results = registry.filter(s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower) ||
            s.category?.toLowerCase().includes(searchLower) ||
            s.tags?.some(t => t.toLowerCase().includes(searchLower))
        );

        // Sort results
        if (options.sort === 'name') {
            results.sort((a, b) => a.name.localeCompare(b.name));
        } else if (options.sort === 'category') {
            results.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        }

        // Limit results
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        spinner.stop(`Found ${results.length} skill(s) for "${query}"`);
    } catch (err: any) {
        spinner.stop(`Search failed: ${err.message}`);
        return;
    }

    if (results.length === 0) {
        p.log.warn('No skills found. Try a different search query.');
        p.log.info('Browse all skills: npx ralphy-skills list --registry');
        p.outro('');
        return;
    }

    // JSON output mode
    if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
    }

    // Interactive selection loop
    await selectAndInstallLoop(results, query, options);
}

async function selectAndInstallLoop(
    results: SkillDefinition[],
    query: string,
    options: SearchOptions
): Promise<void> {
    while (true) {
        const skillChoices = results.map(skill => ({
            value: skill.id,
            label: formatSkillChoice(skill),
            hint: skill.description?.substring(0, 50) + (skill.description && skill.description.length > 50 ? '...' : '')
        }));

        const actionChoices = [
            { value: '__new__', label: pc.dim('🔍 New search...') },
            { value: '__exit__', label: pc.dim('Exit') }
        ];

        const allChoices = [...skillChoices, ...actionChoices];

        const selected = await p.select({
            message: `Select a skill to install (${results.length} results):`,
            options: allChoices,
            maxItems: 10
        });

        if (p.isCancel(selected) || selected === '__exit__') {
            showGoodbye();
            return;
        }

        if (selected === '__new__') {
            await interactiveSearch(undefined, options);
            return;
        }

        // Find the selected skill
        const selectedSkill = results.find(s => s.id === selected);
        if (selectedSkill) {
            await installSelectedSkill(selectedSkill, options);
        }
    }
}

function formatSkillChoice(skill: SkillDefinition): string {
    const category = skill.category ? pc.blue(`[${skill.category}]`) : '';
    const recommended = skill.recommended ? pc.green(' ★') : '';

    return `${pc.bold(skill.name)} ${category}${recommended}`;
}

async function installSelectedSkill(skill: SkillDefinition, options: SearchOptions): Promise<void> {
    // Choose scope
    const scope = await p.select({
        message: `Install "${skill.name}" to:`,
        options: [
            { value: 'universal', label: '🌐 Universal (.agent/skills) - Works with all AI tools' },
            { value: 'local', label: '📁 Local (current directory)' },
            { value: 'global', label: '🌍 Global (~/.ralphy/skills)' }
        ]
    });

    if (p.isCancel(scope)) return;

    // Confirm installation
    const confirm = await p.confirm({
        message: `Install ${pc.bold(skill.name)}?`
    });

    if (p.isCancel(confirm) || !confirm) {
        p.log.info('Installation cancelled');
        return;
    }

    // Install
    const spinner = p.spinner();
    spinner.start(`Installing ${skill.name}...`);

    try {
        const { installSkill } = await import('./install');

        const installOptions: any = { yes: true };
        if (scope === 'universal') installOptions.universal = true;
        if (scope === 'global') installOptions.global = true;

        await installSkill(skill.id, installOptions);

        spinner.stop(pc.green(`✅ Successfully installed ${skill.name}`));

        // Ask about syncing AGENTS.md
        const syncAgents = await p.confirm({
            message: 'Update AGENTS.md with installed skills?',
            initialValue: true
        });

        if (!p.isCancel(syncAgents) && syncAgents) {
            const { syncAgents: runSync } = await import('./sync');
            await runSync({ yes: true });
        }

    } catch (err: any) {
        spinner.stop(pc.red(`❌ Installation failed: ${err.message}`));
    }
}

function showGoodbye(): void {
    console.log('');
    console.log(pc.dim('     *  .  *'));
    console.log(pc.dim('      .    *    .'));
    console.log(pc.dim('  *   .        .'));
    console.log(pc.dim(' *'));
    console.log(pc.dim('    .    *  .     . *'));
    console.log(pc.dim('  .  *        *  .'));
    console.log(pc.cyan('Happy coding! ◝(ᵔᵕᵔ)◜'));
    console.log('');
    console.log(pc.dim('Browse skills: https://ralphy-skills.pages.dev'));
    console.log('');
}

/**
 * Non-interactive search - just display results
 */
export async function searchSkillsSimple(query: string, options: SearchOptions = {}): Promise<void> {
    console.log(pc.cyan(`\n🔍 Searching for "${query}"...\n`));

    try {
        const registry = await getRegistry();
        const searchLower = query.toLowerCase();

        let results = registry.filter(s =>
            s.name.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower) ||
            s.category?.toLowerCase().includes(searchLower) ||
            s.tags?.some(t => t.toLowerCase().includes(searchLower))
        );

        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        if (results.length === 0) {
            console.log(pc.yellow('No skills found.'));
            return;
        }

        console.log(pc.bold(`Found ${results.length} skill(s):\n`));

        results.forEach((skill, i) => {
            const category = skill.category ? pc.blue(` [${skill.category}]`) : '';
            const recommended = skill.recommended ? pc.green(' ★') : '';

            console.log(`${pc.dim((i + 1).toString().padStart(2, ' '))}. ${pc.bold(skill.name)}${category}${recommended}`);
            if (skill.description) {
                console.log(pc.dim(`    ${skill.description.substring(0, 70)}${skill.description.length > 70 ? '...' : ''}`));
            }
            console.log('');
        });

        console.log(pc.dim('Use interactive mode for easy install: npx ralphy-skills search'));

    } catch (err: any) {
        console.log(pc.red(`Search failed: ${err.message}`));
    }
}
