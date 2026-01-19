import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
}

interface ValidationOptions {
    strict?: boolean;
    fix?: boolean;
}

export async function validateSkill(skillPath: string = '.', options: ValidationOptions = {}) {
    console.log(chalk.cyan('\n🔍 Validating skill...\n'));

    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        score: 100
    };

    const resolvedPath = path.resolve(skillPath);

    if (!fs.existsSync(resolvedPath)) {
        console.log(chalk.red(`❌ Path does not exist: ${resolvedPath}`));
        process.exit(1);
    }

    const isDirectory = fs.statSync(resolvedPath).isDirectory();
    const skillDir = isDirectory ? resolvedPath : path.dirname(resolvedPath);

    validateSkillMarkdown(skillDir, result, options);
    validateMarketplaceJson(skillDir, result, options);
    validateDirectoryStructure(skillDir, result, options);
    validateContent(skillDir, result, options);

    printResults(result, options);

    if (!result.valid) {
        process.exit(1);
    }

    console.log(chalk.green('\n✅ Validation passed!'));
    console.log(chalk.gray(`Score: ${result.score}/100\n`));
}

function validateSkillMarkdown(dir: string, result: ValidationResult, options: ValidationOptions) {
    const skillMdPath = path.join(dir, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
        result.valid = false;
        result.errors.push('SKILL.md not found');
        result.score -= 50;
        return;
    }

    console.log(chalk.blue('📄 Validating SKILL.md...'));

    const content = fs.readFileSync(skillMdPath, 'utf-8');

    try {
        const parsed = matter(content);

        const requiredFields = ['name', 'description', 'category', 'tags', 'author', 'version'];
        for (const field of requiredFields) {
            if (!parsed.data[field]) {
                result.errors.push(`Missing required field in frontmatter: ${field}`);
                result.score -= 5;
                result.valid = false;
            }
        }

        if (parsed.data.tags && !Array.isArray(parsed.data.tags)) {
            result.errors.push('Tags must be an array');
            result.score -= 3;
            result.valid = false;
        }

        const validCategories = [
            'development', 'automation', 'workflow', 'tools',
            'utilities', 'integration', 'productivity', 'testing', 'deployment'
        ];
        if (parsed.data.category && !validCategories.includes(parsed.data.category)) {
            result.warnings.push(`Category "${parsed.data.category}" is not standard. Consider: ${validCategories.join(', ')}`);
            result.score -= 2;
        }

        if (!parsed.content || parsed.content.trim().length < 100) {
            result.warnings.push('SKILL.md content is very short (< 100 chars)');
            result.score -= 5;
        }

        const sections = ['## Overview', '## Usage', '## Instructions', '## Examples'];
        for (const section of sections) {
            if (!parsed.content.includes(section)) {
                result.warnings.push(`Missing recommended section: ${section}`);
                result.score -= 3;
            }
        }

        console.log(chalk.green('  ✓ SKILL.md structure valid'));

    } catch (error) {
        result.valid = false;
        result.errors.push(`Failed to parse SKILL.md: ${error}`);
        result.score -= 20;
    }
}

function validateMarketplaceJson(dir: string, result: ValidationResult, options: ValidationOptions) {
    const marketplacePath = path.join(dir, 'marketplace.json');

    if (!fs.existsSync(marketplacePath)) {
        result.warnings.push('marketplace.json not found (recommended)');
        result.score -= 10;
        return;
    }

    console.log(chalk.blue('📦 Validating marketplace.json...'));

    try {
        const content = fs.readFileSync(marketplacePath, 'utf-8');
        const data = JSON.parse(content);

        const requiredFields = ['id', 'name', 'description', 'category', 'version', 'author'];
        for (const field of requiredFields) {
            if (!data[field]) {
                result.errors.push(`Missing required field in marketplace.json: ${field}`);
                result.score -= 3;
                if (options.strict) {
                    result.valid = false;
                }
            }
        }

        if (data.version && !/^\d+\.\d+\.\d+/.test(data.version)) {
            result.warnings.push('Version should follow semver format (x.y.z)');
            result.score -= 2;
        }

        if (data.tags && (!Array.isArray(data.tags) || data.tags.length === 0)) {
            result.warnings.push('Tags should be a non-empty array');
            result.score -= 2;
        }

        console.log(chalk.green('  ✓ marketplace.json structure valid'));

    } catch (error) {
        result.errors.push(`Failed to parse marketplace.json: ${error}`);
        result.score -= 15;
        if (options.strict) {
            result.valid = false;
        }
    }
}

function validateDirectoryStructure(dir: string, result: ValidationResult, options: ValidationOptions) {
    console.log(chalk.blue('📁 Validating directory structure...'));

    const recommendedFiles = ['README.md', '.gitignore'];
    const recommendedDirs = ['examples', 'references'];

    for (const file of recommendedFiles) {
        if (!fs.existsSync(path.join(dir, file))) {
            result.warnings.push(`Recommended file missing: ${file}`);
            result.score -= 2;
        }
    }

    for (const dir2 of recommendedDirs) {
        if (!fs.existsSync(path.join(dir, dir2))) {
            result.warnings.push(`Recommended directory missing: ${dir2}/`);
            result.score -= 3;
        }
    }

    const files = fs.readdirSync(dir);
    const hasContent = files.some(f => f.endsWith('.md') || f.endsWith('.json'));
    if (!hasContent) {
        result.errors.push('No content files found');
        result.score -= 20;
        result.valid = false;
    }

    console.log(chalk.green('  ✓ Directory structure checked'));
}

function validateContent(dir: string, result: ValidationResult, options: ValidationOptions) {
    console.log(chalk.blue('📝 Validating content quality...'));

    const skillMdPath = path.join(dir, 'SKILL.md');
    if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, 'utf-8');

        if (content.includes('TODO') || content.includes('FIXME')) {
            result.warnings.push('Found TODO/FIXME markers in content');
            result.score -= 5;
        }

        if (content.includes('example.com') || content.includes('TODO:')) {
            result.warnings.push('Found placeholder content that should be replaced');
            result.score -= 3;
        }

        const codeBlockCount = (content.match(/```/g) || []).length / 2;
        if (codeBlockCount === 0) {
            result.warnings.push('No code examples found (consider adding some)');
            result.score -= 5;
        }

        const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
        if (linkCount === 0) {
            result.warnings.push('No links found (consider adding references)');
            result.score -= 2;
        }
    }

    console.log(chalk.green('  ✓ Content quality checked'));
}

function printResults(result: ValidationResult, options: ValidationOptions) {
    console.log(chalk.cyan('\n📊 Validation Results:\n'));

    if (result.errors.length > 0) {
        console.log(chalk.red('Errors:'));
        result.errors.forEach(err => console.log(chalk.red(`  ❌ ${err}`)));
        console.log();
    }

    if (result.warnings.length > 0) {
        console.log(chalk.yellow('Warnings:'));
        result.warnings.forEach(warn => console.log(chalk.yellow(`  ⚠️  ${warn}`)));
        console.log();
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
        console.log(chalk.green('  ✅ No issues found!'));
    }

    console.log(chalk.cyan(`\nQuality Score: ${getScoreColor(result.score)}${result.score}/100${chalk.cyan('')}`));

    if (result.score < 70) {
        console.log(chalk.yellow('\n💡 Tips:'));
        console.log(chalk.gray('  - Add more detailed documentation'));
        console.log(chalk.gray('  - Include code examples'));
        console.log(chalk.gray('  - Add references and links'));
        console.log(chalk.gray('  - Create examples directory'));
    }
}

function getScoreColor(score: number): string {
    if (score >= 90) return chalk.green.bold(String(score));
    if (score >= 70) return chalk.yellow.bold(String(score));
    return chalk.red.bold(String(score));
}
