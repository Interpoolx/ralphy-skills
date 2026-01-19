"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSkills = listSkills;
exports.searchSkills = searchSkills;
const chalk_1 = __importDefault(require("chalk"));
const registry_1 = require("../utils/registry");
/**
 * List all available skills from the registry.
 */
async function listSkills(options) {
    const registry = (0, registry_1.loadRegistry)();
    const installedFolders = (0, registry_1.getInstalledSkills)();
    if (options.installed) {
        console.log(chalk_1.default.bold('📦 Installed Skills:\n'));
        if (installedFolders.length === 0) {
            console.log(chalk_1.default.gray('  No skills installed yet.'));
            console.log(chalk_1.default.gray('  Use "ralphy-skills install <skill>" to install one.\n'));
            return;
        }
        installedFolders.forEach((folder) => {
            const skill = registry.find((s) => s.folder_name === folder);
            if (skill) {
                console.log(chalk_1.default.green(`  ✓ ${skill.name}`) + chalk_1.default.gray(` (${folder})`));
                console.log(chalk_1.default.gray(`    ${skill.description}\n`));
            }
            else {
                console.log(chalk_1.default.green(`  ✓ ${folder}`) + chalk_1.default.gray(' (custom)'));
            }
        });
    }
    else {
        console.log(chalk_1.default.bold('📚 Available Skills:\n'));
        registry.forEach((skill) => {
            const installed = (0, registry_1.isSkillInstalled)(skill.folder_name);
            const status = installed ? chalk_1.default.green(' ✓') : '  ';
            const name = installed ? chalk_1.default.green(skill.name) : chalk_1.default.white(skill.name);
            console.log(`${status} ${name}`);
            console.log(chalk_1.default.gray(`     ${skill.description}`));
            console.log(chalk_1.default.gray(`     ID: ${skill.id}\n`));
        });
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan(`\n💡 Install with: npx ralphy-skills install <skill-id>\n`));
    }
}
/**
 * Search skills by query.
 */
async function searchSkills(query) {
    const registry = (0, registry_1.loadRegistry)();
    const lowerQuery = query.toLowerCase();
    const matches = registry.filter((skill) => skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.id.toLowerCase().includes(lowerQuery));
    if (matches.length === 0) {
        console.log(chalk_1.default.yellow(`No skills found matching "${query}"\n`));
        console.log(chalk_1.default.gray('Try a different search term or run "ralphy-skills list" to see all skills.'));
        return;
    }
    console.log(chalk_1.default.bold(`🔍 Search Results for "${query}":\n`));
    matches.forEach((skill) => {
        const installed = (0, registry_1.isSkillInstalled)(skill.folder_name);
        const status = installed ? chalk_1.default.green(' ✓') : '  ';
        const name = installed ? chalk_1.default.green(skill.name) : chalk_1.default.white(skill.name);
        console.log(`${status} ${name}`);
        console.log(chalk_1.default.gray(`     ${skill.description}`));
        console.log(chalk_1.default.gray(`     ID: ${skill.id}\n`));
    });
}
//# sourceMappingURL=list.js.map