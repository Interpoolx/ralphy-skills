import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { detectInstalledAgents } from '../utils/agent-detector';
import { getRegistry } from '../utils/registry';
import { promptUser } from '../utils/prompt';

interface InitOptions {
    yes?: boolean;
    template?: 'minimal' | 'standard' | 'full';
    skipInstall?: boolean;
}

interface InitAnswers {
    createAgentDir: boolean;
    createAgentsMd: boolean;
    installRecommended: boolean;
    selectedSkills: string[];
    setupGitignore: boolean;
    multiAgentExport: boolean;
}

const prompt = promptUser;

/**
 * Implementation of the 'init' command.
 * Initialize a project with skill support.
 */
export async function initProject(options: InitOptions = {}): Promise<void> {
    console.log(chalk.cyan.bold('\n🚀 Ralphy Skills - Project Initialization\n'));

    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);

    console.log(chalk.gray(`Project: ${projectPath}\n`));

    // Detect current environment
    const detection = detectInstalledAgents(projectPath);
    const detectedAgents = detection.agents.filter(a => a.detected);

    // Show detected AI tools
    if (detectedAgents.length > 0) {
        console.log(chalk.bold('🔍 Detected AI Coding Tools:\n'));
        detectedAgents.forEach(agent => {
            console.log(`  ${agent.icon} ${chalk.green(agent.name)}`);
        });
        console.log('');
    } else {
        console.log(chalk.yellow('⚠️  No AI coding tools detected.\n'));
    }

    // Check current state
    const hasAgentDir = fs.existsSync(path.join(projectPath, '.agent'));
    const hasAgentsMd = fs.existsSync(path.join(projectPath, 'AGENTS.md'));
    const hasGitignore = fs.existsSync(path.join(projectPath, '.gitignore'));

    if (hasAgentDir && hasAgentsMd && !options.yes) {
        console.log(chalk.green('✅ Project already initialized with skill support.\n'));
        console.log(chalk.gray('Current setup:'));
        console.log(chalk.gray(`  • .agent/skills directory: ${hasAgentDir ? 'exists' : 'missing'}`));
        console.log(chalk.gray(`  • AGENTS.md: ${hasAgentsMd ? 'exists' : 'missing'}`));
        console.log('');

        const { reinitialize } = await prompt([{
            type: 'confirm',
            name: 'reinitialize',
            message: 'Would you like to reinitialize?',
            default: false
        }]);

        if (!reinitialize) {
            console.log(chalk.gray('\n👋 Initialization cancelled.'));
            return;
        }
    }

    let answers: InitAnswers;

    if (options.yes) {
        // Auto-accept defaults
        answers = {
            createAgentDir: true,
            createAgentsMd: true,
            installRecommended: !options.skipInstall,
            selectedSkills: [],
            setupGitignore: true,
            multiAgentExport: detectedAgents.length > 1
        };
    } else {
        // Interactive prompts
        answers = await prompt([
            {
                type: 'confirm',
                name: 'createAgentDir',
                message: 'Create .agent/skills directory?',
                default: true
            },
            {
                type: 'confirm',
                name: 'createAgentsMd',
                message: 'Create AGENTS.md for AI agent discovery?',
                default: true
            },
            {
                type: 'confirm',
                name: 'installRecommended',
                message: 'Install recommended skills from registry?',
                default: true,
                when: !options.skipInstall
            },
            {
                type: 'confirm',
                name: 'setupGitignore',
                message: 'Add .agent to .gitignore?',
                default: true,
                when: hasGitignore
            },
            {
                type: 'confirm',
                name: 'multiAgentExport',
                message: `Export skills to ${detectedAgents.length} detected AI tools?`,
                default: true,
                when: detectedAgents.length > 1
            }
        ]);
    }

    console.log(chalk.cyan('\n📁 Initializing project...\n'));

    // Step 1: Create .agent/skills directory
    if (answers.createAgentDir) {
        const skillsDir = path.join(projectPath, '.agent', 'skills');
        if (!fs.existsSync(skillsDir)) {
            fs.mkdirSync(skillsDir, { recursive: true });
            console.log(chalk.green('  ✅ Created .agent/skills/'));
        } else {
            console.log(chalk.gray('  ⋅ .agent/skills/ already exists'));
        }

        // Create .agent/.gitkeep
        const gitkeepPath = path.join(projectPath, '.agent', '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '');
        }
    }

    // Step 2: Create AGENTS.md
    if (answers.createAgentsMd) {
        const agentsMdPath = path.join(projectPath, 'AGENTS.md');
        if (!fs.existsSync(agentsMdPath)) {
            const agentsMdContent = generateAgentsMdTemplate(projectName);
            fs.writeFileSync(agentsMdPath, agentsMdContent);
            console.log(chalk.green('  ✅ Created AGENTS.md'));
        } else {
            console.log(chalk.gray('  ⋅ AGENTS.md already exists'));
        }
    }

    // Step 3: Update .gitignore
    if (answers.setupGitignore && hasGitignore) {
        const gitignorePath = path.join(projectPath, '.gitignore');
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

        const entriesToAdd: string[] = [];

        if (!gitignoreContent.includes('.agent/')) {
            entriesToAdd.push('.agent/');
        }

        if (entriesToAdd.length > 0) {
            const newContent = gitignoreContent.trimEnd() + '\n\n# AI Agent Skills\n' + entriesToAdd.join('\n') + '\n';
            fs.writeFileSync(gitignorePath, newContent);
            console.log(chalk.green('  ✅ Updated .gitignore'));
        } else {
            console.log(chalk.gray('  ⋅ .gitignore already configured'));
        }
    }

    // Step 4: Install recommended skills (optional)
    if (answers.installRecommended && !options.skipInstall) {
        console.log(chalk.cyan('\n📦 Fetching recommended skills...\n'));

        try {
            const registry = await getRegistry();
            const recommended = registry.filter(s => s.recommended || s.category === 'development').slice(0, 5);

            if (recommended.length > 0) {
                let skillsToInstall: string[];

                if (options.yes) {
                    skillsToInstall = recommended.slice(0, 3).map(s => s.id);
                } else {
                    const { selected } = await prompt([{
                        type: 'checkbox',
                        name: 'selected',
                        message: 'Select skills to install:',
                        choices: recommended.map(s => ({
                            name: `${s.name} - ${s.description}`,
                            value: s.id,
                            checked: false
                        })),
                        pageSize: 10
                    }]);
                    skillsToInstall = selected;
                }

                if (skillsToInstall.length > 0) {
                    console.log(chalk.cyan('\n📥 Installing selected skills...\n'));

                    for (const skillId of skillsToInstall) {
                        console.log(chalk.gray(`  Installing ${skillId}...`));
                        try {
                            const { installSkill } = await import('./install');
                            await installSkill(skillId, { universal: true, yes: true });
                        } catch (err: any) {
                            console.log(chalk.yellow(`  ⚠️ Could not install ${skillId}: ${err.message}`));
                        }
                    }
                }
            }
        } catch (err) {
            console.log(chalk.yellow('  ⚠️ Could not fetch registry. Skipping skill installation.'));
        }
    }

    // Step 5: Multi-agent export (optional)
    if (answers.multiAgentExport && detectedAgents.length > 1) {
        console.log(chalk.cyan('\n📤 Exporting skills to detected AI tools...\n'));

        try {
            const { exportToAgents } = await import('./export-agents');
            await exportToAgents({ all: true, yes: true });
        } catch (err: any) {
            console.log(chalk.yellow(`  ⚠️ Export failed: ${err.message}`));
        }
    }

    // Summary
    console.log(chalk.green.bold('\n✨ Project initialized successfully!\n'));

    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray('  1. Browse skills: npx ralphy-skills list --registry'));
    console.log(chalk.gray('  2. Install skill: npx ralphy-skills install <skill-name>'));
    console.log(chalk.gray('  3. Sync AGENTS.md: npx ralphy-skills sync'));
    console.log(chalk.gray('  4. Run diagnostics: npx ralphy-skills doctor'));
    console.log('');
}

function generateAgentsMdTemplate(projectName: string): string {
    return `# ${projectName} - AI Agent Configuration

<!-- This file helps AI coding agents discover available skills and project context -->

## Project Overview

<!-- Add a brief description of your project for AI agents -->

This project uses [Ralphy Skills](https://github.com/Interpoolx/ralphy-skills) for AI agent skill management.

## Available Skills

<!-- SKILLS_TABLE_START -->
<!-- Run 'npx ralphy-skills sync' to populate this section -->
No skills installed yet. Install skills with: \`npx ralphy-skills install <skill-name>\`
<!-- SKILLS_TABLE_END -->

## Project Rules

<!-- Add project-specific rules and guidelines for AI agents -->

1. Follow the existing code style and conventions
2. Write tests for new functionality
3. Update documentation when making changes

## Quick Commands

\`\`\`bash
# List installed skills
npx ralphy-skills list

# Install a skill
npx ralphy-skills install <skill-name>

# Update AGENTS.md
npx ralphy-skills sync

# Read a skill (for AI agents)
npx ralphy-skills read <skill-name>
\`\`\`

---
*Generated by Ralphy Skills v2.1.0*
`;
}
