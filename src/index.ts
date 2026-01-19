#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSkill } from './commands/install';
import { listSkills } from './commands/list';
import { updateSkills } from './commands/update';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🚀 Ralphy Skills')} ${chalk.gray('- Universal Skills Loader')}          ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('   For AI Coding Agents (Cursor, VS Code, etc.)')}     ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════╝')}
`;

program
    .name('ralphy-skills')
    .description('Universal Skills loader for AI Coding Agents')
    .version('2.0.0')
    .hook('preAction', () => {
        console.log(banner);
    });

program
    .command('install <skill>')
    .alias('i')
    .description('Install a skill by name, URL, or local path')
    .option('-d, --dir <directory>', 'Target directory', '.')
    .option('-u, --universal', 'Install to .agent/skills/')
    .option('-g, --global', 'Install to ~/.ralphy/skills/')
    .option('-s, --symlink', 'Symlink local path instead of copying')
    .option('--cursor', 'Also install to .cursor/rules')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--private', 'Force private repository mode')
    .option('--token <token>', 'GitHub personal access token')
    .option('--ssh-key <path>', 'SSH key path for private repos')
    .action(async (skill: string, options) => {
        await installSkill(skill, options);
    });

program
    .command('list')
    .alias('ls')
    .description('List installed skills (use -r for registry)')
    .option('-r, --registry', 'Show available skills from registry')
    .action(async (options) => {
        await listSkills(options);
    });

program
    .command('read <skill-names...>')
    .description('Read skill content to stdout (for AI agents)')
    .action(async (skillNames: string[]) => {
        const { readSkills } = await import('./commands/read');
        await readSkills(skillNames);
    });

program
    .command('sync')
    .description('Update AGENTS.md with installed skills')
    .option('-y, --yes', 'Skip confirmation')
    .option('-o, --output <path>', 'Output file path', 'AGENTS.md')
    .option('-f, --format <format>', 'Output format (markdown|json|yaml)', 'markdown')
    .option('--dry-run', 'Show what would be written without writing files')
    .option('--include-metadata', 'Include detailed metadata in output')
    .action(async (options) => {
        const { syncAgents } = await import('./commands/sync');
        await syncAgents(options);
    });

program
    .command('manage')
    .description('Interactively manage installed skills')
    .action(async () => {
        const { manageSkills } = await import('./commands/remove');
        await manageSkills();
    });

program
    .command('remove <skill>')
    .alias('rm')
    .description('Remove a specific skill')
    .action(async (skill: string) => {
        const { removeSkill } = await import('./commands/remove');
        await removeSkill(skill);
    });

program
    .command('update')
    .alias('up')
    .description('Update all installed skills to latest versions')
    .option('-s, --skill <name>', 'Update a specific skill only')
    .action(async (options) => {
        await updateSkills(options);
    });

program
    .command('search <query>')
    .description('Search for skills by name or description')
    .option('--category <category>', 'Filter by category')
    .option('--tags <tags...>', 'Filter by tags')
    .option('--source <source>', 'Search source: registry|installed|all', 'all')
    .option('--format <format>', 'Filter by format: symlink|installed|all', 'all')
    .option('--sort <sort>', 'Sort by: relevance|name|popularity|updated', 'relevance')
    .option('--limit <number>', 'Limit number of results', '50')
    .option('--export <format>', 'Export results to file (json|csv)')
    .action(async (query: string, options) => {
        const { searchSkills } = await import('./commands/list');
        await searchSkills(query, options);
    });

program
    .command('create [name]')
    .description('Create a new skill from template')
    .action(async (name?: string) => {
        const { createSkill } = await import('./commands/create');
        await createSkill(name);
    });

program
    .command('validate [path]')
    .description('Validate skill format and structure')
    .option('--strict', 'Strict validation mode')
    .option('--fix', 'Auto-fix issues where possible')
    .action(async (skillPath?: string, options?: any) => {
        const { validateSkill } = await import('./commands/validate');
        await validateSkill(skillPath, options);
    });

program
    .command('serve')
    .description('Start web-based skills browser')
    .option('-p, --port <port>', 'Port number', '3000')
    .action(async (options) => {
        const { startApiServer } = await import('./server/api');
        await startApiServer(parseInt(options.port));
    });

program.parse();
