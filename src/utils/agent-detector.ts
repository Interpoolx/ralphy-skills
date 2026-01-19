import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface DetectedAgent {
    name: string;
    id: string;
    detected: boolean;
    version?: string;
    skillsPath: string;
    configPath?: string;
    icon: string;
    installCommand?: string;
}

export interface DetectionResult {
    agents: DetectedAgent[];
    projectPath: string;
    hasSkillsDir: boolean;
    hasAgentsMd: boolean;
    installedSkillsCount: number;
    symlinkedSkillsCount: number;
    recommendations: string[];
}

/**
 * Detect all supported AI coding tools installed on the system.
 */
export function detectInstalledAgents(projectPath: string = '.'): DetectionResult {
    const home = os.homedir();
    const resolvedProject = path.resolve(projectPath);

    const agents: DetectedAgent[] = [
        detectCursor(home, resolvedProject),
        detectVSCodeCopilot(home, resolvedProject),
        detectClaudeCode(home, resolvedProject),
        detectWindsurf(home, resolvedProject),
        detectAider(home, resolvedProject),
        detectGeminiCLI(home, resolvedProject),
        detectOpenCode(home, resolvedProject),
        detectCodexCLI(home, resolvedProject),
        // New clients (matching skills-installer)
        detectAmp(home, resolvedProject),
        detectGoose(home, resolvedProject),
        detectLetta(home, resolvedProject),
        detectTrae(home, resolvedProject),
        detectQoder(home, resolvedProject),
        detectCodeBuddy(home, resolvedProject),
        detectAntigravity(home, resolvedProject),
    ];

    // Check for universal .agent directory
    const agentDir = path.join(resolvedProject, '.agent', 'skills');
    const hasSkillsDir = fs.existsSync(agentDir);
    const hasAgentsMd = fs.existsSync(path.join(resolvedProject, 'AGENTS.md'));

    // Count installed skills
    let installedSkillsCount = 0;
    let symlinkedSkillsCount = 0;

    if (hasSkillsDir) {
        try {
            const skills = fs.readdirSync(agentDir);
            for (const skill of skills) {
                const skillPath = path.join(agentDir, skill);
                const stats = fs.lstatSync(skillPath);
                if (stats.isDirectory() || stats.isSymbolicLink()) {
                    installedSkillsCount++;
                    if (stats.isSymbolicLink()) {
                        symlinkedSkillsCount++;
                    }
                }
            }
        } catch (e) {
            // Ignore errors
        }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(agents, hasSkillsDir, hasAgentsMd, installedSkillsCount);

    return {
        agents,
        projectPath: resolvedProject,
        hasSkillsDir,
        hasAgentsMd,
        installedSkillsCount,
        symlinkedSkillsCount,
        recommendations
    };
}

function detectCursor(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.cursor', 'rules');
    const projectPath = path.join(project, '.cursor', 'rules');
    const detected = fs.existsSync(path.join(home, '.cursor')) || fs.existsSync(path.join(project, '.cursor'));

    let version: string | undefined;
    try {
        // Try to detect Cursor version from common locations
        const cursorConfigPath = path.join(home, '.cursor', 'config.json');
        if (fs.existsSync(cursorConfigPath)) {
            const config = JSON.parse(fs.readFileSync(cursorConfigPath, 'utf-8'));
            version = config.version;
        }
    } catch (e) {
        // Version detection failed
    }

    return {
        name: 'Cursor',
        id: 'cursor',
        detected,
        version,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.cursor'),
        icon: '🖱️',
        installCommand: 'npx ralphy-skills export --cursor'
    };
}

function detectVSCodeCopilot(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.github', 'skills');
    const projectPath = path.join(project, '.github', 'skills');

    // Check if VS Code exists and Copilot extension is installed
    const vscodeExtPath = path.join(home, '.vscode', 'extensions');
    let detected = false;
    let version: string | undefined;

    if (fs.existsSync(vscodeExtPath)) {
        try {
            const extensions = fs.readdirSync(vscodeExtPath);
            const copilotExt = extensions.find(ext => ext.toLowerCase().includes('github.copilot'));
            if (copilotExt) {
                detected = true;
                const match = copilotExt.match(/github\.copilot-(\d+\.\d+\.\d+)/i);
                if (match) version = match[1];
            }
        } catch (e) {
            // Fallback: just check if .github/skills exists
            detected = fs.existsSync(globalPath) || fs.existsSync(projectPath);
        }
    }

    return {
        name: 'VS Code + Copilot',
        id: 'copilot',
        detected,
        version,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.vscode'),
        icon: '🤖',
        installCommand: 'npx ralphy-skills export --copilot'
    };
}

function detectClaudeCode(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.claude', 'skills');
    const projectPath = path.join(project, '.claude', 'skills');
    const detected = fs.existsSync(path.join(home, '.claude')) || fs.existsSync(path.join(project, '.claude'));

    return {
        name: 'Claude Code',
        id: 'claude',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.claude'),
        icon: '🧠',
        installCommand: 'npx ralphy-skills export --claude'
    };
}

function detectWindsurf(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.windsurf', 'skills');
    const projectPath = path.join(project, '.windsurf', 'skills');
    const detected = fs.existsSync(path.join(home, '.windsurf')) || fs.existsSync(path.join(project, '.windsurf'));

    return {
        name: 'Windsurf',
        id: 'windsurf',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.windsurf'),
        icon: '🏄',
        installCommand: 'npx ralphy-skills export --windsurf'
    };
}

function detectAider(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.aider', 'skills');
    const projectPath = path.join(project, '.aider', 'skills');
    let detected = fs.existsSync(path.join(home, '.aider'));

    // Also check if aider is in PATH
    if (!detected) {
        try {
            execSync('aider --version', { stdio: 'pipe' });
            detected = true;
        } catch (e) {
            // Not installed
        }
    }

    return {
        name: 'Aider',
        id: 'aider',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.aider'),
        icon: '🔧',
        installCommand: 'npx ralphy-skills export --aider'
    };
}

function detectGeminiCLI(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.gemini', 'skills');
    const projectPath = path.join(project, '.gemini', 'skills');
    const detected = fs.existsSync(path.join(home, '.gemini'));

    return {
        name: 'Gemini CLI',
        id: 'gemini',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.gemini'),
        icon: '💎',
        installCommand: 'npx ralphy-skills export --gemini'
    };
}

function detectOpenCode(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.opencode', 'skills');
    const projectPath = path.join(project, '.opencode', 'skills');
    const detected = fs.existsSync(path.join(home, '.opencode'));

    return {
        name: 'OpenCode',
        id: 'opencode',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.opencode'),
        icon: '📂',
        installCommand: 'npx ralphy-skills export --opencode'
    };
}

function detectCodexCLI(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.codex', 'skills');
    const projectPath = path.join(project, '.codex', 'skills');
    let detected = fs.existsSync(path.join(home, '.codex'));

    // Also check for OpenAI Codex CLI
    if (!detected) {
        try {
            execSync('codex --version', { stdio: 'pipe' });
            detected = true;
        } catch (e) {
            // Not installed
        }
    }

    return {
        name: 'OpenAI Codex CLI',
        id: 'codex',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.codex'),
        icon: '🤯',
        installCommand: 'npx ralphy-skills export --codex'
    };
}

// New AI client detectors (matching skills-installer)

function detectAmp(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.amp', 'skills');
    const projectPath = path.join(project, '.amp', 'skills');
    const detected = fs.existsSync(path.join(home, '.amp'));

    return {
        name: 'Amp',
        id: 'amp',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.amp'),
        icon: '⚡',
        installCommand: 'npx ralphy-skills export --amp'
    };
}

function detectGoose(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.goose', 'skills');
    const projectPath = path.join(project, '.goose', 'skills');
    const detected = fs.existsSync(path.join(home, '.goose'));

    return {
        name: 'Goose',
        id: 'goose',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.goose'),
        icon: '🪿',
        installCommand: 'npx ralphy-skills export --goose'
    };
}

function detectLetta(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.letta', 'skills');
    const projectPath = path.join(project, '.letta', 'skills');
    // Also check for old MemGPT location
    const detected = fs.existsSync(path.join(home, '.letta')) || fs.existsSync(path.join(home, '.memgpt'));

    return {
        name: 'Letta (MemGPT)',
        id: 'letta',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.letta'),
        icon: '🧠',
        installCommand: 'npx ralphy-skills export --letta'
    };
}

function detectTrae(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.trae', 'skills');
    const projectPath = path.join(project, '.trae', 'skills');
    const detected = fs.existsSync(path.join(home, '.trae'));

    return {
        name: 'Trae',
        id: 'trae',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.trae'),
        icon: '🎯',
        installCommand: 'npx ralphy-skills export --trae'
    };
}

function detectQoder(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.qoder', 'skills');
    const projectPath = path.join(project, '.qoder', 'skills');
    const detected = fs.existsSync(path.join(home, '.qoder'));

    return {
        name: 'Qoder',
        id: 'qoder',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.qoder'),
        icon: '🔷',
        installCommand: 'npx ralphy-skills export --qoder'
    };
}

function detectCodeBuddy(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.codebuddy', 'skills');
    const projectPath = path.join(project, '.codebuddy', 'skills');
    const detected = fs.existsSync(path.join(home, '.codebuddy'));

    return {
        name: 'CodeBuddy',
        id: 'codebuddy',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.codebuddy'),
        icon: '👯',
        installCommand: 'npx ralphy-skills export --codebuddy'
    };
}

function detectAntigravity(home: string, project: string): DetectedAgent {
    const globalPath = path.join(home, '.antigravity', 'skills');
    const projectPath = path.join(project, '.antigravity', 'skills');
    const detected = fs.existsSync(path.join(home, '.antigravity')) || fs.existsSync(path.join(home, '.gemini', 'antigravity'));

    return {
        name: 'Antigravity',
        id: 'antigravity',
        detected,
        skillsPath: fs.existsSync(projectPath) ? projectPath : globalPath,
        configPath: path.join(home, '.antigravity'),
        icon: '🚀',
        installCommand: 'npx ralphy-skills export --antigravity'
    };
}

function generateRecommendations(
    agents: DetectedAgent[],
    hasSkillsDir: boolean,
    hasAgentsMd: boolean,
    installedSkillsCount: number
): string[] {
    const recommendations: string[] = [];
    const detectedAgents = agents.filter(a => a.detected);

    if (detectedAgents.length === 0) {
        recommendations.push('💡 No AI coding tools detected. Install Cursor, VS Code + Copilot, or Claude Code to get started.');
    }

    if (!hasSkillsDir) {
        recommendations.push('💡 Run `npx ralphy-skills init` to set up skill directories.');
    }

    if (!hasAgentsMd && installedSkillsCount > 0) {
        recommendations.push('💡 Run `npx ralphy-skills sync` to generate AGENTS.md for AI agents.');
    }

    if (detectedAgents.length > 1 && !hasSkillsDir) {
        recommendations.push('💡 Use `--universal` flag for multi-agent compatibility.');
    }

    if (installedSkillsCount === 0) {
        recommendations.push('💡 Run `npx ralphy-skills list --registry` to browse available skills.');
    }

    if (detectedAgents.length > 0 && installedSkillsCount > 0) {
        const unexportedAgents = detectedAgents.filter(a => {
            return !fs.existsSync(a.skillsPath) ||
                fs.readdirSync(a.skillsPath).length === 0;
        });

        if (unexportedAgents.length > 0) {
            recommendations.push(`💡 Run \`npx ralphy-skills export --all\` to sync skills to all ${unexportedAgents.length} detected agent(s).`);
        }
    }

    return recommendations;
}

/**
 * Get the recommended skills path based on detected agents.
 */
export function getRecommendedSkillsPath(projectPath: string = '.'): string {
    const result = detectInstalledAgents(projectPath);
    const detectedAgents = result.agents.filter(a => a.detected);

    // If multiple agents detected, use universal .agent/skills
    if (detectedAgents.length > 1 || detectedAgents.length === 0) {
        return path.join(path.resolve(projectPath), '.agent', 'skills');
    }

    // If only one agent detected, use its preferred path
    return detectedAgents[0].skillsPath;
}

/**
 * Export skills to a specific agent's directory.
 */
export function getAgentSkillsPath(agentId: string, projectPath: string = '.'): string | null {
    const result = detectInstalledAgents(projectPath);
    const agent = result.agents.find(a => a.id === agentId);

    if (!agent) {
        return null;
    }

    return agent.skillsPath;
}
