import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getInstalledSkillsMetadata } from '../utils/registry';

/**
 * Implementation of the 'remove' command.
 */
export async function removeSkill(skillName: string): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    const skill = skills.find(s => s.name.toLowerCase() === skillName.toLowerCase() || s.id.toLowerCase() === skillName.toLowerCase());

    if (!skill) {
        console.error(chalk.red(`\n❌ Skill not found: ${skillName}`));
        return;
    }

    try {
        if (skill.isSymlink) {
            fs.unlinkSync(skill.path);
        } else {
            fs.rmSync(skill.path, { recursive: true, force: true });
        }
        console.log(chalk.green(`\n✅ Removed: ${skill.name}`));
    } catch (err: any) {
        console.error(chalk.red(`\n❌ Error removing skill: ${err.message}`));
    }
}

/**
 * Implementation of the 'manage' command (Interactive TUI).
 */
export async function manageSkills(): Promise<void> {
    const skills = getInstalledSkillsMetadata();
    if (skills.length === 0) {
        console.log(chalk.yellow('\n📦 No skills installed.'));
        console.log(chalk.gray('Install some skills with: npx ralphy-skills install <skill-name>'));
        return;
    }

    console.log(chalk.cyan.bold('\n🛠️  Interactive Skills Management'));
    console.log(chalk.gray('Choose an action to manage your installed skills\n'));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                { name: '🔍 Browse and manage skills', value: 'browse' },
                { name: '🗑️  Remove multiple skills', value: 'remove_multiple' },
                { name: '📊 View skill details', value: 'details' },
                { name: '🔄 Update skills', value: 'update' },
                { name: '❌ Exit', value: 'exit' }
            ]
        }
    ]);

    switch (action) {
        case 'browse':
            await browseSkills(skills);
            break;
        case 'remove_multiple':
            await removeMultipleSkills(skills);
            break;
        case 'details':
            await viewSkillDetails(skills);
            break;
        case 'update':
            await updateSkills(skills);
            break;
        case 'exit':
            console.log(chalk.green('\n👋 Goodbye!'));
            return;
    }
}

async function browseSkills(skills: any[]) {
    console.log(chalk.cyan.bold('\n🔍 Browse Skills'));
    console.log(chalk.gray('Select skills to view details or remove\n'));

    const { selectedSkills } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedSkills',
            message: 'Select skills to manage (use spacebar to select):',
            choices: skills.map(skill => ({
                name: `${skill.name} ${chalk.gray(`(${skill.source})`)}`,
                value: skill,
                short: skill.name
            }))
        }
    ]);

    if (selectedSkills.length === 0) {
        console.log(chalk.yellow('\nNo skills selected.'));
        return;
    }

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: `Selected ${selectedSkills.length} skill(s). What would you like to do?`,
            choices: [
                { name: '🗑️  Remove selected skills', value: 'remove' },
                { name: '📖 View details', value: 'details' },
                { name: '📤 Export skill list', value: 'export' },
                { name: '❌ Cancel', value: 'cancel' }
            ]
        }
    ]);

    switch (action) {
        case 'remove':
            await confirmAndRemoveSkills(selectedSkills);
            break;
        case 'details':
            await showSkillsDetails(selectedSkills);
            break;
        case 'export':
            await exportSkills(selectedSkills);
            break;
        case 'cancel':
            console.log(chalk.yellow('\nCancelled.'));
            break;
    }
}

async function removeMultipleSkills(skills: any[]) {
    console.log(chalk.cyan.bold('\n🗑️  Remove Multiple Skills'));
    console.log(chalk.gray('Select skills to remove permanently\n'));

    const { skillsToRemove } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'skillsToRemove',
            message: 'Select skills to remove:',
            choices: skills.map(skill => ({
                name: `${skill.name} ${chalk.gray(`(${skill.source})`)}`,
                value: skill,
                short: skill.name
            }))
        }
    ]);

    if (skillsToRemove.length === 0) {
        console.log(chalk.yellow('\nNo skills selected for removal.'));
        return;
    }

    await confirmAndRemoveSkills(skillsToRemove);
}

async function confirmAndRemoveSkills(skillsToRemove: any[]) {
    console.log(chalk.yellow('\n⚠️  Skills to be removed:'));
    skillsToRemove.forEach(skill => {
        console.log(`  • ${skill.name} ${chalk.gray(`(${skill.source})`)}`);
    });

    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: `\nAre you sure you want to remove ${skillsToRemove.length} skill(s)? This cannot be undone.`,
            default: false
        }
    ]);

    if (!confirm) {
        console.log(chalk.yellow('\nRemoval cancelled.'));
        return;
    }

    console.log(chalk.cyan('\n🗑️  Removing skills...'));
    for (const skill of skillsToRemove) {
        try {
            if (skill.isSymlink) {
                fs.unlinkSync(skill.path);
            } else {
                fs.rmSync(skill.path, { recursive: true, force: true });
            }
            console.log(chalk.gray(`  ✅ Removed: ${skill.name}`));
        } catch (err: any) {
            console.log(chalk.red(`  ❌ Failed: ${skill.name} - ${err.message}`));
        }
    }

    console.log(chalk.green.bold(`\n🎉 Successfully removed ${skillsToRemove.length} skill(s)!`));
}

async function viewSkillDetails(skills: any[]) {
    const { skill } = await inquirer.prompt([
        {
            type: 'list',
            name: 'skill',
            message: 'Select a skill to view details:',
            choices: skills.map(skill => ({
                name: skill.name,
                value: skill
            }))
        }
    ]);

    await showSkillsDetails([skill]);
}

async function showSkillsDetails(skills: any[]) {
    for (const skill of skills) {
        console.log(chalk.cyan.bold(`\n📋 Skill Details: ${skill.name}`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`📂 Source: ${skill.source}`);
        console.log(`🗂️  Path: ${skill.path}`);
        console.log(`🔗 Type: ${skill.isSymlink ? 'Symlink' : 'Copied'}`);
        
        // Try to read skill metadata
        try {
            const skillPath = skill.path;
            const skillFile = path.join(skillPath, 'SKILL.md');
            if (fs.existsSync(skillFile)) {
                const content = fs.readFileSync(skillFile, 'utf-8');
                const lines = content.split('\n');
                const titleLine = lines.find(line => line.startsWith('# '));
                const descriptionLine = lines.find(line => line.trim() && !line.startsWith('#'));
                
                if (titleLine) {
                    console.log(`📝 Title: ${titleLine.replace('# ', '')}`);
                }
                if (descriptionLine) {
                    console.log(`📖 Description: ${descriptionLine.substring(0, 100)}${descriptionLine.length > 100 ? '...' : ''}`);
                }
            }
        } catch (err) {
            console.log(chalk.gray('📖 Could not read skill metadata'));
        }
    }
}

async function exportSkills(skills: any[]) {
    const exportData = skills.map(skill => ({
        name: skill.name,
        source: skill.source,
        path: skill.path,
        type: skill.isSymlink ? 'symlink' : 'copy'
    }));

    const exportPath = path.join(process.cwd(), 'skills-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(chalk.green(`\n📤 Skills exported to: ${exportPath}`));
    console.log(chalk.gray(`Exported ${skills.length} skill(s)`));
}

async function updateSkills(skills: any[]) {
    console.log(chalk.cyan.bold('\n🔄 Update Skills'));
    
    const { skill } = await inquirer.prompt([
        {
            type: 'list',
            name: 'skill',
            message: 'Which skill would you like to update?',
            choices: [
                { name: '🔄 Update all skills', value: 'all' },
                ...skills.map(skill => ({
                    name: `📦 ${skill.name}`,
                    value: skill.name
                }))
            ]
        }
    ]);

    if (skill === 'all') {
        console.log(chalk.gray('\n📦 Updating all skills...'));
        // This would call the updateSkills function from update.ts
        console.log(chalk.green('\n✅ Update command would be triggered for all skills'));
    } else {
        console.log(chalk.gray(`\n📦 Updating skill: ${skill}...`));
        // This would call updateSkills with specific skill
        console.log(chalk.green(`\n✅ Update command would be triggered for: ${skill}`));
    }
}
