"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSkills = updateSkills;
const chalk_1 = __importDefault(require("chalk"));
const registry_1 = require("../utils/registry");
const downloader_1 = require("../utils/downloader");
/**
 * Update installed skills to latest versions.
 */
async function updateSkills(options) {
    const registry = (0, registry_1.loadRegistry)();
    const installedFolders = (0, registry_1.getInstalledSkills)();
    if (installedFolders.length === 0) {
        console.log(chalk_1.default.yellow('No skills installed yet.'));
        console.log(chalk_1.default.gray('Use "ralphy-skills install <skill>" to install one.\n'));
        return;
    }
    // Filter to specific skill if provided
    let toUpdate = installedFolders;
    if (options.skill) {
        const skill = registry.find((s) => s.id.toLowerCase() === options.skill.toLowerCase() ||
            s.folder_name.toLowerCase() === options.skill.toLowerCase());
        if (!skill) {
            console.log(chalk_1.default.red(`Skill "${options.skill}" not found in registry.`));
            process.exit(1);
        }
        if (!installedFolders.includes(skill.folder_name)) {
            console.log(chalk_1.default.yellow(`Skill "${skill.name}" is not installed.`));
            process.exit(1);
        }
        toUpdate = [skill.folder_name];
    }
    console.log(chalk_1.default.bold(`🔄 Updating ${toUpdate.length} skill(s)...\n`));
    let successCount = 0;
    let failCount = 0;
    for (const folder of toUpdate) {
        const skill = registry.find((s) => s.folder_name === folder);
        if (!skill) {
            console.log(chalk_1.default.gray(`  ⏭ ${folder} - Not in registry, skipping`));
            continue;
        }
        console.log(chalk_1.default.gray(`  ↻ Updating ${skill.name}...`));
        try {
            const result = await (0, downloader_1.installSkillFromUrl)(skill.url, skill.folder_name, '.', {
                onFile: () => { }, // Silent
            });
            console.log(chalk_1.default.green(`  ✓ ${skill.name}`) + chalk_1.default.gray(` (${result.filesInstalled} files)`));
            successCount++;
        }
        catch (error) {
            console.log(chalk_1.default.red(`  ✗ ${skill.name} - ${error.message}`));
            failCount++;
        }
    }
    console.log('');
    if (failCount === 0) {
        console.log(chalk_1.default.green(`✓ Successfully updated ${successCount} skill(s)`));
    }
    else {
        console.log(chalk_1.default.yellow(`Updated ${successCount}, failed ${failCount}`));
    }
}
//# sourceMappingURL=update.js.map