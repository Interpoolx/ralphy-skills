#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { installSkill } from './commands/install';
import { listSkills } from './commands/list';
import { updateSkills } from './commands/update';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('🚀 Ralphy Skills')} ${chalk.gray('- Universal Skills Loader')}              ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('   The #1 CLI for AI Agent Skills Management')}         ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

program
    .name('ralphy-skills')
    .description('Universal Skills loader for AI Coding Agents - The #1 CLI for AI Agent Skills')
    .version('2.1.0')
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
    .command('search [query]')
    .description('Search for skills (interactive mode if no query)')
    .option('--category <category>', 'Filter by category')
    .option('--tags <tags...>', 'Filter by tags')
    .option('--sort <sort>', 'Sort by: relevance|name|category', 'relevance')
    .option('--limit <number>', 'Limit number of results', '20')
    .option('--json', 'Output as JSON')
    .option('-i, --interactive', 'Force interactive mode')
    .action(async (query?: string, options?: any) => {
        if (!query || options?.interactive) {
            // Interactive mode
            const { interactiveSearch } = await import('./commands/interactive-search');
            await interactiveSearch(query, options);
        } else {
            // Simple search
            const { searchSkillsSimple } = await import('./commands/interactive-search');
            await searchSkillsSimple(query, options);
        }
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

// ============================================
// NEW PHASE 1 COMMANDS - Making Ralphy #1
// ============================================

program
    .command('doctor')
    .description('Diagnose environment and detect AI coding tools')
    .option('--json', 'Output as JSON')
    .option('--fix', 'Auto-fix common issues')
    .action(async (options) => {
        const { runDoctor } = await import('./commands/doctor');
        await runDoctor(options);
    });

program
    .command('init')
    .description('Initialize project with skill support')
    .option('-y, --yes', 'Auto-accept all defaults')
    .option('--skip-install', 'Skip skill installation')
    .option('--template <template>', 'Template: minimal|standard|full', 'standard')
    .action(async (options) => {
        const { initProject } = await import('./commands/init');
        await initProject(options);
    });

program
    .command('enable <skill>')
    .description('Enable a disabled skill')
    .action(async (skill: string) => {
        const { toggleSkill } = await import('./commands/toggle');
        await toggleSkill(skill, true);
    });

program
    .command('disable <skill>')
    .description('Disable a skill without removing it')
    .action(async (skill: string) => {
        const { toggleSkill } = await import('./commands/toggle');
        await toggleSkill(skill, false);
    });

program
    .command('toggle')
    .description('Interactively toggle skills on/off')
    .option('--list', 'List all disabled skills')
    .action(async (options) => {
        if (options.list) {
            const { listDisabledSkills } = await import('./commands/toggle');
            await listDisabledSkills();
        } else {
            const { interactiveToggle } = await import('./commands/toggle');
            await interactiveToggle();
        }
    });

program
    .command('export')
    .description('Export skills to AI agent directories')
    .option('--all', 'Export to all detected AI tools')
    .option('--cursor', 'Export to Cursor')
    .option('--copilot', 'Export to VS Code + Copilot')
    .option('--claude', 'Export to Claude Code')
    .option('--windsurf', 'Export to Windsurf')
    .option('--aider', 'Export to Aider')
    .option('--gemini', 'Export to Gemini CLI')
    .option('--opencode', 'Export to OpenCode')
    .option('--codex', 'Export to OpenAI Codex CLI')
    .option('--dry-run', 'Preview without writing files')
    .option('-f, --force', 'Overwrite existing files')
    .option('-y, --yes', 'Skip confirmation')
    .option('--list', 'List available export targets')
    .action(async (options) => {
        if (options.list) {
            const { listExportTargets } = await import('./commands/export-agents');
            await listExportTargets();
        } else {
            const { exportToAgents } = await import('./commands/export-agents');
            await exportToAgents(options);
        }
    });

program
    .command('config [action] [key] [value]')
    .description('Manage CLI configuration')
    .action(async (action?: string, key?: string, value?: string) => {
        const { manageConfig } = await import('./commands/config');
        await manageConfig(action || 'list', key, value);
    });

// ============================================
// PHASE 2 COMMANDS - Professional-Grade Features
// ============================================

program
    .command('lock [action] [path]')
    .description('Manage skills lock file for reproducible installations')
    .action(async (action?: string, lockPath?: string) => {
        const { manageLock } = await import('./commands/lock');
        await manageLock(action, lockPath);
    });

program
    .command('import [path]')
    .alias('bulk')
    .description('Import skills from manifest file')
    .option('-f, --force', 'Overwrite existing skills')
    .option('-y, --yes', 'Skip confirmation')
    .option('--generate', 'Generate manifest from installed skills')
    .action(async (manifestPath?: string, options?: any) => {
        const { manageImport } = await import('./commands/import');
        if (options?.generate) {
            await manageImport('generate', manifestPath, options);
        } else {
            await manageImport(manifestPath, undefined, options);
        }
    });

program.parse();
