"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installSkill = installSkill;
const chalk_1 = __importDefault(require("chalk"));
const registry_1 = require("../utils/registry");
const downloader_1 = require("../utils/downloader");
/**
 * Install a skill by name or GitHub URL.
 */
async function installSkill(skillNameOrUrl, options) {
    console.log(chalk_1.default.gray(`Installing: ${skillNameOrUrl}\n`));
    let githubUrl;
    let folderName;
    let skillName;
    // Check if it's a URL or a skill name
    if (skillNameOrUrl.includes('github.com') || skillNameOrUrl.startsWith('http')) {
        // Direct GitHub URL
        githubUrl = skillNameOrUrl;
        const parsed = (0, downloader_1.parseGitHubUrl)(skillNameOrUrl);
        if (!parsed) {
            console.log(chalk_1.default.red('✗ Invalid GitHub URL'));
            process.exit(1);
        }
        folderName = generateFolderName(parsed.owner, parsed.repo, parsed.pathInRepo);
        skillName = folderName;
    }
    else {
        // Look up in registry
        const skill = (0, registry_1.findSkill)(skillNameOrUrl);
        if (!skill) {
            console.log(chalk_1.default.red(`✗ Skill "${skillNameOrUrl}" not found in registry`));
            console.log(chalk_1.default.gray('\nAvailable skills:'));
            const registry = (0, registry_1.loadRegistry)();
            registry.forEach((s) => {
                console.log(chalk_1.default.cyan(`  • ${s.id}`) + chalk_1.default.gray(` - ${s.description}`));
            });
            process.exit(1);
        }
        githubUrl = skill.url;
        folderName = skill.folder_name;
        skillName = skill.name;
    }
    // Check if already installed
    if ((0, registry_1.isSkillInstalled)(folderName)) {
        console.log(chalk_1.default.yellow(`⚠ Skill "${skillName}" is already installed.`));
        console.log(chalk_1.default.gray('  Use "ralphy-skills update" to update it.\n'));
        return;
    }
    try {
        const result = await (0, downloader_1.installSkillFromUrl)(githubUrl, folderName, '.', {
            cursor: options.cursor,
            onFile: (filename) => {
                console.log(chalk_1.default.gray(`  └─ ${filename}`));
            },
        });
        console.log('');
        console.log(chalk_1.default.green(`✓ Successfully installed ${chalk_1.default.bold(skillName)}`));
        console.log(chalk_1.default.gray(`  ${result.filesInstalled} files → ${result.targetDir}`));
        if (options.cursor) {
            console.log(chalk_1.default.gray(`  Also installed to .cursor/rules/${folderName}`));
        }
        console.log('');
        console.log(chalk_1.default.cyan('💡 Tip: Restart your AI agent to load the new skill.'));
    }
    catch (error) {
        console.log(chalk_1.default.red(`✗ Installation failed: ${error.message}`));
        process.exit(1);
    }
}
/**
 * Generate a folder name from GitHub URL components.
 */
function generateFolderName(owner, repo, pathInRepo) {
    const genericWords = new Set(['main', 'master', 'tree', 'branch', 'dev', 'develop', 'src', 'lib', 'plugins']);
    const allParts = [repo, ...pathInRepo.split('/').filter((p) => p && p.length > 0)];
    // Look for *-skills pattern
    const skillsPatternMatch = allParts.find((part) => /^[\w]+-skills$/i.test(part));
    if (skillsPatternMatch) {
        return skillsPatternMatch.toLowerCase();
    }
    // Look for *-rules pattern
    const rulesPatternMatch = allParts.find((part) => /^[\w]+-rules$/i.test(part));
    if (rulesPatternMatch) {
        return rulesPatternMatch.toLowerCase().replace(/-rules$/, '-skills');
    }
    // Fallback to owner-skills
    return `${owner.toLowerCase()}-skills`;
}
//# sourceMappingURL=install.js.map