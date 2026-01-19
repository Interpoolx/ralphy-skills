import chalk from 'chalk';
import { detectInstalledAgents, DetectionResult } from '../utils/agent-detector';
import { getInstalledSkillsMetadata } from '../utils/registry';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface DoctorOptions {
    json?: boolean;
    fix?: boolean;
}

/**
 * Implementation of the 'doctor' command.
 * Diagnose environment, detect AI tools, and provide recommendations.
 */
export async function runDoctor(options: DoctorOptions = {}): Promise<void> {
    if (options.json) {
        await runDoctorJSON();
        return;
    }

    console.log(chalk.cyan.bold('\n🩺 Ralphy Skills Doctor\n'));
    console.log(chalk.gray('Diagnosing your environment...\n'));

    const result = detectInstalledAgents('.');

    // Section 1: Detected AI Tools
    printDetectedAgents(result);

    // Section 2: Environment Summary
    printEnvironmentSummary(result);

    // Section 3: Installed Skills
    printInstalledSkills();

    // Section 4: Health Checks
    await runHealthChecks(options);

    // Section 5: Recommendations
    printRecommendations(result);

    // Auto-fix if requested
    if (options.fix) {
        await autoFix(result);
    }
}

function printDetectedAgents(result: DetectionResult): void {
    console.log(chalk.bold('🔍 Detected AI Coding Tools:\n'));

    const detected = result.agents.filter(a => a.detected);
    const notDetected = result.agents.filter(a => !a.detected);

    if (detected.length === 0) {
        console.log(chalk.yellow('  ⚠️  No AI coding tools detected\n'));
    } else {
        detected.forEach(agent => {
            const version = agent.version ? chalk.gray(` (v${agent.version})`) : '';
            console.log(chalk.green(`  ✅ ${agent.icon} ${agent.name}${version}`));
            console.log(chalk.gray(`      Skills path: ${agent.skillsPath}`));
        });
        console.log('');
    }

    if (notDetected.length > 0) {
        console.log(chalk.gray('  Not detected:'));
        notDetected.slice(0, 4).forEach(agent => {
            console.log(chalk.gray(`    ⋅ ${agent.icon} ${agent.name}`));
        });
        if (notDetected.length > 4) {
            console.log(chalk.gray(`    ⋅ ...and ${notDetected.length - 4} more`));
        }
        console.log('');
    }
}

function printEnvironmentSummary(result: DetectionResult): void {
    console.log(chalk.bold('📂 Environment Summary:\n'));

    console.log(`  📁 Project: ${chalk.cyan(result.projectPath)}`);
    console.log(`  📦 Skills Directory: ${result.hasSkillsDir ? chalk.green('✓ exists') : chalk.yellow('✗ not found')}`);
    console.log(`  📄 AGENTS.md: ${result.hasAgentsMd ? chalk.green('✓ exists') : chalk.yellow('✗ not found')}`);
    console.log(`  🔢 Installed Skills: ${chalk.cyan(result.installedSkillsCount.toString())}`);
    console.log(`  🔗 Symlinked Skills: ${chalk.cyan(result.symlinkedSkillsCount.toString())}`);

    // Check for global config
    const globalConfigPath = path.join(os.homedir(), '.ralphy', 'config.json');
    const hasGlobalConfig = fs.existsSync(globalConfigPath);
    console.log(`  ⚙️  Global Config: ${hasGlobalConfig ? chalk.green('✓ exists') : chalk.gray('not configured')}`);

    // Check for registry cache
    const cachePath = path.join(os.homedir(), '.ralphy', 'registry_cache.json');
    let cacheStatus = chalk.gray('not cached');
    if (fs.existsSync(cachePath)) {
        try {
            const stats = fs.statSync(cachePath);
            const age = Date.now() - stats.mtimeMs;
            const hours = Math.floor(age / (1000 * 60 * 60));
            if (hours < 24) {
                cacheStatus = chalk.green(`✓ fresh (${hours}h ago)`);
            } else {
                cacheStatus = chalk.yellow(`⚠️  stale (${Math.floor(hours / 24)}d ago)`);
            }
        } catch (e) {
            // Ignore
        }
    }
    console.log(`  📋 Registry Cache: ${cacheStatus}`);
    console.log('');
}

function printInstalledSkills(): void {
    const skills = getInstalledSkillsMetadata();

    if (skills.length === 0) {
        return;
    }

    console.log(chalk.bold('📦 Installed Skills:\n'));

    // Group by source
    const bySource: Record<string, typeof skills> = {};
    skills.forEach(skill => {
        const source = skill.source || 'Unknown';
        if (!bySource[source]) bySource[source] = [];
        bySource[source].push(skill);
    });

    Object.entries(bySource).forEach(([source, sourceSkills]) => {
        console.log(chalk.gray(`  ${source}:`));
        sourceSkills.forEach(skill => {
            const symlink = skill.isSymlink ? chalk.yellow(' 🔗') : '';
            console.log(`    ✓ ${skill.name}${symlink}`);
        });
    });
    console.log('');
}

async function runHealthChecks(options: DoctorOptions): Promise<void> {
    console.log(chalk.bold('🏥 Health Checks:\n'));

    const checks: { name: string; status: 'pass' | 'warn' | 'fail'; message: string }[] = [];

    // Check 1: Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (nodeMajor >= 16) {
        checks.push({ name: 'Node.js Version', status: 'pass', message: `${nodeVersion} (>= 16)` });
    } else {
        checks.push({ name: 'Node.js Version', status: 'fail', message: `${nodeVersion} (requires >= 16)` });
    }

    // Check 2: Git available
    try {
        const { execSync } = require('child_process');
        execSync('git --version', { stdio: 'pipe' });
        checks.push({ name: 'Git Available', status: 'pass', message: 'Installed' });
    } catch (e) {
        checks.push({ name: 'Git Available', status: 'warn', message: 'Not found (needed for GitHub skills)' });
    }

    // Check 3: Write permissions
    try {
        const testPath = path.join(process.cwd(), '.ralphy-test-write');
        fs.writeFileSync(testPath, 'test');
        fs.unlinkSync(testPath);
        checks.push({ name: 'Write Permissions', status: 'pass', message: 'Current directory writable' });
    } catch (e) {
        checks.push({ name: 'Write Permissions', status: 'fail', message: 'Cannot write to current directory' });
    }

    // Check 4: SKILL.md validation in installed skills
    const skills = getInstalledSkillsMetadata();
    let validSkills = 0;
    let invalidSkills = 0;

    skills.forEach(skill => {
        const skillMdPath = path.join(skill.path, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
            validSkills++;
        } else {
            invalidSkills++;
        }
    });

    if (skills.length > 0) {
        if (invalidSkills === 0) {
            checks.push({ name: 'Skill Files', status: 'pass', message: `All ${validSkills} skills have SKILL.md` });
        } else {
            checks.push({ name: 'Skill Files', status: 'warn', message: `${invalidSkills} skills missing SKILL.md` });
        }
    }

    // Print checks
    checks.forEach(check => {
        let icon: string;
        let color: typeof chalk.green;

        switch (check.status) {
            case 'pass':
                icon = '✅';
                color = chalk.green;
                break;
            case 'warn':
                icon = '⚠️ ';
                color = chalk.yellow;
                break;
            case 'fail':
                icon = '❌';
                color = chalk.red;
                break;
        }

        console.log(`  ${icon} ${check.name}: ${color(check.message)}`);
    });
    console.log('');
}

function printRecommendations(result: DetectionResult): void {
    if (result.recommendations.length === 0) {
        console.log(chalk.green.bold('✨ Everything looks good! No recommendations.\n'));
        return;
    }

    console.log(chalk.bold('💡 Recommendations:\n'));
    result.recommendations.forEach(rec => {
        console.log(`  ${rec}`);
    });
    console.log('');
}

async function autoFix(result: DetectionResult): Promise<void> {
    console.log(chalk.cyan.bold('🔧 Auto-fix Mode\n'));

    let fixCount = 0;

    // Fix 1: Create .agent/skills directory if missing
    if (!result.hasSkillsDir) {
        const skillsDir = path.join(result.projectPath, '.agent', 'skills');
        fs.mkdirSync(skillsDir, { recursive: true });
        console.log(chalk.green(`  ✅ Created ${skillsDir}`));
        fixCount++;
    }

    // Fix 2: Create AGENTS.md if missing and skills exist
    if (!result.hasAgentsMd && result.installedSkillsCount > 0) {
        console.log(chalk.yellow(`  ⚠️  Run 'npx ralphy-skills sync' to create AGENTS.md`));
    }

    // Fix 3: Create global config directory
    const globalDir = path.join(os.homedir(), '.ralphy');
    if (!fs.existsSync(globalDir)) {
        fs.mkdirSync(globalDir, { recursive: true });
        console.log(chalk.green(`  ✅ Created ${globalDir}`));
        fixCount++;
    }

    if (fixCount === 0) {
        console.log(chalk.gray('  No automatic fixes needed.'));
    } else {
        console.log(chalk.green(`\n  ✅ Applied ${fixCount} fix(es)`));
    }
    console.log('');
}

async function runDoctorJSON(): Promise<void> {
    const result = detectInstalledAgents('.');
    const skills = getInstalledSkillsMetadata();

    const output = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            projectPath: result.projectPath,
            hasSkillsDir: result.hasSkillsDir,
            hasAgentsMd: result.hasAgentsMd
        },
        agents: result.agents.map(a => ({
            id: a.id,
            name: a.name,
            detected: a.detected,
            version: a.version,
            skillsPath: a.skillsPath
        })),
        skills: skills.map(s => ({
            name: s.name,
            source: s.source,
            isSymlink: s.isSymlink,
            path: s.path
        })),
        recommendations: result.recommendations
    };

    console.log(JSON.stringify(output, null, 2));
}
