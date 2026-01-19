import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { detectInstalledAgents, DetectedAgent } from '../utils/agent-detector';
import { getInstalledSkillsMetadata } from '../utils/registry';
import { SkillMetadata } from '../types';
import { promptUser } from '../utils/prompt';

interface ExportOptions {
    all?: boolean;
    cursor?: boolean;
    copilot?: boolean;
    claude?: boolean;
    windsurf?: boolean;
    aider?: boolean;
    gemini?: boolean;
    opencode?: boolean;
    codex?: boolean;
    dryRun?: boolean;
    force?: boolean;
    yes?: boolean;
}

interface ExportResult {
    agent: string;
    path: string;
    skillsExported: number;
    success: boolean;
    error?: string;
}

const prompt = promptUser;

/**
 * Implementation of the 'export' command.
 * Export skills to different AI agent directories.
 */
export async function exportToAgents(options: ExportOptions): Promise<void> {
    console.log(chalk.cyan.bold('\n📤 Export Skills to AI Agents\n'));

    const detectionResult = detectInstalledAgents('.');
    const skills = getInstalledSkillsMetadata();

    if (skills.length === 0) {
        console.log(chalk.yellow('⚠️  No skills installed to export.'));
        console.log(chalk.gray('Install skills first with: npx ralphy-skills install <skill-name>'));
        return;
    }

    // Determine which agents to export to
    let targetAgents: DetectedAgent[] = [];

    if (options.all) {
        // Export to all detected agents
        targetAgents = detectionResult.agents.filter(a => a.detected);
        if (targetAgents.length === 0) {
            console.log(chalk.yellow('⚠️  No AI tools detected. Use specific flags like --cursor or --claude.'));
            return;
        }
    } else {
        // Check individual flags
        const agentFlags: { flag: keyof ExportOptions; id: string }[] = [
            { flag: 'cursor', id: 'cursor' },
            { flag: 'copilot', id: 'copilot' },
            { flag: 'claude', id: 'claude' },
            { flag: 'windsurf', id: 'windsurf' },
            { flag: 'aider', id: 'aider' },
            { flag: 'gemini', id: 'gemini' },
            { flag: 'opencode', id: 'opencode' },
            { flag: 'codex', id: 'codex' },
        ];

        for (const { flag, id } of agentFlags) {
            if (options[flag]) {
                const agent = detectionResult.agents.find(a => a.id === id);
                if (agent) {
                    targetAgents.push(agent);
                }
            }
        }
    }

    if (targetAgents.length === 0) {
        console.log(chalk.yellow('⚠️  No target agents specified.'));
        console.log(chalk.gray('Use --all to export to all detected agents, or specify individual agents:'));
        console.log(chalk.gray('  --cursor, --copilot, --claude, --windsurf, --aider, --gemini'));
        return;
    }

    // Show export preview
    console.log(chalk.bold('📦 Skills to export:\n'));
    skills.forEach(skill => {
        const symlink = skill.isSymlink ? chalk.yellow(' 🔗') : '';
        console.log(`  ✓ ${skill.name}${symlink}`);
    });
    console.log('');

    console.log(chalk.bold('🎯 Target agents:\n'));
    targetAgents.forEach(agent => {
        console.log(`  ${agent.icon} ${agent.name}`);
        console.log(chalk.gray(`     → ${agent.skillsPath}`));
    });
    console.log('');

    if (options.dryRun) {
        console.log(chalk.cyan.bold('📋 Dry Run - No files will be written\n'));
        return;
    }

    // Confirm if not using --yes
    if (!options.yes && !options.force) {
        const { confirm } = await prompt([{
            type: 'confirm',
            name: 'confirm',
            message: `Export ${skills.length} skill(s) to ${targetAgents.length} agent(s)?`,
            default: true
        }]);

        if (!confirm) {
            console.log(chalk.yellow('\n❌ Export cancelled'));
            return;
        }
    }

    // Perform export
    console.log(chalk.cyan('\n🚀 Exporting skills...\n'));

    const results: ExportResult[] = [];

    for (const agent of targetAgents) {
        try {
            const exportedCount = await exportSkillsToAgent(agent, skills, options.force);
            results.push({
                agent: agent.name,
                path: agent.skillsPath,
                skillsExported: exportedCount,
                success: true
            });
            console.log(chalk.green(`  ✅ ${agent.icon} ${agent.name}: ${exportedCount} skill(s)`));
        } catch (error: any) {
            results.push({
                agent: agent.name,
                path: agent.skillsPath,
                skillsExported: 0,
                success: false,
                error: error.message
            });
            console.log(chalk.red(`  ❌ ${agent.icon} ${agent.name}: ${error.message}`));
        }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const totalExported = results.reduce((sum, r) => sum + r.skillsExported, 0);

    console.log(chalk.cyan.bold('\n📊 Export Summary:\n'));
    console.log(`  Agents: ${chalk.green(successCount.toString())}/${targetAgents.length} successful`);
    console.log(`  Skills: ${chalk.green(totalExported.toString())} total copies created`);
    console.log('');

    // Post-export recommendations
    if (successCount > 0) {
        console.log(chalk.gray('💡 Skills are now available in your AI coding tools!'));
        console.log(chalk.gray('   Restart your IDE or run the tool\'s reload command to use them.'));
    }
}

async function exportSkillsToAgent(
    agent: DetectedAgent,
    skills: SkillMetadata[],
    force?: boolean
): Promise<number> {
    const targetDir = agent.skillsPath;

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    let exportedCount = 0;

    for (const skill of skills) {
        const sourcePath = skill.path;
        const targetPath = path.join(targetDir, path.basename(sourcePath));

        // Skip if already exists and not forcing
        if (fs.existsSync(targetPath) && !force) {
            // Check if it's the same skill (by comparing SKILL.md content)
            const sourceSkillMd = path.join(sourcePath, 'SKILL.md');
            const targetSkillMd = path.join(targetPath, 'SKILL.md');

            if (fs.existsSync(sourceSkillMd) && fs.existsSync(targetSkillMd)) {
                const sourceContent = fs.readFileSync(sourceSkillMd, 'utf-8');
                const targetContent = fs.readFileSync(targetSkillMd, 'utf-8');

                if (sourceContent === targetContent) {
                    // Same content, skip
                    continue;
                }
            }
        }

        // If source is a symlink, create a symlink in target
        const stats = fs.lstatSync(sourcePath);

        if (stats.isSymbolicLink()) {
            const realPath = fs.realpathSync(sourcePath);

            // Remove existing if force
            if (fs.existsSync(targetPath)) {
                if (force) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                } else {
                    continue;
                }
            }

            // Create symlink
            fs.symlinkSync(realPath, targetPath, 'junction');
        } else {
            // Copy directory
            if (fs.existsSync(targetPath)) {
                if (force) {
                    fs.rmSync(targetPath, { recursive: true, force: true });
                } else {
                    continue;
                }
            }

            fs.cpSync(sourcePath, targetPath, { recursive: true });
        }

        exportedCount++;
    }

    return exportedCount;
}

/**
 * List agents that skills can be exported to.
 */
export async function listExportTargets(): Promise<void> {
    console.log(chalk.cyan.bold('\n🎯 Available Export Targets\n'));

    const result = detectInstalledAgents('.');

    console.log(chalk.bold('Detected (ready to export):\n'));
    const detected = result.agents.filter(a => a.detected);

    if (detected.length === 0) {
        console.log(chalk.gray('  No AI tools detected'));
    } else {
        detected.forEach(agent => {
            console.log(`  ${agent.icon} ${chalk.green(agent.name)}`);
            console.log(chalk.gray(`     ${agent.installCommand}`));
        });
    }

    console.log(chalk.bold('\nOther supported agents:\n'));
    const notDetected = result.agents.filter(a => !a.detected);

    notDetected.forEach(agent => {
        console.log(`  ${agent.icon} ${chalk.gray(agent.name)}`);
    });

    console.log(chalk.gray('\n💡 Use --all to export to all detected agents'));
    console.log(chalk.gray('   Or specify individual targets: --cursor, --copilot, --claude, etc.\n'));
}
