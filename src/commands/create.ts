import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { promptUser } from '../utils/prompt';

interface SkillTemplate {
    name: string;
    description: string;
    category: string;
    tags: string[];
    author: {
        name: string;
        email?: string;
        github?: string;
    };
    includeExamples: boolean;
    includeReferences: boolean;
    includeTests: boolean;
}

export async function createSkill(skillName?: string) {
    console.log(chalk.cyan('\n🚀 Skill Creator - Scaffold a new skill\n'));

    const answers = await promptUser([
        {
            type: 'input',
            name: 'name',
            message: 'Skill name:',
            default: skillName || 'my-awesome-skill',
            validate: (input: string) => {
                if (!/^[a-z0-9-]+$/.test(input)) {
                    return 'Skill name must contain only lowercase letters, numbers, and hyphens';
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'description',
            message: 'Short description:',
            validate: (input: string) => input.length > 0 || 'Description is required'
        },
        {
            type: 'list',
            name: 'category',
            message: 'Category:',
            choices: [
                'development',
                'automation',
                'workflow',
                'tools',
                'utilities',
                'integration',
                'productivity',
                'testing',
                'deployment'
            ]
        },
        {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated):',
            filter: (input: string) => input.split(',').map((t: string) => t.trim()).filter(Boolean)
        },
        {
            type: 'input',
            name: 'author.name',
            message: 'Author name:',
            default: () => {
                try {
                    return require('child_process').execSync('git config user.name', { encoding: 'utf8' }).trim();
                } catch {
                    return '';
                }
            }
        },
        {
            type: 'input',
            name: 'author.email',
            message: 'Author email (optional):',
            default: () => {
                try {
                    return require('child_process').execSync('git config user.email', { encoding: 'utf8' }).trim();
                } catch {
                    return '';
                }
            }
        },
        {
            type: 'input',
            name: 'author.github',
            message: 'GitHub username (optional):'
        },
        {
            type: 'confirm',
            name: 'includeExamples',
            message: 'Include examples directory?',
            default: true
        },
        {
            type: 'confirm',
            name: 'includeReferences',
            message: 'Include references directory?',
            default: false
        },
        {
            type: 'confirm',
            name: 'includeTests',
            message: 'Include test files?',
            default: false
        }
    ]);

    const skillPath = path.join(process.cwd(), answers.name);

    if (fs.existsSync(skillPath)) {
        console.log(chalk.red(`\n❌ Directory ${answers.name} already exists!`));
        process.exit(1);
    }

    console.log(chalk.cyan('\n📁 Creating skill directory structure...\n'));

    fs.mkdirSync(skillPath, { recursive: true });

    const skillMd = generateSkillMarkdown(answers);
    fs.writeFileSync(path.join(skillPath, 'SKILL.md'), skillMd);
    console.log(chalk.green('✓ Created SKILL.md'));

    const marketplaceJson = generateMarketplaceJson(answers);
    fs.writeFileSync(path.join(skillPath, 'marketplace.json'), JSON.stringify(marketplaceJson, null, 2));
    console.log(chalk.green('✓ Created marketplace.json'));

    const readme = generateReadme(answers);
    fs.writeFileSync(path.join(skillPath, 'README.md'), readme);
    console.log(chalk.green('✓ Created README.md'));

    if (answers.includeExamples) {
        fs.mkdirSync(path.join(skillPath, 'examples'), { recursive: true });
        fs.writeFileSync(
            path.join(skillPath, 'examples', 'example-1.md'),
            `# Example 1: ${answers.name}\n\nYour example here...\n`
        );
        console.log(chalk.green('✓ Created examples/'));
    }

    if (answers.includeReferences) {
        fs.mkdirSync(path.join(skillPath, 'references'), { recursive: true });
        fs.writeFileSync(
            path.join(skillPath, 'references', 'reference-1.md'),
            `# Reference Documentation\n\nYour reference docs here...\n`
        );
        console.log(chalk.green('✓ Created references/'));
    }

    if (answers.includeTests) {
        fs.mkdirSync(path.join(skillPath, 'tests'), { recursive: true });
        fs.writeFileSync(
            path.join(skillPath, 'tests', 'skill.test.md'),
            `# Test Cases\n\n## Test 1\nExpected behavior...\n`
        );
        console.log(chalk.green('✓ Created tests/'));
    }

    fs.writeFileSync(
        path.join(skillPath, '.gitignore'),
        'node_modules/\n.DS_Store\n*.log\n'
    );
    console.log(chalk.green('✓ Created .gitignore'));

    console.log(chalk.cyan('\n✨ Skill created successfully!\n'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.white(`  1. cd ${answers.name}`));
    console.log(chalk.white('  2. Edit SKILL.md with your skill content'));
    console.log(chalk.white('  3. npx ralphy-skills validate'));
    console.log(chalk.white('  4. npx ralphy-skills install . --symlink (for testing)'));
    console.log(chalk.white('  5. Publish to GitHub and submit to marketplace\n'));
}

function generateSkillMarkdown(data: SkillTemplate): string {
    return `---
name: ${data.name}
description: ${data.description}
category: ${data.category}
tags: [${data.tags.map(t => `"${t}"`).join(', ')}]
author: ${data.author.name}${data.author.email ? `\nemail: ${data.author.email}` : ''}${data.author.github ? `\ngithub: ${data.author.github}` : ''}
version: 1.0.0
---

# ${data.name}

${data.description}

## Overview

<!-- Add a detailed overview of what this skill does -->

## Usage

<!-- Explain how AI agents should use this skill -->

\`\`\`bash
# Example command or workflow
\`\`\`

## Instructions for AI Agents

<!-- Clear, actionable instructions for AI agents -->

1. **Step 1**: ...
2. **Step 2**: ...
3. **Step 3**: ...

## Best Practices

- ✅ DO: ...
- ❌ DON'T: ...

## Examples

<!-- Provide concrete examples -->

### Example 1: ...

<!-- Example code or workflow -->

## References

<!-- Link to official docs, guides, etc. -->

- [Official Documentation](https://example.com)

## Compatibility

- **AI Agents**: Claude Code, Cursor, Windsurf, Aider
- **Requirements**: ...

## License

MIT
`;
}

function generateMarketplaceJson(data: SkillTemplate): any {
    return {
        id: data.name,
        name: data.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: data.description,
        category: data.category,
        tags: data.tags,
        version: '1.0.0',
        author: {
            name: data.author.name,
            ...(data.author.email && { email: data.author.email }),
            ...(data.author.github && { github: data.author.github })
        },
        compatible_agents: ['claude-code', 'cursor', 'windsurf', 'aider'],
        requirements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

function generateReadme(data: SkillTemplate): string {
    return `# ${data.name}

${data.description}

## Installation

\`\`\`bash
# Install from registry
npx ralphy-skills install ${data.name}

# Install from local directory
npx ralphy-skills install . --symlink
\`\`\`

## Usage

See [SKILL.md](./SKILL.md) for detailed instructions.

## Author

${data.author.name}${data.author.email ? ` <${data.author.email}>` : ''}

## License

MIT
`;
}
