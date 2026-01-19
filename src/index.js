#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const install_1 = require("./commands/install");
const list_1 = require("./commands/list");
const update_1 = require("./commands/update");
const program = new commander_1.Command();
// ASCII Art Banner
const banner = `
${chalk_1.default.cyan('╔═══════════════════════════════════════════════════════╗')}
${chalk_1.default.cyan('║')}  ${chalk_1.default.bold.white('🚀 Ralphy Skills')} ${chalk_1.default.gray('- Universal Skills Loader')}          ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('║')}  ${chalk_1.default.gray('   For AI Coding Agents (Cursor, VS Code, etc.)')}     ${chalk_1.default.cyan('║')}
${chalk_1.default.cyan('╚═══════════════════════════════════════════════════════╝')}
`;
program
    .name('ralphy-skills')
    .description('Universal Skills loader for AI Coding Agents')
    .version('1.0.0')
    .hook('preAction', () => {
    console.log(banner);
});
program
    .command('install <skill>')
    .alias('i')
    .description('Install a skill by name or URL')
    .option('-d, --dir <directory>', 'Target directory', '.agent/skills')
    .option('--cursor', 'Also install to .cursor/rules')
    .action(async (skill, options) => {
    await (0, install_1.installSkill)(skill, options);
});
program
    .command('list')
    .alias('ls')
    .description('List all available skills from registry')
    .option('-i, --installed', 'Show only installed skills')
    .action(async (options) => {
    await (0, list_1.listSkills)(options);
});
program
    .command('update')
    .alias('up')
    .description('Update all installed skills to latest versions')
    .option('-s, --skill <name>', 'Update a specific skill only')
    .action(async (options) => {
    await (0, update_1.updateSkills)(options);
});
program
    .command('search <query>')
    .description('Search for skills by name or description')
    .action(async (query) => {
    const { searchSkills } = await Promise.resolve().then(() => __importStar(require('./commands/list')));
    await searchSkills(query);
});
program.parse();
//# sourceMappingURL=index.js.map