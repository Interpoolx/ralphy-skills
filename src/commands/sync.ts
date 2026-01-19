import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getInstalledSkillsMetadata } from '../utils/registry';

interface SyncOptions {
    yes?: boolean;
    output?: string;
    format?: 'markdown' | 'json' | 'yaml';
    dryRun?: boolean;
    includeMetadata?: boolean;
}

/**
 * Implementation of the 'sync' command.
 * Updates AGENTS.md with installed skills.
 */
export async function syncAgents(options: SyncOptions): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    const outputPath = path.resolve(options.output || 'AGENTS.md');
    const format = options.format || 'markdown';

    if (skills.length === 0) {
        console.log(chalk.yellow('\n📦 No skills found to sync.'));
        console.log(chalk.gray('Install some skills first with: npx ralphy-skills install <skill-name>'));
        return;
    }

    let output: string;
    let isNewFile = false;

    switch (format) {
        case 'json':
            output = generateJSONOutput(skills, options);
            break;
        case 'yaml':
            output = generateYAMLOutput(skills, options);
            break;
        case 'markdown':
        default:
            output = generateMarkdownOutput(skills, outputPath, options);
            isNewFile = !fs.existsSync(outputPath);
            break;
    }

    if (options.dryRun) {
        console.log(chalk.cyan.bold('\n📋 Dry Run - No files will be written'));
        console.log(chalk.gray(`Format: ${format.toUpperCase()}`));
        console.log(chalk.gray(`Output: ${outputPath}`));
        console.log(chalk.gray(`Skills: ${skills.length}`));
        console.log(chalk.yellow('\n--- Generated Content ---'));
        console.log(output);
        return;
    }

    // Check if we need confirmation for file overwrite
    if (fs.existsSync(outputPath) && !options.yes) {
        console.log(chalk.yellow(`\n⚠️  File ${path.basename(outputPath)} already exists`));
        const { overwrite } = await import('inquirer').then(inquirer => 
            inquirer.default.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: 'Overwrite existing file?',
                default: false
            }])
        );

        if (!overwrite) {
            console.log(chalk.yellow('\n❌ Sync cancelled'));
            return;
        }
    }

    // Create backup if file exists
    if (fs.existsSync(outputPath)) {
        const backupPath = outputPath + '.backup';
        fs.copyFileSync(outputPath, backupPath);
        console.log(chalk.gray(`📋 Backup created: ${path.basename(backupPath)}`));
    }

    // Write the output
    fs.writeFileSync(outputPath, output);
    
    const action = isNewFile ? 'Created' : 'Updated';
    console.log(chalk.green(`\n✅ ${action}: ${path.basename(outputPath)} (${skills.length} skill(s))`));
    
    if (format === 'json' || format === 'yaml') {
        console.log(chalk.gray(`📊 Output format: ${format.toUpperCase()}`));
    }
}

function generateMarkdownOutput(skills: any[], outputPath: string, options: SyncOptions): string {
    let agentsContent = '';
    if (fs.existsSync(outputPath)) {
        agentsContent = fs.readFileSync(outputPath, 'utf8');
    }

    const skillsTable = generateSkillsBlock(skills, options);

    const startMarker = '<!-- SKILLS_TABLE_START -->';
    const endMarker = '<!-- SKILLS_TABLE_END -->';

    let newContent: string;
    if (agentsContent.includes(startMarker) && agentsContent.includes(endMarker)) {
        // Replace existing block
        const before = agentsContent.split(startMarker)[0];
        const after = agentsContent.split(endMarker)[1];
        newContent = before + startMarker + '\n' + skillsTable + '\n' + endMarker + after;
    } else {
        // Append new block or wrap in skills_system
        const section = `<skills_system priority="1">

## Available Skills

${startMarker}
${skillsTable}
${endMarker}

</skills_system>`;
        newContent = agentsContent + '\n' + section;
    }

    return newContent.trim() + '\n';
}

function generateJSONOutput(skills: any[], options: SyncOptions): string {
    const output: any = {
        generated_at: new Date().toISOString(),
        skills_count: skills.length,
        skills: skills.map(skill => ({
            name: skill.name,
            description: skill.description || '',
            location: skill.source.toLowerCase(),
            path: skill.path,
            is_symlink: skill.isSymlink,
            ...(options.includeMetadata && {
                metadata: {
                    installed_date: skill.installedDate,
                    last_modified: skill.lastModified,
                    size: skill.size
                }
            })
        }))
    };

    return JSON.stringify(output, null, 2);
}

function generateYAMLOutput(skills: any[], options: SyncOptions): string {
    const output: any = {
        generated_at: new Date().toISOString(),
        skills_count: skills.length,
        skills: skills.map(skill => ({
            name: skill.name,
            description: skill.description || '',
            location: skill.source.toLowerCase(),
            path: skill.path,
            is_symlink: skill.isSymlink,
            ...(options.includeMetadata && {
                metadata: {
                    installed_date: skill.installedDate,
                    last_modified: skill.lastModified,
                    size: skill.size
                }
            })
        }))
    };

    // Simple YAML serializer
    return dumpYAML(output);
}

function generateSkillsBlock(skills: any[], options: SyncOptions): string {
    return `<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: \`npx ralphy-skills read <skill-name>\` (run in your shell)
  - For multiple: \`npx ralphy-skills read skill-one,skill-two\`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

${skills.map(s => `
<skill>
<name>${s.name}</name>
<description>${s.description || ''}</description>
<location>${s.source.toLowerCase()}</location>
</skill>`).join('\n')}

</available_skills>`;
}

// Simple YAML serializer (without external dependency)
function dumpYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj.toString();
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') {
        if (obj.includes('\n') || obj.includes(':') || obj.includes('{') || obj.includes('}')) {
            return '|\n' + obj.split('\n').map(line => spaces + '  ' + line).join('\n');
        }
        return obj;
    }
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => spaces + '- ' + dumpYAML(item, indent + 1).replace(/^\s+/, '')).join('\n');
    }
    
    if (typeof obj === 'object') {
        return Object.keys(obj).map(key => {
            const value = obj[key];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object' && !Array.isArray(value)) {
                return spaces + key + ':\n' + dumpYAML(value, indent + 1);
            }
            return spaces + key + ': ' + dumpYAML(value, indent);
        }).filter(line => line.trim()).join('\n');
    }
    
    return String(obj);
}